#!/usr/bin/env node

/**
 * Dependency Optimization Script
 * Analyzes and suggests optimizations for heavy dependencies
 */

const fs = require("fs");
const path = require("path");

console.log("📦 Starting Dependency Optimization Analysis...\n");

// Read package.json
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

// Heavy libraries and their optimization strategies
const OPTIMIZATION_STRATEGIES = {
  "date-fns": {
    issue: "Large bundle size when importing entire library",
    solution: "Use individual function imports",
    examples: [
      'Before: import { format, parseISO } from "date-fns";',
      'After: import format from "date-fns/format";',
      'After: import parseISO from "date-fns/parseISO";',
    ],
    webpack: "Add babel-plugin-date-fns for automatic tree shaking",
  },
  "framer-motion": {
    issue: "Large animation library with many features",
    solution: "Import only needed components and use lazy loading",
    examples: [
      'Before: import { motion, AnimatePresence } from "framer-motion";',
      'After: import { motion } from "framer-motion/dist/framer-motion";',
      "Or use dynamic imports for non-critical animations",
    ],
    webpack: "Consider splitting animations into separate chunks",
  },
  "react-icons": {
    issue: "Contains thousands of icons, often only few are used",
    solution: "Import only specific icons needed",
    examples: [
      'Before: import { FaUser, FaHome } from "react-icons/fa";',
      'After: import FaUser from "react-icons/fa/FaUser";',
      'After: import FaHome from "react-icons/fa/FaHome";',
    ],
    webpack: "Use babel-plugin-import for automatic optimization",
  },
  "@tiptap/react": {
    issue: "Rich text editor with many extensions",
    solution: "Import only needed extensions",
    examples: [
      "Import extensions individually",
      "Use dynamic imports for editor components",
    ],
  },
  firebase: {
    issue: "Large SDK with many services",
    solution: "Import only needed services",
    examples: [
      'Before: import firebase from "firebase/app";',
      'After: import { initializeApp } from "firebase/app";',
      'After: import { getFirestore } from "firebase/firestore";',
    ],
  },
};

