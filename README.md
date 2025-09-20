# 网页截图与图像处理自动化脚本

这是一个 Node.js 脚本项目，旨在全自动地完成对本地网页的截图、裁剪和分割任务。

## 功能

主脚本 `run_all.js` 会依次执行以下所有操作：

1.  **启动本地服务**: 自动使用 Python 启动一个 HTTP 服务器，用于访问项目内的 `index.html`。
2.  **进行网页截图**: 使用 Playwright 自动化工具打开浏览器，访问本地页面，并截取一张完整的长图，保存为 `localhost.png`。
3.  **处理截图**: 截图成功后，使用 `sharp` 图像处理库对图片进行：
    *   **自动裁剪**: 去除图片两边的空白边缘。
    *   **分割图片**: 将裁剪后的长图分割成多张高度统一的小图片。
4.  **保存结果**: 所有处理后的小图片都会被保存在一个新的文件夹 `processed_images` 中。

## 环境要求

- **Node.js**: 建议使用 v14 或更高版本。
- **Python**: 建议使用 v3 或更高版本，且需要将其添加到系统的环境变量 (PATH) 中。

## 安装

在开始之前，您需要安装脚本所需的依赖库。

1.  在您的终端中，进入项目所在的文件夹。
2.  运行以下命令来安装 `playwright` 和 `sharp`：

    ```bash
    npm install playwright sharp
    ```

## 如何使用

安装完依赖后，只需运行主脚本即可。

```bash
npm run_all.js
```

脚本会开始执行，并在控制台打印出每一步的进度，包括服务器启动、截图、图片处理等。

## 输出

脚本成功运行后，您会在项目根目录下看到一个名为 `processed_images` 的新文件夹。里面包含了所有从长图中分割出来的小图片，它们会按 `part_01.png`, `part_02.png`, ... 的顺序命名。

## 自定义配置

您可以很方便地调整分割后图片的高度。

- **图片高度**: 打开 `run_all.js` 文件，在顶部的配置区域找到 `chunkHeight` 这个常量，修改它的值即可。默认值为 `600`（像素）。

    ```javascript
    // --- Configuration ---
    const screenshotFile = 'localhost.png';
    const outputDir = 'processed_images';
    const tempFile = 'trimmed_temp.png';
    const chunkHeight = 600; // <--- 修改这个值来调整高度
    ```
