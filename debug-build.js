// Debug script to test the production build locally
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🔍 Debugging GitHub Pages deployment...\n');

try {
  // Build the app
  console.log('1. Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if build files exist
  console.log('\n2. Checking build output...');
  const distExists = existsSync('dist/public');
  const indexExists = existsSync('dist/public/index.html');
  
  console.log(`dist/public exists: ${distExists}`);
  console.log(`index.html exists: ${indexExists}`);
  
  if (indexExists) {
    const indexContent = readFileSync('dist/public/index.html', 'utf8');
    console.log('\n3. Index.html content preview:');
    console.log(indexContent.substring(0, 500) + '...');
    
    // Check for asset paths
    const hasCorrectPaths = indexContent.includes('/video-transcript/assets/');
    console.log(`\nAsset paths fixed for subdirectory: ${hasCorrectPaths}`);
  }
  
  console.log('\n✅ Build completed successfully');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
}