const sharp = require('sharp');
const fs = require('fs');

const inputFile = 'image.png';
const finalImage = 'final_image.png';
const outputDir = 'processed_images';
const tempFile = 'trimmed_temp.png';
const chunkWidth = 900;
const regularChunkHeight = 1200;
const secondToLastChunkHeight = 900;

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

    const chunks = [];
    let y = 0;

    if (totalHeight <= secondToLastChunkHeight) {
        chunks.push({ top: 0, height: totalHeight });
    } else {
        while (y < totalHeight) {
            let height = regularChunkHeight;
            const remaining = totalHeight - y;

            if (remaining <= regularChunkHeight + secondToLastChunkHeight) {
                height = remaining - secondToLastChunkHeight;
                if (height > 0) {
                    chunks.push({ top: y, height: height });
                }
                chunks.push({ top: y + height, height: secondToLastChunkHeight });
                break;
            } else {
                chunks.push({ top: y, height: height });
                y += height;
            }
        }
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkNumber = i + 1;
      const outputPath = `${outputDir}/part_${String(chunkNumber).padStart(2, '0')}.png`;

      console.log(`Processing chunk ${chunkNumber} with height ${chunk.height}...`);
      
      const extractedImage = await sharp(tempFile)
        .extract({ left: 0, top: chunk.top, width: chunkWidth, height: chunk.height })
        .toBuffer();

      await sharp({
          create: {
            width: chunkWidth,
            height: chunk.height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        })
        .composite([{ input: extractedImage, top: 0, left: 0 }])
        .toFile(outputPath);
    }

    // Copy the final_image.png as the last part
    const finalPartNumber = chunks.length + 1;
    const finalPartPath = `${outputDir}/part_${String(finalPartNumber).padStart(2, '0')}.png`;
    fs.copyFileSync(finalImage, finalPartPath);
    console.log(`Copied ${finalImage} to ${finalPartPath}`);


    console.log(`
Success! ${finalPartNumber} images saved in '${outputDir}'.`);

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