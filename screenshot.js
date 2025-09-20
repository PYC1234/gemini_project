const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  // Start the python http.server with the -u flag for unbuffered output
  const serverProcess = spawn('python', ['-u', '-m', 'http.server', '8000']);
  console.log('Starting local server...');

  // Wait for the server to be ready by listening to its output
  await new Promise((resolve, reject) => {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Log all output from the server for debugging
      console.log(`Server log: ${output}`); 
      if (output.includes('Serving HTTP')) {
        console.log('Server is running.');
        resolve();
      }
    });
    serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.error(`Server error: ${errorOutput}`);
      reject(errorOutput);
    });
  });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8000/');
    await page.screenshot({ path: 'localhost.png', fullPage: true });
    console.log('Screenshot saved as localhost.png');
  } catch (error) {
    console.error(`Error during screenshot: ${error}`);
  } finally {
    await browser.close();
    // Stop the server process
    serverProcess.kill();
    console.log('Server stopped.');
  }
})();