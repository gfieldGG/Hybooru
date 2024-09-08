(function() {
    'use strict';

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
})();