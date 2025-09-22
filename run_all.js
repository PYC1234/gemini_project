const { chromium } = require('playwright');
const { spawn } = require('child_process');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const outputDir = 'processed_images';
const fullScreenshot = 'long_screenshot.png';
const pageWidth = 900;
const pageHeight = 1200;
const lastChunkHeight = 1600;

// Example usage with multiple inputs:
const generationInputs = [
    {
        title: "第一个生成标题",
        content: "# 欢迎使用!\n\n这是**第一个**自动生成的页面内容。\n\n- 特点1\n- 特点2",
    },
    {
        title: "第二个生成标题",
        content: "## 更多信息\n\n这是**第二个**自动生成的页面内容，包含一些代码示例。\n\n```python\nprint('Hello from Python!')\n```",
    },
    {
        title: "第三个标题",
        content: "### 总结\n\n这是**第三个**内容，展示了列表和引用。\n\n> 引用文本\n\n*   项目A\n*   项目B",
    }
];

/**
 * Main function to generate images.
 */
async function main() {
  // --- 1. Setup ---
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir);

  const serverProcess = spawn('python', ['-u', '-m', 'http.server', '8000'], { cwd: __dirname });
  console.log('--- Starting Server ---');
  await new Promise(resolve => {
    serverProcess.stdout.on('data', data => {
      if (data.toString().includes('Serving HTTP')) {
        console.log(`Server output: ${data.toString().trim()}`);
        resolve();
      }
    });
    serverProcess.stderr.on('data', data => {
        console.error(`Server error: ${data.toString().trim()}`);
    });
  });

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: pageWidth, height: pageHeight } });

  // --- 2. Navigate and Inject Content ---
  console.log('--- Navigating and Injecting Content ---');
  await page.goto('http://localhost:8000/');

  await page.evaluate((inputs) => {
      const postsContainer = document.getElementById('posts-container');
      if (!postsContainer) {
          console.error('posts-container not found');
          return;
      }

      postsContainer.innerHTML = '';

      inputs.forEach((input) => {
          const postBlock = document.createElement('div');
          postBlock.className = 'post-block';

          const titleElement = document.createElement('h1');
          titleElement.className = 'post-title-dynamic';
          titleElement.textContent = input.title;

          const commentElement = document.createElement('p');
          commentElement.className = 'add-comment-dynamic';
          commentElement.textContent = '💬 Add Comment';

          const previewElement = document.createElement('div');
          previewElement.className = 'preview-dynamic';
          previewElement.innerHTML = marked.parse(input.content);

          postBlock.appendChild(titleElement);
          postBlock.appendChild(commentElement);
          postBlock.appendChild(previewElement);
          postsContainer.appendChild(postBlock);
      });

      const finalSection = document.createElement('div');
      finalSection.style.height = '1600px';
      finalSection.style.width = '900px';
      finalSection.style.backgroundColor = '#E6E4D7';
      finalSection.style.position = 'relative';

      finalSection.innerHTML = `
          <img src="image.png" style="position: absolute; bottom: 1200px; left: 50%; transform: translateX(-50%);">
          <img src="image.png" style="position: absolute; bottom: 1300px; left: calc(50% - 100px); transform: translateX(-50%); opacity: 0.5;">
          <p style="position: absolute; bottom: 1200px; color: #89A101; font-size: 40px; width: 100%; text-align: left; padding-left: 50px;">帮助老板们从1-10运转自团队</p>
          <p style="position: absolute; bottom: 400px; color: #89A101; font-size: 60px; width: 100%; text-align: center;">大康总讲</p>
          <p style="position: absolute; bottom: 250px; color: #89A101; font-size: 120px; width: 100%; text-align: center;">SOP</p>
          <p style="position: absolute; bottom: 150px; color: #CC4E65; font-size: 30px; width: 100%; text-align: left; padding-left: 50px;">关注我，一起共同用sop建设高效组织</p>
      `;

      postsContainer.appendChild(finalSection);
  }, generationInputs);

  await page.waitForTimeout(2000);

  // --- 3. Take Screenshot ---
  console.log('--- Taking Full Page Screenshot ---');
  const fullScreenshotPath = path.join(__dirname, fullScreenshot);
  await page.screenshot({ path: fullScreenshotPath, fullPage: true });

  await browser.close();
  serverProcess.kill();
  console.log('--- Server Stopped ---');

  // --- 4. Process Images (Splitting) ---
  console.log('--- Processing Images (Splitting) ---');
  const image = sharp(fullScreenshotPath);
  const metadata = await image.metadata();
  const totalHeight = metadata.height;
  const totalWidth = metadata.width;
  
  const chunks = [];
  let y = 0;

  while (y < totalHeight) {
    let height = pageHeight;
    const remaining = totalHeight - y;

    if (remaining <= lastChunkHeight) {
        height = remaining;
        chunks.push({ top: y, height: height });
        break;
    } else if (remaining <= pageHeight + lastChunkHeight) {
        height = remaining - lastChunkHeight;
        chunks.push({ top: y, height: height });
        chunks.push({ top: y + height, height: lastChunkHeight });
        break;
    } else {
        chunks.push({ top: y, height: height });
        y += height;
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkNumber = i + 1;
    const outputPath = path.join(outputDir, `part_${String(chunkNumber).padStart(2, '0')}.png`);

    console.log(`Processing chunk ${chunkNumber} with height ${chunk.height}...`);
    
    await sharp(fullScreenshotPath)
      .extract({ left: 0, top: chunk.top, width: totalWidth, height: chunk.height })
      .toFile(outputPath);
  }

  console.log('--- All Done ---');
}

main();
