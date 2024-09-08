(function() {
    'use strict';

	const updateSelector = "div#root"
	const selector = "div>div.namespace"; // all relevant elements

	const blocksCollapse = ["statistics","sources"];
	const blocksHide = ["filename","hybooru"];

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

    function processBlocks() {
        const blocks = document.querySelectorAll(selector);

        blocks.forEach(item => {
			// hide if empty
			if (item.querySelector('div,p') === null) {
				item.classList.add('hidden');
			}
			else {
				const title = item.querySelector('b').textContent.toLowerCase();

				if (blocksHide.includes(title)) {
					item.classList.add('hidden');
				}

				else if (blocksCollapse.includes(title)) {
					item.classList.add('collapsible');
	            	// Collapse by default
	            	item.classList.add('collapsed');
	            	// Add click event to toggle the collapse/expand
	            	item.addEventListener('click', function() {
	                	item.classList.toggle('collapsed');
	            	});
				}
			}
        });

    }

	// == == == Detect added nodes / attach MutationObserver == == ==
    if (document.querySelector(updateSelector)){
        // Check once initially
		processBlocks();
		// Watch for changes that could be new videos
        (new MutationObserver(processBlocks)).observe(document.querySelector(updateSelector), {childList: true, subtree: true});
    }
})();
