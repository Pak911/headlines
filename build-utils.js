/**
 * Shared build utilities for Headlines crossword game
 * Contains common functions for file copying, minification, and directory handling
 */

const fs = require('fs-extra');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');

/**
 * Essential files that must be included in all builds
 */
const essentialFiles = [
    'index.html',
    'data.js',
    'data-audio.js',
    'news-fetching-config.js',
    'README.md'
];

/**
 * Essential directories that must be included in all builds
 */
const essentialDirs = [
    'css',      // All CSS files needed for styling
    'js',       // All JavaScript modules
    'fonts',    // Font files for typography
    'imgs'      // Image files (PNG) for UI elements
];

/**
 * Files that should NEVER be minified (even in release builds)
 */
const NO_MINIFY_FILES = [
    'data.js',
    'data-audio.js',
    'news-fetching-config.js'
];

/**
 * List of binary file extensions that should be copied without text processing
 */
const BINARY_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.mp4', '.webm', '.ogg', '.wav', '.mp3',
    '.pak', '.ttf', '.woff', '.woff2', '.eot'
];

/**
 * Check if a file is binary based on extension
 * @param {string} filename - The filename to check
 * @returns {boolean} - True if file is binary
 */
function isBinaryFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return BINARY_EXTENSIONS.includes(ext);
}

/**
 * Check if a file should be minified
 * @param {string} filename - The filename to check
 * @param {boolean} minify - Whether minification is enabled
 * @returns {boolean} - True if file should be minified
 */
function shouldMinify(filename, minify) {
    if (!minify) return false;
    return !NO_MINIFY_FILES.includes(filename);
}

/**
 * Minify a single file based on its extension
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {string} filename - Filename
 * @param {object} options - Minification options
 * @param {boolean} options.minify - Whether to minify
 * @param {boolean} options.release - Whether this is a release build
 * @param {boolean} options.debugMode - Debug mode flag
 * @param {Function} options.htmlTransform - Optional HTML transform function
 * @param {boolean} options.verbose - Whether to log (default: true)
 */
async function minifyFile(srcPath, destPath, filename, options = {}) {
    const {
        minify = false,
        release = false,
        debugMode = true,
        htmlTransform = null,
        verbose = true
    } = options;

    const ext = path.extname(filename).toLowerCase();

    // Binary files - copy directly without trying to read as text
    if (isBinaryFile(filename)) {
        await fs.copy(srcPath, destPath);
        if (verbose) console.log(`  ✓ ${filename} (copied)`);
        return;
    }

    const content = await fs.readFile(srcPath, 'utf8');

    let minifiedContent = content;

    try {
        let processedContent = content;

        // Remove Eruda code block in release builds
        if (release) {
            processedContent = processedContent.replace(/\/\/ BUILD_ERUDA_START[\s\S]*?\/\/ BUILD_ERUDA_END/g, '');
        }

        // Uncomment release code blocks in release builds
        if (release) {
            processedContent = processedContent.replace(/\/\/ BUILD_RELEASE_START[\s\S]*?\/\/ BUILD_RELEASE_END/g, (match) => {
                let content = match.replace(/^\/\/ BUILD_RELEASE_START/, '').replace(/\/\/ BUILD_RELEASE_END$/, '');
                return content.replace(/^\/\/+\s*/gm, '');
            });
        }

        if (ext === '.js') {
            // Special handling for data.js - inject build-time debug flag
            if (filename === 'data.js') {
                processedContent = content.replace(
                    /__BUILD_DEBUG_MODE__/g,
                    debugMode.toString()
                );
                if (verbose) console.log(`  ✓ ${filename} (debug mode: ${debugMode})`);
            }

            // Check if this file should be minified
            const doMinify = shouldMinify(filename, minify);

            if (doMinify) {
                // Minify and obfuscate JS files
                const result = await minifyJS(processedContent, {
                    compress: {
                        drop_console: false,
                        drop_debugger: true,
                    },
                    mangle: true,
                    format: {
                        comments: false,
                    },
                });
                minifiedContent = result.code;
                if (verbose) console.log(`  ✓ ${filename} (minified/obfuscated)`);
            } else {
                minifiedContent = processedContent;
                if (verbose) console.log(`  ✓ ${filename} (copied${doMinify ? '' : ' - no minification'})`);
            }
        } else if (ext === '.css') {
            if (shouldMinify(filename, minify)) {
                const cleanCSS = new CleanCSS({
                    level: 2,
                });
                const result = cleanCSS.minify(content);
                if (result.errors && result.errors.length > 0) {
                    console.warn(`  ⚠ CSS minification errors for ${filename}:`, result.errors);
                    minifiedContent = content;
                    if (verbose) console.log(`  ✓ ${filename} (copied - minification failed)`);
                } else {
                    minifiedContent = result.styles;
                    if (verbose) console.log(`  ✓ ${filename} (minified)`);
                }
            } else {
                minifiedContent = content;
                if (verbose) console.log(`  ✓ ${filename} (copied - no minification)`);
            }
        } else if (ext === '.html') {
            // Apply optional HTML transformation
            if (htmlTransform && typeof htmlTransform === 'function') {
                processedContent = htmlTransform(content, filename);
            }

            if (shouldMinify(filename, minify)) {
                minifiedContent = await minifyHTML(processedContent, {
                    collapseWhitespace: true,
                    removeComments: true,
                    minifyJS: true,
                    minifyCSS: true,
                });
                if (verbose) console.log(`  ✓ ${filename} (minified)`);
            } else {
                minifiedContent = processedContent;
                if (verbose) console.log(`  ✓ ${filename} (transformed - no minification)`);
            }
        } else {
            if (verbose) console.log(`  ✓ ${filename} (copied)`);
        }

        await fs.writeFile(destPath, minifiedContent);
    } catch (error) {
        console.warn(`  ⚠ Failed to minify ${filename}, copying as-is:`, error.message);
        await fs.writeFile(destPath, content);
    }
}

