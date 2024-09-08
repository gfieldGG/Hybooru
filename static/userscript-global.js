(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        .header .ThemeSwitch > input {
            width: 1em;
            height: 1em;
            margin-bottom: -0.1em;
        }
        .TagInput {
            border-radius: 5px;
            border: none;
        }
        .TagInput .tags {
            border: none;
            border-top: none;
            border-radius: 5px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }
        button {
            border: none;
        }
    `;
    document.head.appendChild(style);

	// Check if the active element is an input, textarea, or contenteditable
    function isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' ||
               activeElement.tagName === 'TEXTAREA' ||
               activeElement.isContentEditable;
    }

	// Go to /random when R is pressed
    document.addEventListener('keydown', function(event) {
        // Check if the pressed key is "R", no modifier keys are pressed, and the focus is not on an input element
        if (event.key === 'r' && !event.ctrlKey && !event.altKey && !event.shiftKey && !isInputFocused()) {
            // Get the current URL and extract the query parameters
            let currentUrl = new URL(window.location.href);
            let queryParams = currentUrl.search;

            // Construct the new URL with the /random path and same query parameters
            let newUrl = `${currentUrl.origin}/random${queryParams}`;

            // Navigate to the new URL
            window.location.href = newUrl;
        }
    });
})();
