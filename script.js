document.addEventListener('DOMContentLoaded', async () => {
    const titleElement = document.getElementById('post-title');
    const previewElement = document.getElementById('preview');

    try {
        // Fetch the markdown content
        const contentResponse = await fetch('content.md');
        if (!contentResponse.ok) {
            throw new Error(`HTTP error! status: ${contentResponse.status}`);
        }
        const markdownText = await contentResponse.text();
        
        // Split content into title and body
        const lines = markdownText.split('\n');
        const title = lines[0];
        const body = lines.slice(1).join('\n');

        titleElement.textContent = title.trim();
        previewElement.innerHTML = marked.parse(body);

    } catch (error) {
        console.error('Error fetching local content:', error);
        previewElement.innerHTML = `<p style="color: red;">Error loading content. Please ensure you are running this from a local web server.</p>`;
    }
});