/**
 * Copy directory with optional minification (directory-level logging)
 * This is the preferred function for copying directories - logs at directory level, not per-file.
 * Handles binary files (fonts) specially by copying them directly.
 *
 * @param {string} srcDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @param {string} dirName - Directory name (for logging)
 * @param {object} options - Copy options
 * @param {boolean} options.minify - Whether to minify
 * @param {boolean} options.release - Whether this is a release build
 * @param {boolean} options.debugMode - Debug mode flag
 * @param {Function} options.htmlTransform - Optional HTML transform function
 * @param {Array<string>} options.excludeFiles - Files to exclude from copying
 */
async function copyDirWithMinification(srcDir, destDir, dirName, options = {}) {
    const {
        minify = false,
        release = false,
        debugMode = true,
        htmlTransform = null,
        excludeFiles = []
    } = options;

    if (await fs.pathExists(srcDir)) {
        // Skip minification for fonts directory (binary files)
        if (dirName === 'fonts') {
            await fs.copy(srcDir, destDir);
            console.log(`  ✓ ${dirName}/ (copied - binary files)`);
            return;
        }

        if (minify) {
            // Recursively copy and minify files
            await fs.ensureDir(destDir);
            const items = await fs.readdir(srcDir, { withFileTypes: true });

            for (const item of items) {
                // Skip excluded files
                if (excludeFiles.includes(item.name)) {
                    continue;
                }

                const srcPath = path.join(srcDir, item.name);
                const destPath = path.join(destDir, item.name);

                if (item.isDirectory()) {
                    await copyDirWithMinification(srcPath, destPath, item.name, options);
                } else if (item.isFile()) {
                    await minifyFile(srcPath, destPath, item.name, {
                        minify,
                        release,
                        debugMode,
                        htmlTransform,
                        verbose: false  // Suppress individual file logs
                    });
                }
            }
            console.log(`  ✓ ${dirName}/ (with minification)`);
        } else {
            await fs.copy(srcDir, destDir, {
                filter: (src) => {
                    const basename = path.basename(src);
                    return !excludeFiles.includes(basename);
                }
            });
            console.log(`  ✓ ${dirName}/`);
        }
    } else {
        console.warn(`  ⚠ ${dirName}/ not found, skipping`);
    }
}

/**
 * Copy directory recursively with optional minification
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 * @param {object} options - Copy options
 * @param {boolean} options.minify - Whether to minify files
 * @param {boolean} options.release - Whether this is a release build
 * @param {boolean} options.debugMode - Debug mode flag
 * @param {Function} options.htmlTransform - Optional HTML transform function
 * @param {Array<string>} options.excludeFiles - Files to exclude
 * @param {boolean} options.verbose - Whether to log each file (default: false)
 */
async function copyDirectory(srcDir, destDir, options = {}) {
    const {
        minify = false,
        release = false,
        debugMode = true,
        htmlTransform = null,
        excludeFiles = [],
        verbose = false
    } = options;

    await fs.ensureDir(destDir);
    const items = await fs.readdir(srcDir, { withFileTypes: true });

    for (const item of items) {
        // Skip excluded files
        if (excludeFiles.includes(item.name)) {
            continue;
        }

        const srcPath = path.join(srcDir, item.name);
        const destPath = path.join(destDir, item.name);

        if (item.isDirectory()) {
            await copyDirectory(srcPath, destPath, { ...options, verbose });
        } else if (item.isFile()) {
            await minifyFile(srcPath, destPath, item.name, {
                minify,
                release,
                debugMode,
                htmlTransform,
                verbose
            });
        }
    }
}

/**
 * Copy single file with optional minification
 * @param {string} srcPath - Source file path
 * @param {string} destPath - Destination file path
 * @param {object} options - Same as minifyFile options
 */
async function copyFile(srcPath, destPath, options = {}) {
    const filename = path.basename(srcPath);
    await minifyFile(srcPath, destPath, filename, options);
}

module.exports = {
    isBinaryFile,
    shouldMinify,
    minifyFile,
    copyDirWithMinification,
    copyDirectory,
    copyFile,
    BINARY_EXTENSIONS,
    NO_MINIFY_FILES,
    essentialFiles,
    essentialDirs
};