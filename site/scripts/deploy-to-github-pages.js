const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * GitHub Pages Deployment Script
 * 
 * Deploys the Hugo documentation site to GitHub Pages using the gh-pages branch method.
 * This script builds the site and pushes the public/ directory to the gh-pages branch.
 * 
 * Prerequisites:
 * - Git repository with remote origin configured
 * - Hugo site already built (public/ directory exists)
 * - Git working directory should be clean
 * 
 * Usage: node deploy-to-github-pages.js [--force]
 */

const SITE_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(SITE_DIR, 'public');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

console.log('🚀 GitHub Pages Deployment');
console.log('===========================');

// Check if force flag is provided
const forceFlag = process.argv.includes('--force');

// Validate prerequisites
console.log('\n🔍 Checking prerequisites...');

// Check if we're in a git repository
try {
  execSync('git rev-parse --git-dir', { cwd: REPO_ROOT, stdio: 'pipe' });
  console.log('✓ Git repository detected');
} catch (error) {
  console.error('✗ Not in a git repository');
  process.exit(1);
}

// Check if remote origin exists
try {
  const remoteUrl = execSync('git remote get-url origin', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  console.log(`✓ Remote origin: ${remoteUrl}`);
} catch (error) {
  console.error('✗ No remote origin configured');
  process.exit(1);
}

// Check if public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error('✗ Public directory not found. Run "hugo" to build the site first.');
  console.log('   Try: cd site && hugo');
  process.exit(1);
}
console.log('✓ Public directory exists');

// Check git status (unless force flag is used)
if (!forceFlag) {
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' });
    if (gitStatus.trim()) {
      console.warn('⚠️  Working directory has uncommitted changes:');
      console.log(gitStatus);
      console.log('   Use --force to deploy anyway, or commit changes first');
      process.exit(1);
    }
    console.log('✓ Working directory is clean');
  } catch (error) {
    console.error('✗ Could not check git status');
    process.exit(1);
  }
}

// Get current branch and commit info
let currentBranch, currentCommit;
try {
  currentBranch = execSync('git branch --show-current', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  currentCommit = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  console.log(`✓ Current branch: ${currentBranch} (${currentCommit})`);
} catch (error) {
  console.error('✗ Could not get git branch info');
  process.exit(1);
}

// Build the site first
console.log('\n🏗️  Building Hugo site...');
try {
  const hugoPath = `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Hugo.Hugo.Extended_Microsoft.Winget.Source_8wekyb3d8bbwe`;
  
  // Clean and rebuild
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  }
  
  execSync(`powershell -Command "$env:PATH = $env:PATH + ';${hugoPath}'; hugo --minify"`, { 
    cwd: SITE_DIR, 
    stdio: 'inherit' 
  });
  console.log('✓ Hugo build complete');
} catch (error) {
  console.error('✗ Hugo build failed:', error.message);
  process.exit(1);
}

// Verify build output
const indexPath = path.join(PUBLIC_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('✗ Build verification failed: index.html not found');
  process.exit(1);
}
console.log('✓ Build verification passed');

// Deploy to gh-pages branch
console.log('\n📤 Deploying to gh-pages branch...');

try {
  // Create a temporary directory for gh-pages
  const tempDir = path.join(REPO_ROOT, '.temp-gh-pages');
  
  // Clean up any existing temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Clone the repository to temp directory
  console.log('   Cloning repository...');
  execSync(`git clone . "${tempDir}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
  
  // Switch to gh-pages branch (create if doesn't exist)
  console.log('   Switching to gh-pages branch...');
  try {
    execSync('git checkout gh-pages', { cwd: tempDir, stdio: 'pipe' });
  } catch (error) {
    // Branch doesn't exist, create it
    console.log('   Creating gh-pages branch...');
    execSync('git checkout --orphan gh-pages', { cwd: tempDir, stdio: 'pipe' });
    execSync('git rm -rf .', { cwd: tempDir, stdio: 'pipe' });
  }
  
  // Clear the gh-pages branch
  console.log('   Clearing gh-pages branch...');
  const files = fs.readdirSync(tempDir).filter(file => !file.startsWith('.git'));
  files.forEach(file => {
    const filePath = path.join(tempDir, file);
    fs.rmSync(filePath, { recursive: true, force: true });
  });
  
  // Copy public directory contents to gh-pages
  console.log('   Copying site files...');
  const publicFiles = fs.readdirSync(PUBLIC_DIR);
  publicFiles.forEach(file => {
    const srcPath = path.join(PUBLIC_DIR, file);
    const destPath = path.join(tempDir, file);
    fs.cpSync(srcPath, destPath, { recursive: true });
  });
  
  // Create .nojekyll file to disable Jekyll processing
  fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');
  
  // Add CNAME file if needed (uncomment and modify if you have a custom domain)
  // fs.writeFileSync(path.join(tempDir, 'CNAME'), 'your-domain.com');
  
  // Commit and push
  console.log('   Committing changes...');
  execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
  
  // Check if there are changes to commit
  try {
    execSync('git diff --cached --exit-code', { cwd: tempDir, stdio: 'pipe' });
    console.log('   No changes to deploy');
  } catch (error) {
    // There are changes, commit them
    const commitMessage = `Deploy site from ${currentBranch}@${currentCommit}`;
    execSync(`git commit -m "${commitMessage}"`, { cwd: tempDir, stdio: 'pipe' });
    
    console.log('   Pushing to GitHub...');
    execSync('git push origin gh-pages', { cwd: tempDir, stdio: 'inherit' });
    console.log('✓ Deployment successful!');
  }
  
  // Clean up temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });
  
} catch (error) {
  console.error('✗ Deployment failed:', error.message);
  
  // Clean up temp directory on error
  const tempDir = path.join(REPO_ROOT, '.temp-gh-pages');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  process.exit(1);
}

console.log('\n🎉 Deployment Complete!');
console.log('========================');
console.log('\n📋 Next Steps:');
console.log('1. Go to your GitHub repository settings');
console.log('2. Navigate to Pages section');
console.log('3. Set source to "Deploy from a branch"');
console.log('4. Select "gh-pages" branch and "/ (root)" folder');
console.log('5. Save the settings');
console.log('\n🌐 Your site will be available at:');
console.log('   https://lago-morph.github.io/musings/');
console.log('\n⏱️  Note: It may take a few minutes for changes to appear');

// Display some statistics
try {
  const stats = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
  const fileCount = stats.filter(dirent => dirent.isFile()).length;
  const dirCount = stats.filter(dirent => dirent.isDirectory()).length;
  console.log(`\n📊 Deployed: ${fileCount} files, ${dirCount} directories`);
} catch (error) {
  // Ignore stats errors
}