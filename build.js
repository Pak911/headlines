const fs = require('fs-extra');
const path = require('path');
const minimist = require('minimist');
const archiver = require('archiver');
const { copyDirWithMinification, minifyFile, essentialFiles, essentialDirs } = require('./build-utils');

const args = minimist(process.argv.slice(2));
const minify = args.minify || args.release || false;
const release = args.release || false;

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

async function createZipArchive() {
    const sourceDir = path.join(__dirname, 'dist', 'web-standalone');
    const zipPath = path.join(__dirname, 'dist', 'headlines-webstandalone.zip');

    if (!(await fs.pathExists(sourceDir))) {
        console.warn('Web standalone directory not found, skipping zip creation');
        return;
    }

    console.log('\nCreating zip archive...');

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            console.log(`  ✓ headlines-webstandalone.zip (${archive.pointer()} bytes)`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(sourceDir, 'headlines-webstandalone');
        archive.finalize();
    });
}

async function main() {
    try {
        // Ensure dist directory exists
        await fs.ensureDir(path.join(__dirname, 'dist'));

        // Build web standalone
        await buildWebStandalone();

        // Create zip archive
        await createZipArchive();

        console.log('\n🎉 Build completed successfully!');
        console.log('Files created:');
        console.log('  - dist/web-standalone/ (runnable game)');
        console.log('  - dist/headlines-webstandalone.zip (distributable archive)');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

main();