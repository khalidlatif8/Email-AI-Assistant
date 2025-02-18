console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function getEmailContent() {
    const selectors = [
        '.h7',          // Email body
        '.a3s.aiL',     // Gmail body area
        'gmail_quote',  // Quoted text in Gmail
        '[role="presentation"]'  // Sometimes used for table or formatting in Gmail
    ];
    
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return '';
}

function findComposeToolbar() {
    const selectors = [
        '.btC',         // Button container (for compose buttons)
        '.aDh',         // Header for compose window
        '.G-tF',         // Another common toolbar class
        '[role="toolbar"]', // Generic toolbar role
        '.gU.Up'        // Compose toolbar container
    ];

    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            console.log("Toolbar found");
            return toolbar;
        }
    }

    console.log("Toolbar not found Khalid");
    return null; // If not found, return null
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar still not found, retrying...");
        return; // If no toolbar is found, exit the function
    }

    console.log("Toolbar found, creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button'); // Correctly add the class for identification

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "Professional"
                })
            });

            if (!response.ok) {
                throw new Error('API Request Failed');
            }
            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('ComposeBox was not found');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to generate a Reply');
        } finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild); // Insert the button into the toolbar
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, .G-tF, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500); // Wait a bit before injecting the button
        }
    }
});

// Observe changes in the document body for the compose window
observer.observe(document.body, {
    childList: true,
    subtree: true
});
