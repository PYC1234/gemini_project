const { chromium } = require('playwright');
const { spawn } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');

// --- Configuration ---
const outputDir = 'processed_images';
const fullScreenshot = 'full_screenshot.png';
const pageWidth = 900; // Changed to 900px width
const pageHeight = 1200; // Moved to top

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

  // --- 2. Take Screenshot ---
  console.log('--- Taking Screenshot ---');
  // First, launch browser with a large enough viewport to capture everything
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: pageWidth, height: pageHeight } }); // Use pageHeight

  await page.goto('http://localhost:8000/');
  await page.screenshot({ path: fullScreenshot, fullPage: true });

  await browser.close();
  serverProcess.kill();
  console.log('--- Server Stopped ---');

  // --- 3. Process Images ---
  console.log('--- Processing Images ---');
  const metadata = await sharp(fullScreenshot).metadata();
  const totalHeight = metadata.height; // Get actual rendered height
  console.log(`Debug: totalHeight = ${totalHeight}`);
  let currentY = 0;
  let partIndex = 1;

  const lastImageHeight = 1600; // The new section
  const regularChunkHeight = 1200; // User's specified height for regular chunks

  // Calculate the starting Y for the last image (the 1600px new section)
  const startYForLast = totalHeight - lastImageHeight;

  // Process regular 900x1200 chunks from the top, stopping before startYForLast
  while (currentY < startYForLast) {
    const remainingHeightInRegularSection = startYForLast - currentY;
    const chunkHeight = Math.min(regularChunkHeight, remainingHeightInRegularSection); // Use regularChunkHeight

    if (chunkHeight <= 0) break;

    const imageChunk = sharp(fullScreenshot)
      .extract({ left: 0, top: currentY, width: pageWidth, height: chunkHeight });

    await imageChunk
      .toFile(`${outputDir}/part_${String(partIndex).padStart(2, '0')}.png`);

    console.log(`Generated part_${String(partIndex).padStart(2, '0')}.png`);
    currentY += chunkHeight;
    console.log(`Debug: currentY after chunk = ${currentY}`);
    partIndex++;
  }

  // The second to last image is this remaining part.
  const secondToLastImageHeight = startYForLast - currentY; // Dynamically calculated

  // Extract the second to last image (dynamically calculated height)
  if (secondToLastImageHeight > 0) {
    const secondToLastImage = sharp(fullScreenshot)
      .extract({ left: 0, top: currentY, width: pageWidth, height: secondToLastImageHeight });
    await secondToLastImage.toFile(`${outputDir}/part_${String(partIndex).padStart(2, '0')}.png`);
    console.log(`Generated part_${String(partIndex).padStart(2, '0')}.png`);
    partIndex++;
  }

  // Extract the last image (the new section, 1600px high)
  const actualLastImageHeight = Math.min(lastImageHeight, totalHeight - startYForLast);
  if (startYForLast >= 0 && actualLastImageHeight > 0) {
    const lastImage = sharp(fullScreenshot)
      .extract({ left: 0, top: startYForLast, width: pageWidth, height: actualLastImageHeight });
    await lastImage.toFile(`${outputDir}/part_${String(partIndex).padStart(2, '0')}.png`);
    console.log(`Generated part_${String(partIndex).padStart(2, '0')}.png`);
    partIndex++;
  }
  // --- 4. Cleanup ---
  // fs.unlinkSync(fullScreenshot); // Commented out as per user request
  // if (fs.existsSync(tempFile)) { // Removed tempFile cleanup
  //   fs.unlinkSync(tempFile);
  //   console.log(`Cleaned up temporary file: ${tempFile}`);
  // }
  console.log('--- Cleanup Complete ---');
  console.log('--- All Done ---');
}

main();