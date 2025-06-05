// ==UserScript==
// @name        ChatGPT Export to Markdown (2025 Updated)
// @namespace   phquathi
// @version     1.3.0
// @description One-click export ChatGPT conversations to Markdown with improved GPT-4o compatibility
// @author      phquathi
// @match       *://chatgpt.com/*
// @grant       none
// @require     https://cdn.jsdelivr.net/npm/turndown/dist/turndown.min.js
// @require     https://cdn.jsdelivr.net/npm/turndown-plugin-gfm/dist/turndown-plugin-gfm.js
// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        const exportButton = document.createElement('button');
        exportButton.innerText = 'Export to Markdown';
        exportButton.style.position = 'fixed';
        exportButton.style.bottom = '50px';
        exportButton.style.right = '20px';
        exportButton.style.zIndex = '1000';
        exportButton.style.padding = '10px 15px';
        exportButton.style.backgroundColor = 'rgb(16, 163, 127)'; // Match ChatGPT's theme
        exportButton.style.color = 'white';
        exportButton.style.border = 'none';
        exportButton.style.borderRadius = '8px';
        exportButton.style.cursor = 'pointer';
        exportButton.style.fontWeight = '500';
        exportButton.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
        document.body.appendChild(exportButton);

        exportButton.addEventListener('click', () => {
            console.log('Export button clicked');

            // Get conversation title (updated selector for GPT-4o)
            const titleElement = document.querySelector('[data-testid^="conversation-title"]') ||
                document.querySelector('.relative.grow.overflow-hidden.whitespace-nowrap');
            const title = titleElement?.innerText || 'ChatGPT Conversation';

            // Get all messages (updated for GPT-4o's message structure)
            const chatContainer = document.querySelector('[data-testid^="conversation-turn-"]')?.parentElement ||
                document.querySelector('[class*="flex"][class*="h-full"][class*="flex-col"]');

            if (!chatContainer) {
                console.error('Chat container not found');
                return;
            }

            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                emDelimiter: '*', // Use * for italics instead of _
            });

            turndownService.use(turndownPluginGfm.gfm);

            // Remove unwanted UI elements (like copy buttons)
            turndownService.addRule('removeUnwantedParts', {
                filter: ['button', 'span', 'div'],
                replacement: (content, node) => {
                    if (node.classList?.contains('copy-button') ||
                        node.textContent?.includes('Copy code')) {
                        return '';
                    }
                    return content;
                }
            });

            // Better handling for code blocks (GPT-4o's new syntax highlighting)
            turndownService.addRule('formatCodeBlocks', {
                filter: (node) => node.nodeName === 'PRE' && node.querySelector('code'),
                replacement: (content, node) => {
                    const codeNode = node.querySelector('code');
                    const language = node.querySelector('.code-language')?.textContent || '';
                    return `\n\`\`\`${language}\n${codeNode.textContent}\n\`\`\`\n`;
                }
            });

            // Improved LaTeX block detection (for GPT-4o's math rendering)
            turndownService.addRule('blockLaTeX', {
                filter: (node) => node.classList?.contains('katex-display'),
                replacement: (content, node) => {
                    const latexContent = node.querySelector('annotation[encoding="application/x-tex"]')?.textContent || '';
                    return `\n$$\n${latexContent}\n$$\n`;
                }
            });

            let markdownContent = `# ${title}\n\n`;
            const messages = chatContainer.querySelectorAll('[data-testid^="conversation-turn-"], [class*="w-full text-token-text-primary"]');

            messages.forEach((message) => {
                const role = message.getAttribute('data-message-author-role') ||
                    message.querySelector('[data-message-author-role]')?.getAttribute('data-message-author-role') ||
                    (message.textContent.includes('You') ? 'user' : 'assistant');

                const content = message.querySelector('.markdown.prose, [class*="message-content"]') ||
                    message.querySelector('[class*="relative"][class*="max-w-[70%]"]');

                if (!content) return;

                const text = turndownService.turndown(content.innerHTML);
                markdownContent += `## ${role === 'user' ? 'Q' : 'A'}:\n${text}\n\n`;
            });

            // Generate and download the Markdown file
            const blob = new Blob([markdownContent], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(/[^\w\s]/g, '_')}.md`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });
})();