# PowerShell script to check Headlines GitHub Pages deployment completeness
# Run this script to ensure all necessary files are present for deployment

Write-Host "🔍 Checking Headlines GitHub Pages deployment completeness..."
Write-Host "=" * 60

# Check essential files
$essentialFiles = @('index.html', 'create-puzzle.html', 'data.js', 'data-audio.js', 'news-fetching-config.js', 'README.md')
$missingEssentials = @()
foreach ($file in $essentialFiles) {
    $path = "$PSScriptRoot\$file"
    if (Test-Path $path) {
        Write-Host "✅ $file"
    } else {
        Write-Host "❌ MISSING: $file"
        $missingEssentials += $file
    }
}

# Check essential directories
$essentialDirs = @('css', 'js', 'fonts', 'imgs')
$missingDirs = @()
foreach ($dir in $essentialDirs) {
    $path = "$PSScriptRoot\$dir"
    if (Test-Path $path) {
        $fileCount = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue).Count
        Write-Host "✅ $dir/ ($fileCount files)"
    } else {
        Write-Host "❌ MISSING DIR: $dir/"
        $missingDirs += $dir
    }
}

# Check build output
Write-Host "`n📦 Checking build output..."
$buildPath = "$PSScriptRoot\dist\github-pages"
if (Test-Path $buildPath) {
    $buildFiles = (Get-ChildItem -Path $buildPath -Recurse -File -ErrorAction SilentlyContinue).Count
    Write-Host "✅ Build output exists ($buildFiles files)"
} else {
    Write-Host "❌ Build output missing - run 'npm run build:github-pages'"
}

# Summary
Write-Host "`n" + "=" * 60
if ($missingEssentials.Count -eq 0 -and $missingDirs.Count -eq 0) {
    Write-Host "🎉 All essential files present! Ready for GitHub Pages deployment."
} else {
    Write-Host "❌ Issues found - fix before deploying"
    if ($missingEssentials.Count -gt 0) { Write-Host "  Missing files: $($missingEssentials -join ', ')" }
    if ($missingDirs.Count -gt 0) { Write-Host "  Missing dirs: $($missingDirs -join ', ')" }
}

Write-Host "`n💡 Commands:"
Write-Host "  Build: npm run build:github-pages"
Write-Host "  Check git: git status && git ls-files | grep -E '^(css|js|fonts|imgs|index.html|create-puzzle.html|data.js|data-audio.js|news-fetching-config.js|README.md)' | wc -l"
