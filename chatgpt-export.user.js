// ==UserScript==
// @name        ChatGPT Export to Markdown 
// @namespace   phquathi
// @version     1.3.0
// @description 完整保留提问和回答
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
        exportButton.style.backgroundColor = 'rgb(16, 163, 127)';
        exportButton.style.color = 'white';
        exportButton.style.border = 'none';
        exportButton.style.borderRadius = '8px';
        exportButton.style.cursor = 'pointer';
        exportButton.style.fontWeight = '500';
        exportButton.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
        document.body.appendChild(exportButton);

        exportButton.addEventListener('click', () => {
            const titleElement = document.querySelector('[data-testid^="conversation-title"]') ||
                document.querySelector('.relative.grow.overflow-hidden.whitespace-nowrap');
            const title = titleElement?.innerText || 'ChatGPT Conversation';

            const chatContainer = document.querySelector('[data-testid^="conversation-turn-"]')?.parentElement ||
                document.querySelector('[class*="flex"][class*="h-full"][class*="flex-col"]');

            if (!chatContainer) {
                console.error('Chat container not found');
                return;
            }

            const turndownService = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                emDelimiter: '*',
            });

            turndownService.use(turndownPluginGfm.gfm);

            let markdownContent = `# ${title}\n\n`;

            const messages = chatContainer.querySelectorAll('[data-testid^="conversation-turn-"]');

            messages.forEach((message, index) => {
                // 偶数是用户提问，奇数是AI回答
                const role = index % 2 === 0 ? 'Q' : 'A';

                // 优先取markdown内容块
                let content = message.querySelector('.markdown.prose') ||
                    message.querySelector('.whitespace-pre-wrap') ||
                    message.querySelector('[class*="relative"][class*="max-w-[70%]"]');

                if (!content) return;

                const text = turndownService.turndown(content.innerHTML || content.textContent);
                markdownContent += `## ${role}:\n${text}\n\n`;
            });

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
