const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const DIST_DIR = path.join(__dirname, "dist");
const SRC_DIR = __dirname;

const JS_FILES = [
  "license.js",
  "strategy.js",
  "strategies.js",
  "stats.js",
  "content.js",
  "panel.js",
  "background.js",
];

const COPY_FILES = [
  "manifest.json",
  "panel.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
];

const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.2,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: true,
  renameGlobals: false, // keep window.AviatorStrategy etc accessible
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ["base64"],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: "function",
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function build() {
  console.log("Building obfuscated extension...\n");

  ensureDir(DIST_DIR);
  ensureDir(path.join(DIST_DIR, "icons"));

  // Obfuscate JS files
  for (const file of JS_FILES) {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(DIST_DIR, file);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP (not found): ${file}`);
      continue;
    }

    const source = fs.readFileSync(srcPath, "utf8");
    const result = JavaScriptObfuscator.obfuscate(source, OBFUSCATION_OPTIONS);
    fs.writeFileSync(distPath, result.getObfuscatedCode());

    const originalSize = (source.length / 1024).toFixed(1);
    const obfuscatedSize = (result.getObfuscatedCode().length / 1024).toFixed(1);
    console.log(`  OK: ${file} (${originalSize}KB → ${obfuscatedSize}KB)`);
  }

  // Copy non-JS files
  for (const file of COPY_FILES) {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(DIST_DIR, file);

    if (!fs.existsSync(srcPath)) {
      console.log(`  SKIP (not found): ${file}`);
      continue;
    }

    ensureDir(path.dirname(distPath));
    fs.copyFileSync(srcPath, distPath);
    console.log(`  COPY: ${file}`);
  }

  console.log(`\nDone! Distribution ready in: ${DIST_DIR}`);
  console.log("Upload the 'dist' folder to Chrome Web Store or distribute directly.");
}

build();
