const { chromium } = require('playwright');
const { spawn } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');

// --- Configuration ---
const screenshotFile = 'localhost.png';
const outputDir = 'processed_images';
const tempFile = 'trimmed_temp.png';
const chunkHeight = 600;

/**
 * Takes a full-page screenshot of the local server.
 * @returns {boolean} - True if screenshot was successful, false otherwise.
 */
async function takeScreenshot() {
  console.log('--- Starting Screenshot Process ---');
  const serverProcess = spawn('python', ['-u', '-m', 'http.server', '8000']);
  let screenshotSuccess = false;

  console.log('Starting local server...');
  try {
    await new Promise((resolve, reject) => {
      serverProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Serving HTTP')) {
          console.log('Server is running.');
          resolve();
        }
      });
      serverProcess.stderr.on('data', (data) => {
        console.error(`Server error: ${data}`);
        reject(data.toString());
      });
    });

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/');
    await page.screenshot({ path: screenshotFile, fullPage: true });
    await browser.close();
    screenshotSuccess = true;
    console.log(`Screenshot saved as ${screenshotFile}`);

  } catch (error) {
    console.error(`Error during screenshot process: ${error}`);
  } finally {
    serverProcess.kill();
    console.log('Server stopped.');
  }
  return screenshotSuccess;
}

/**
 * Processes the screenshot: trims and splits it.
 */
async function processImage() {
  console.log('\n--- Starting Image Processing Process ---');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    console.log(`Trimming image and saving to temporary file...`);
    await sharp(screenshotFile).trim().toFile(tempFile);

    const metadata = await sharp(tempFile).metadata();
    const totalHeight = metadata.height;
    const totalWidth = metadata.width;
    console.log(`Trimmed image dimensions: ${totalWidth}x${totalHeight}`);

    let chunkCount = 0;
    for (let y = 0; y < totalHeight; y += chunkHeight) {
      chunkCount++;
      const currentChunkHeight = Math.min(chunkHeight, totalHeight - y);
      const outputPath = `${outputDir}/part_${String(chunkCount).padStart(2, '0')}.png`;

      console.log(`Processing chunk ${chunkCount}...`);
      await sharp(tempFile)
        .extract({ left: 0, top: y, width: totalWidth, height: currentChunkHeight })
        .toFile(outputPath);
    }
    console.log(`\nSuccess! ${chunkCount} images saved in '${outputDir}'.`);

  } catch (error) {
    console.error('An error occurred during image processing:', error);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`Cleaned up temporary file.`);
    }
  }
}

/**
 * Main function to run all steps.
 */
async function main() {
  const screenshotTaken = await takeScreenshot();
  if (screenshotTaken) {
    await processImage();
  }
}

main();
