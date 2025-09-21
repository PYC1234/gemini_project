const sharp = require('sharp');
const fs = require('fs');

const inputFile = 'localhost.png';
const outputDir = 'processed_images';
const tempFile = 'trimmed_temp.png';
const chunkWidth = 900; // Width for each chunk, maintaining 3:4 ratio
const chunkHeight = 1200; // Height for each chunk

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function processImage() {
  try {
    console.log(`Trimming image and saving to temporary file...`);
    await sharp(inputFile).trim().toFile(tempFile);

    const metadata = await sharp(tempFile).metadata();
    const totalHeight = metadata.height;
    console.log(`Trimmed image dimensions: ${chunkWidth}x${totalHeight}`);

    let chunkCount = 0;
    for (let y = 0; y < totalHeight; y += chunkHeight) {
      chunkCount++;
      const currentChunkHeight = Math.min(chunkHeight, totalHeight - y);
      const outputPath = `${outputDir}/part_${String(chunkCount).padStart(2, '0')}.png`;

      console.log(`Processing chunk ${chunkCount}...`);
      
      // Re-load the image from the temp file in every iteration to ensure a clean state
      const extractedImage = await sharp(tempFile)
        .extract({ left: 0, top: y, width: chunkWidth, height: currentChunkHeight })
        .toBuffer();

      await sharp({
          create: {
            width: chunkWidth,
            height: currentChunkHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{ input: extractedImage, top: 0, left: 0 }])
        .toFile(outputPath);
    }

    console.log(`
Success! ${chunkCount} images saved in '${outputDir}'.`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(`Cleaned up temporary file.`);
    }
  }
}

processImage();