#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Configuration
const basePath = '/personalsite';
const outDir = path.resolve(process.cwd(), 'out');

// Create basePath directory if it doesn't exist
console.log(`Creating directory structure for ${basePath}...`);
const basePathDir = path.join(outDir, basePath.substring(1));
if (!fs.existsSync(basePathDir)) {
  fs.mkdirSync(basePathDir, { recursive: true });
}

// Copy necessary asset directories to the basePath directory
async function copyAssets() {
  console.log('Copying static assets to base path directory...');
  
  // Ensure _next directory exists in the base path
  const nextDir = path.join(basePathDir, '_next');
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }
  
  try {
    // Copy static assets
    await exec(`cp -r ${outDir}/_next/* ${nextDir}/`);
    console.log('_next directory copied successfully');
    
    // Copy images if they exist
    const imagesDir = path.join(outDir, 'images');
    if (fs.existsSync(imagesDir)) {
      const basePathImagesDir = path.join(basePathDir, 'images');
      if (!fs.existsSync(basePathImagesDir)) {
        fs.mkdirSync(basePathImagesDir, { recursive: true });
      }
      await exec(`cp -r ${imagesDir}/* ${basePathImagesDir}/`);
      console.log('images directory copied successfully');
    }
    
    // Copy additional files like runtime-config.js
    const runtimeConfigFile = path.join(outDir, 'runtime-config.js');
    if (fs.existsSync(runtimeConfigFile)) {
      await exec(`cp ${runtimeConfigFile} ${basePathDir}/`);
      console.log('runtime-config.js copied successfully');
    }
    
    // Copy styles.css if it exists
    const stylesFile = path.join(outDir, 'styles.css');
    if (fs.existsSync(stylesFile)) {
      await exec(`cp ${stylesFile} ${basePathDir}/`);
      console.log('styles.css copied successfully');
    }
    
    console.log('All static assets copied successfully');
  } catch (error) {
    console.error('Error copying assets:', error);
    process.exit(1);
  }
}

// Fix HTML files to ensure they use the correct asset paths
function fixHtmlFiles() {
  console.log('Fixing HTML asset paths...');
  
  // Process all HTML files in the out directory
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        processDirectory(filePath);
      } else if (file.endsWith('.html')) {
        // Fix paths in HTML files
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Ensure all asset paths have the basePath prefix
        content = content
          // Fix script src paths
          .replace(/src="\/_next\//g, `src="${basePath}/_next/`)
          // Fix stylesheet href paths
          .replace(/href="\/_next\//g, `href="${basePath}/_next/`)
          // Fix image src paths
          .replace(/src="\/images\//g, `src="${basePath}/images/`)
          // Fix favicon paths
          .replace(/href="\/favicon/g, `href="${basePath}/favicon`)
          // Fix other asset paths
          .replace(/src="\/public\//g, `src="${basePath}/public/`);
          
        fs.writeFileSync(filePath, content);
      }
    });
  }
  
  processDirectory(outDir);
  console.log('HTML asset paths fixed');
}

// Main function to fix paths
async function main() {
  console.log('Starting path fix process...');
  
  try {
    await copyAssets();
    fixHtmlFiles();
    
    console.log('Path fix process completed successfully');
  } catch (error) {
    console.error('Error during path fix process:', error);
    process.exit(1);
  }
}

// Execute the main function
main();