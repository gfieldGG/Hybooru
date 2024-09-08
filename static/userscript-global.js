(function() {
    'use strict';

    const style = document.createElement('style');
    style.innerHTML = `
        .header .ThemeSwitch > input {
            width: 1em;
            height: 1em;
            margin-bottom: -0.1em;
        }
        .TagInput input {
            border-radius: 5px;
            border: none;
        }
        .TagInput .tags {
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

    // set default audio volume
    // adapted from https://greasyfork.org/scripts/36270
    var setvol_volumepct = 0.1;
    // == == == Detect added nodes / attach MutationObserver == == ==
    if (document.body){
        // Check existing videos
        setvol_checkNode(document.body);
        // Watch for changes that could be new videos
        var setvol_MutOb = (window.MutationObserver) ? window.MutationObserver : window.MutationObserver;
        if (setvol_MutOb){
            var setvol_chgMon = new setvol_MutOb(function(mutationSet){
                mutationSet.forEach(function(mutation){
                    for (var setvol_node_count=0; setvol_node_count<mutation.addedNodes.length; setvol_node_count++){
                        if (mutation.addedNodes[setvol_node_count].nodeType == 1){
                            setvol_checkNode(mutation.addedNodes[setvol_node_count]);
                        }
                    }
                });
            });
            // attach setvol_chgMon to document.body
            var setvol_opts = {childList: true, subtree: true};
            setvol_chgMon.observe(document.body, setvol_opts);
        }
    }

    function setvol_checkNode(el){
        if (el.nodeName == "video" || el.nodeName == "audio") var vids = [el];
        else var vids = el.querySelectorAll('video, audio');
        if (vids.length > 0){
            for (var j=0; j<vids.length; j++){
                vids[j].volume = setvol_volumepct;
            }
        }
    }
})();
