(function() {
    'use strict';

	// hide or collapse sidebar blocks
	const selector = "div>div.namespace";

	const blocksCollapse = ["statistics","sources"];
	const blocksHide = ["filename","hybooru"];

    // Add CSS style to hide child elements when collapsed
    const style = document.createElement('style');
    style.innerHTML = `
        .collapsible {
            cursor: pointer;
        }

        .collapsed b::after {
            content: " (expand)";
            color: #999;
        }

        /* Hide the content (except the first child <b>) when collapsed */
        .collapsed > *:not(b) {
            display: none;
        }

		.hidden {
			display: none;
		}
    `;
    document.head.appendChild(style);

	// Function to check if the input string starts with any of the prefixes
	function startsWithAny(inputString, prefixes) {
  		return prefixes.some(prefix => inputString.toLowerCase().startsWith(prefix.toLowerCase()));
	}

    function processBlocks() {
		console.log(`Looking for blocks to collapse or hide...`);
        const blocks = document.querySelectorAll(selector);
		console.log(`Found ${blocks.length} blocks to check...`);

        blocks.forEach(item => {
			// console.log(item.textContent);
			if (startsWithAny(item.textContent, blocksHide)) {
				console.log(`Hiding ${item}`)
				item.classList.add('hidden');
			}

			else if (startsWithAny(item.textContent, blocksCollapse)) {
				console.log(`Found item ${item} to collapse...`);
				item.classList.add('collapsible');
            	// Collapse by default
            	item.classList.add('collapsed');
            	// Add click event to toggle the collapse/expand
            	item.addEventListener('click', function() {
                	item.classList.toggle('collapsed');
            	});
			}

			else {
				console.log("Nope.")
			}
        });

    }

    // Run the toggle collapse function when the DOM is fully loaded
    window.addEventListener('load', processBlocks);


	// add random hotkey
	// Function to check if the active element is an input, textarea, or contenteditable
    function isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' ||
               activeElement.tagName === 'TEXTAREA' ||
               activeElement.isContentEditable;
    }

    // Listen for the "R" key press event
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
