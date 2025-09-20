const sharp = require('sharp');
const fs = require('fs');

const inputFile = 'localhost.png';
const outputDir = 'processed_images';
const tempFile = 'trimmed_temp.png';
const chunkHeight = 600;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function processImage() {
  try {
    console.log(`Trimming image and saving to temporary file...`);
    await sharp(inputFile).trim().toFile(tempFile);

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
      
      // Re-load the image from the temp file in every iteration to ensure a clean state
      await sharp(tempFile)
        .extract({ left: 0, top: y, width: totalWidth, height: currentChunkHeight })
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