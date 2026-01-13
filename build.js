const fs = require('fs-extra');
const path = require('path');
const minimist = require('minimist');
const archiver = require('archiver');
const { copyDirWithMinification, minifyFile, essentialFiles, essentialDirs } = require('./build-utils');

const args = minimist(process.argv.slice(2));
const minify = args.minify || args.release || false;
const release = args.release || false;
const githubPages = args['github-pages'] || false;
const dev = args.dev || false;

// Debug mode: enabled by default, but forced to false in release builds
const debugMode = release ? false : true;

// Directories to exclude from copying (development-only)
const excludeDirs = [
    'test',
    'memory-bank',
    'content',
    '.git',
    'dist',
    'node_modules'
];

// HTML transform function - no transformations needed for Headlines
function htmlTransform(content, filename) {
    return content;
}

async function buildWebStandalone() {
    const outDir = path.join(__dirname, 'dist', 'web-standalone');

    console.log('Building Headlines web standalone to:', outDir);
    console.log(`Mode: ${release ? 'RELEASE' : 'DEVELOPMENT'}`);
    console.log(`Minification: ${minify ? 'ENABLED' : 'DISABLED'}\n`);

    // Ensure output directory exists and is clean
    await fs.emptyDir(outDir);

    // Copy essential files (with optional minification)
    console.log('Copying essential files...');
    for (const file of essentialFiles) {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(outDir, file);

        if (await fs.pathExists(srcPath)) {
            await minifyFile(srcPath, destPath, file, {
                minify,
                release,
                debugMode,
                htmlTransform: htmlTransform,
                verbose: true
            });
        } else {
            console.warn(`  ⚠ ${file} not found, skipping`);
        }
    }

    // Copy essential directories (with optional minification)
    console.log('\nCopying essential directories...');
    for (const dir of essentialDirs) {
        const srcDir = path.join(__dirname, dir);
        const destDir = path.join(outDir, dir);

        await copyDirWithMinification(srcDir, destDir, dir, {
            minify,
            release,
            debugMode,
            htmlTransform: htmlTransform
        });
    }

    // Copy launcher scripts
    console.log('\nCopying launcher scripts...');
    const launcherScripts = ['launch.bat', 'launch.sh'];
    for (const script of launcherScripts) {
        const srcPath = path.join(__dirname, script);
        const destPath = path.join(outDir, script);

        if (await fs.pathExists(srcPath)) {
            await fs.copy(srcPath, destPath);
            console.log(`  ✓ ${script}`);
        } else {
            console.warn(`  ⚠ ${script} not found, skipping`);
        }
    }

    console.log('\nBuild completed successfully!');
    console.log(`Output: ${outDir}`);
}

async function buildGitHubPages() {
    const outDir = path.join(__dirname, 'dist', 'github-pages');
    const buildRelease = !dev;
    const buildMinify = buildRelease;
    const buildDebugMode = dev;

    console.log('Building Headlines GitHub Pages to:', outDir);
    console.log(`Mode: ${buildRelease ? 'RELEASE' : 'DEVELOPMENT'}`);
    console.log(`Minification: ${buildMinify ? 'ENABLED' : 'DISABLED'}\n`);

    // Ensure output directory exists and is clean
    await fs.emptyDir(outDir);

    // Copy essential files (with optional minification)
    console.log('Copying essential files...');
    for (const file of essentialFiles) {
        const srcPath = path.join(__dirname, file);
        const destPath = path.join(outDir, file);

        if (await fs.pathExists(srcPath)) {
            await minifyFile(srcPath, destPath, file, {
                minify: buildMinify,
                release: buildRelease,
                debugMode: buildDebugMode,
                htmlTransform: htmlTransform,
                verbose: true
            });
        } else {
            console.warn(`  ⚠ ${file} not found, skipping`);
        }
    }

    // Copy essential directories (with optional minification)
    console.log('\nCopying essential directories...');
    for (const dir of essentialDirs) {
        const srcDir = path.join(__dirname, dir);
        const destDir = path.join(outDir, dir);

        await copyDirWithMinification(srcDir, destDir, dir, {
            minify: buildMinify,
            release: buildRelease,
            debugMode: buildDebugMode,
            htmlTransform: htmlTransform
        });
    }

    // Note: No launcher scripts for GitHub Pages

    console.log('\nBuild completed successfully!');
    console.log(`Output: ${outDir}`);
}

async function createZipArchive(sourceDir, zipName) {
    const zipPath = path.join(__dirname, 'dist', zipName);

    if (!(await fs.pathExists(sourceDir))) {
        console.warn(`${path.basename(sourceDir)} directory not found, skipping zip creation`);
        return;
    }

    console.log('\nCreating zip archive...');

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            console.log(`  ✓ ${zipName} (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, path.basename(sourceDir));
        archive.finalize();
    });
}

async function main() {
    try {
        // Ensure dist directory exists
        await fs.ensureDir(path.join(__dirname, 'dist'));

        if (githubPages) {
            // Build GitHub Pages
            await buildGitHubPages();

            // Create zip archive
            const outDir = path.join(__dirname, 'dist', 'github-pages');
            await createZipArchive(outDir, 'headlines-github-pages.zip');

            console.log('\n🎉 GitHub Pages build completed successfully!');
            console.log('Files created:');
            console.log('  - dist/github-pages/ (GitHub Pages ready)');
            console.log('  - dist/headlines-github-pages.zip (distributable archive)');
        } else {
            // Build web standalone
            await buildWebStandalone();

            // Create zip archive
            const outDir = path.join(__dirname, 'dist', 'web-standalone');
            await createZipArchive(outDir, 'headlines-webstandalone.zip');

            console.log('\n🎉 Build completed successfully!');
            console.log('Files created:');
            console.log('  - dist/web-standalone/ (runnable game)');
            console.log('  - dist/headlines-webstandalone.zip (distributable archive)');
        }

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

main();