#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts large images to WebP format and generates optimized versions
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = "public";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 85;

console.log("🖼️  Starting Image Optimization...\n");

async function optimizeImage(inputPath, outputDir) {
  const fileName = path.basename(inputPath, path.extname(inputPath));
  const relativePath = path.relative(PUBLIC_DIR, inputPath);

  console.log(`📸 Processing: ${relativePath}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(
      `   Original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${Math.round(metadata.size / 1024)}KB`,
    );

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate WebP version
    const webpPath = path.join(outputDir, `${fileName}.webp`);
    await image
      .resize({
        width: Math.min(metadata.width, MAX_WIDTH),
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    console.log(`   WebP: ${Math.round(webpStats.size / 1024)}KB saved`);

    // Generate optimized JPEG version (fallback)
    const jpegPath = path.join(outputDir, `${fileName}.jpg`);
    await image
      .resize({
        width: Math.min(metadata.width, MAX_WIDTH),
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(jpegPath);

    const jpegStats = fs.statSync(jpegPath);
    console.log(`   JPEG: ${Math.round(jpegStats.size / 1024)}KB saved`);

    const originalSize = metadata.size;
    const webpSavings = Math.round((1 - webpStats.size / originalSize) * 100);
    const jpegSavings = Math.round((1 - jpegStats.size / originalSize) * 100);

    console.log(`   💡 Savings: WebP ${webpSavings}%, JPEG ${jpegSavings}%\n`);

    return {
      original: { path: inputPath, size: originalSize },
      webp: { path: webpPath, size: webpStats.size },
      jpeg: { path: jpegPath, size: jpegStats.size },
      savings: { webp: webpSavings, jpeg: jpegSavings },
    };
  } catch (error) {
    console.error(`   ❌ Error processing ${relativePath}:`, error.message);
    return null;
  }
}

async function findAndOptimizeImages() {
  const results = [];

  const walkDir = async (dir) => {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await walkDir(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const sizeKB = stat.size / 1024;

          // Only optimize images larger than 50KB
          if (sizeKB > 50) {
            const outputDir = path.join(path.dirname(fullPath), "optimized");
            const result = await optimizeImage(fullPath, outputDir);
            if (result) {
              results.push(result);
            }
          }
        }
      }
    }
  };

  await walkDir(PUBLIC_DIR);
  return results;
}

// Generate Image component suggestions
function generateImageComponentSuggestions(results) {
  console.log("💡 Next.js Image Component Suggestions:\n");

  results.forEach((result) => {
    const relativePath = path.relative(PUBLIC_DIR, result.original.path);
    const webpPath = path.relative(PUBLIC_DIR, result.webp.path);
    const jpegPath = path.relative(PUBLIC_DIR, result.jpeg.path);

    console.log(`// Replace: <img src="/${relativePath}" />`);
    console.log(`<Image`);
    console.log(`  src="/${webpPath}"`);
    console.log(`  alt="Description"`);
    console.log(`  width={800} // Adjust as needed`);
    console.log(`  height={600} // Adjust as needed`);
    console.log(`  priority={false} // Set true for above-the-fold images`);
    console.log(`  placeholder="blur"`);
    console.log(
      `  blurDataURL="data:image/jpeg;base64,..." // Generate blur placeholder`,
    );
    console.log(`/>\n`);
  });
}

// Generate optimization report
function generateReport(results) {
  const totalOriginalSize = results.reduce(
    (sum, r) => sum + r.original.size,
    0,
  );
  const totalWebpSize = results.reduce((sum, r) => sum + r.webp.size, 0);
  const totalJpegSize = results.reduce((sum, r) => sum + r.jpeg.size, 0);

  const overallWebpSavings = Math.round(
    (1 - totalWebpSize / totalOriginalSize) * 100,
  );
  const overallJpegSavings = Math.round(
    (1 - totalJpegSize / totalOriginalSize) * 100,
  );

  console.log("📊 OPTIMIZATION SUMMARY");
  console.log("========================");
  console.log(`Images processed: ${results.length}`);
  console.log(`Original total size: ${Math.round(totalOriginalSize / 1024)}KB`);
  console.log(
    `WebP total size: ${Math.round(totalWebpSize / 1024)}KB (${overallWebpSavings}% savings)`,
  );
  console.log(
    `JPEG total size: ${Math.round(totalJpegSize / 1024)}KB (${overallJpegSavings}% savings)`,
  );
  console.log(
    `Potential bandwidth savings: ${Math.round((totalOriginalSize - totalWebpSize) / 1024)}KB per page load\n`,
  );

  // Save report
  const reportPath = ".next/image-optimization-report.json";
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      imagesProcessed: results.length,
      originalTotalSize: totalOriginalSize,
      webpTotalSize: totalWebpSize,
      jpegTotalSize: totalJpegSize,
      webpSavingsPercent: overallWebpSavings,
      jpegSavingsPercent: overallJpegSavings,
    },
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Detailed report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    const results = await findAndOptimizeImages();

    if (results.length === 0) {
      console.log("✅ No large images found that need optimization!");
      return;
    }

    generateImageComponentSuggestions(results);
    generateReport(results);

    console.log("\n🎯 Next Steps:");
    console.log("1. Update your components to use the optimized images");
    console.log("2. Replace <img> tags with Next.js <Image> components");
    console.log("3. Test the optimized images in your application");
    console.log("4. Consider implementing blur placeholders for better UX");
    console.log("\n✅ Image optimization completed!");
  } catch (error) {
    console.error("❌ Error during image optimization:", error);
    process.exit(1);
  }
}

main();
