const { chromium } = require('playwright');
const { spawn } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');

// --- Configuration ---
const outputDir = 'processed_images';
const fullScreenshot = 'full_screenshot.png';
const pageWidth = 900;
const pageHeight = 1200;

/**
 * Main function to generate images.
 */
async function main() {
  // --- 1. Setup ---
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir);

  const serverProcess = spawn('python', ['-u', '-m', 'http.server', '8000']);
  console.log('--- Starting Server ---');
  await new Promise(resolve => serverProcess.stdout.on('data', data => {
    if (data.toString().includes('Serving HTTP')) resolve();
  }));

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: pageWidth, height: pageHeight } });

  // --- 2. Take Screenshot ---
  console.log('--- Taking Screenshot ---');
  await page.goto('http://localhost:8000/');
  await page.screenshot({ path: fullScreenshot, fullPage: true });

  await browser.close();
  serverProcess.kill();
  console.log('--- Server Stopped ---');

  // --- 3. Process Images ---
  console.log('--- Processing Images ---');
  const metadata = await sharp(fullScreenshot).metadata();
  const totalHeight = metadata.height;
  let y = 0;
  let i = 1;

  while (y < totalHeight) {
    const remainingHeight = totalHeight - y;
    const currentChunkHeight = Math.min(pageHeight, remainingHeight);

    if (currentChunkHeight <= 0) break;

    const imageChunk = sharp(fullScreenshot)
      .extract({ left: 0, top: y, width: pageWidth, height: currentChunkHeight });

    if (currentChunkHeight < pageHeight) {
      // Pad the image
      await imageChunk
        .extend({
          top: 0,
          bottom: pageHeight - currentChunkHeight,
          left: 0,
          right: 0,
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        })
        .toFile(`${outputDir}/part_${String(i).padStart(2, '0')}.png`);
    } else {
      await imageChunk
        .toFile(`${outputDir}/part_${String(i).padStart(2, '0')}.png`);
    }

    console.log(`Generated part_${String(i).padStart(2, '0')}.png`);
    y += pageHeight;
    i++;
  }

  // --- 4. Cleanup ---
  fs.unlinkSync(fullScreenshot);
  console.log('--- Cleanup Complete ---');
  console.log('--- All Done ---');
}

main();