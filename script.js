document.addEventListener('DOMContentLoaded', async () => {
    const titleElement = document.getElementById('post-title');
    const previewElement = document.getElementById('preview');

    try {
        // Fetch the title
        const titleResponse = await fetch('title.txt');
        if (!titleResponse.ok) {
            throw new Error(`HTTP error! status: ${titleResponse.status}`);
        }
        const titleText = await titleResponse.text();
        titleElement.textContent = titleText.trim();

        // Fetch the markdown content
        const contentResponse = await fetch('content.md');
        if (!contentResponse.ok) {
            throw new Error(`HTTP error! status: ${contentResponse.status}`);
        }
        const markdownText = await contentResponse.text();
        previewElement.innerHTML = marked.parse(markdownText);

    } catch (error) {
        console.error('Error fetching local content:', error);
        previewElement.innerHTML = `<p style="color: red;">Error loading content. Please ensure you are running this from a local web server.</p>`;
    }
});