// Analyze current usage patterns
function analyzeUsagePatterns() {
  console.log("🔍 Analyzing import patterns...\n");

  const results = [];
  const srcDir = ".";

  // Find all TypeScript/JavaScript files
  const findFiles = (dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) => {
    let files = [];

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);

      // Skip node_modules, .next, and other build directories
      if (
        item === "node_modules" ||
        item === ".next" ||
        item === "dist" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (extensions.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const files = findFiles(srcDir);
  const usagePatterns = {};

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");

      // Analyze imports for each heavy dependency
      for (const [dep, strategy] of Object.entries(OPTIMIZATION_STRATEGIES)) {
        if (dependencies[dep]) {
          const importRegex = new RegExp(`import.*from\\s+['"]${dep}['"]`, "g");
          const namedImportRegex = new RegExp(
            `import\\s+{([^}]+)}\\s+from\\s+['"]${dep}['"]`,
            "g",
          );

          const imports = content.match(importRegex) || [];
          const namedImports = content.match(namedImportRegex) || [];

          if (imports.length > 0) {
            if (!usagePatterns[dep]) {
              usagePatterns[dep] = { files: [], imports: [], namedImports: [] };
            }
            usagePatterns[dep].files.push(file);
            usagePatterns[dep].imports.push(...imports);
            usagePatterns[dep].namedImports.push(...namedImports);
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return usagePatterns;
}

// Generate optimization recommendations
function generateRecommendations(usagePatterns) {
  console.log("💡 DEPENDENCY OPTIMIZATION RECOMMENDATIONS");
  console.log("==========================================\n");

  const recommendations = [];

  for (const [dep, strategy] of Object.entries(OPTIMIZATION_STRATEGIES)) {
    if (dependencies[dep]) {
      console.log(`📦 ${dep}:`);
      console.log(`   Issue: ${strategy.issue}`);
      console.log(`   Solution: ${strategy.solution}\n`);

      if (usagePatterns[dep]) {
        console.log(
          `   Current usage found in ${usagePatterns[dep].files.length} files:`,
        );
        usagePatterns[dep].files.slice(0, 3).forEach((file) => {
          console.log(`   - ${file}`);
        });
        if (usagePatterns[dep].files.length > 3) {
          console.log(
            `   - ... and ${usagePatterns[dep].files.length - 3} more files`,
          );
        }

        console.log(`\n   Example imports found:`);
        usagePatterns[dep].imports.slice(0, 2).forEach((imp) => {
          console.log(`   ${imp}`);
        });
      }

      console.log(`\n   💡 Optimization examples:`);
      strategy.examples.forEach((example) => {
        console.log(`   ${example}`);
      });

      if (strategy.webpack) {
        console.log(`\n   🔧 Webpack/Build optimization:`);
        console.log(`   ${strategy.webpack}`);
      }

      console.log("\n" + "─".repeat(50) + "\n");

      recommendations.push({
        dependency: dep,
        strategy,
        usage: usagePatterns[dep] || null,
      });
    }
  }

  return recommendations;
}

// Generate babel configuration for optimizations
function generateBabelConfig() {
  const babelConfig = {
    plugins: [],
  };

  if (dependencies["date-fns"]) {
    babelConfig.plugins.push("babel-plugin-date-fns");
    console.log("🔧 Add to your babel config for date-fns optimization:");
    console.log("npm install --save-dev babel-plugin-date-fns");
  }

  if (dependencies["react-icons"]) {
    babelConfig.plugins.push([
      "babel-plugin-import",
      {
        libraryName: "react-icons",
        libraryDirectory: "",
        camel2DashComponentName: false,
      },
    ]);
    console.log("🔧 Add to your babel config for react-icons optimization:");
    console.log("npm install --save-dev babel-plugin-import");
  }

  if (babelConfig.plugins.length > 0) {
    console.log("\nBabel configuration (.babelrc.js):");
    console.log(JSON.stringify(babelConfig, null, 2));
  }
}

// Generate webpack optimization suggestions
function generateWebpackOptimizations() {
  console.log("\n🔧 WEBPACK OPTIMIZATION SUGGESTIONS");
  console.log("===================================\n");

  if (dependencies["framer-motion"]) {
    console.log("Framer Motion optimization in next.config.js:");
    console.log(`
webpack: (config) => {
  // Split framer-motion into separate chunk
  config.optimization.splitChunks.cacheGroups.framerMotion = {
    test: /[\\\\/]node_modules[\\\\/]framer-motion[\\\\/]/,
    name: 'framer-motion',
    chunks: 'all',
    priority: 30,
  };
  return config;
}
    `);
  }

  if (dependencies["react-icons"]) {
    console.log("React Icons tree shaking optimization:");
    console.log(`
webpack: (config) => {
  // Enable tree shaking for react-icons
  config.optimization.usedExports = true;
  config.optimization.sideEffects = false;
  return config;
}
    `);
  }
}

// Create optimized import examples
function createOptimizedExamples() {
  console.log("\n📝 OPTIMIZED IMPORT EXAMPLES");
  console.log("============================\n");

  // Create example files
  const examplesDir = "examples/optimized-imports";
  if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
  }

  // Date-fns example
  if (dependencies["date-fns"]) {
    const dateFnsExample = `
// ❌ Before: Imports entire library
import { format, parseISO, differenceInDays } from 'date-fns';

// ✅ After: Tree-shakable imports
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import differenceInDays from 'date-fns/differenceInDays';

// ✅ Alternative: Use dynamic imports for non-critical functionality
const formatDate = async (date: Date) => {
  const { format } = await import('date-fns');
  return format(date, 'yyyy-MM-dd');
};
`;
    fs.writeFileSync(
      path.join(examplesDir, "date-fns-optimized.ts"),
      dateFnsExample,
    );
  }

  // React Icons example
  if (dependencies["react-icons"]) {
    const reactIconsExample = `
// ❌ Before: Imports entire icon set
import { FaUser, FaHome, FaCog } from 'react-icons/fa';

// ✅ After: Individual icon imports (better tree shaking)
import FaUser from 'react-icons/fa/FaUser';
import FaHome from 'react-icons/fa/FaHome';
import FaCog from 'react-icons/fa/FaCog';

// ✅ Alternative: Dynamic icon loading
const DynamicIcon = ({ iconName }: { iconName: string }) => {
  const [Icon, setIcon] = useState(null);
  
  useEffect(() => {
    import(\`react-icons/fa/\${iconName}\`).then(module => {
      setIcon(module.default);
    });
  }, [iconName]);
  
  return Icon ? <Icon /> : null;
};
`;
    fs.writeFileSync(
      path.join(examplesDir, "react-icons-optimized.tsx"),
      reactIconsExample,
    );
  }

  console.log(`📁 Optimized import examples created in: ${examplesDir}`);
}

// Main execution
async function main() {
  const usagePatterns = analyzeUsagePatterns();
  const recommendations = generateRecommendations(usagePatterns);

  generateBabelConfig();
  generateWebpackOptimizations();
  createOptimizedExamples();

  // Save report
  const reportPath = ".next/dependency-optimization-report.json";
  const report = {
    timestamp: new Date().toISOString(),
    dependencies: Object.keys(dependencies),
    heavyDependencies: Object.keys(OPTIMIZATION_STRATEGIES).filter(
      (dep) => dependencies[dep],
    ),
    usagePatterns,
    recommendations,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Implement suggested import optimizations");
  console.log("2. Add babel plugins for automatic tree shaking");
  console.log("3. Update webpack configuration in next.config.js");
  console.log("4. Test bundle size improvements with npm run analyze");
  console.log("5. Consider dynamic imports for non-critical features\n");

  console.log(`📋 Detailed report saved to: ${reportPath}`);
  console.log("✅ Dependency optimization analysis completed!");
}

main().catch(console.error);
