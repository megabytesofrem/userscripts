// ==UserScript==
// @name         Cleanup Twitter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically censors anti-LGBT, pro-conservative and political in nature Tweets from appearing on your timeline and ruining your day
// @author       megabytesofrem
// @match        https://x.com/*
// @match        https://www.x.com/*
// @match        https://twitter.com/*
// @match        https://www.twitter.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Regex filter
    const FILTER_REGEX = /(?:\bMAGA\b|\bconservative\b|\bTrump\b|\bRepublican\b|\bWoke\b|\bDEI\b|\bSJW\b)/gi;

    // Function to check if Shinigami Eyes is available
    function checkForShinigamiEyes() {
        return (typeof window.shinigamiEyesFindTwitterNumericIds == 'function');
    }

    // Twitter removed the ability to actually block users, so we recreate it here and use our own hiding
    // mechanism to hide tweets from those users.

    // TODO: Implement this
    function getOwnBlockList() {
        return GM.getValue('blocklist', []) ? JSON.parse(GM.getValue('blocklist', [])) : [];
    }


    // Collect bad tweets based on a label Shinigami Eyes assigns to them.
    //
    // This should get 99% of the bad tweets.
    function collectBadTweets() {
        const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));

        let bad = tweets.filter(tweet => {
            const link = tweet.querySelector('a');
            return link && link.classList.contains('assigned-label-transphobic');
        });

        // Even more tweets based on a regex filter, may have some false positives
        bad = bad.concat(tweets.filter(tweet => {
            const tweetText = tweet.querySelector("[data-testid=tweetText]").innerText;
            return FILTER_REGEX.test(tweetText);
        }));

        return bad;
    }

    function hideContent(tweet) {
        Array.from(tweet.children).forEach(child => child.style.display = 'none');
    }

    function showContent(tweet) {
        Array.from(tweet.children).forEach(child => child.style.display = 'block');
    }

    function createShowButton(tweet) {
        const profile = tweet.querySelector('[data-testid=User-Name]');
        const displayname = profile.querySelector("a:not([tabindex='-1']) span");
        let handle = profile.querySelector("a[tabindex='-1'] span").innerText;

        if (handle === null || handle === undefined) {
            handle = "@user";
        }

        const showButton = document.createElement('a');
        showButton.innerHTML = `Post by <i style="color: rgb(138, 3, 3)">${handle}</i> hidden by userscript. Click to show.`;
        showButton.style.fontFamily = 'Arial, sans-serif';
        showButton.style.backgroundColor = document.querySelector('body').style.backgroundColor;
        showButton.style.display = 'block';
        showButton.style.marginTop = '0px';
        showButton.style.padding = '10px';
        showButton.style.color = 'lightgray';
        showButton.style.cursor = 'pointer';
        return showButton;
    }

    function addCensorFunction(tweet) {
        // If the tweet is already censored, skip it
        if (tweet.getAttribute('data-censored') === 'true') return;

        // Initially hide content and create the button
        hideContent(tweet);
        const showButton = createShowButton(tweet);

        // Append the button to the tweet
        tweet.appendChild(showButton);
        tweet.setAttribute('data-censored', 'true'); // Mark as censored

        // Add click event listener for the button
        showButton.addEventListener('click', () => {
            // Only allow uncensorship if the tweet is still marked as censored
            if (tweet.getAttribute('data-censored') === 'true') {
                showContent(tweet);
                showButton.remove();
                tweet.setAttribute('data-censored', 'false');  // Mark as uncensored
            }
        });
    }

    // Handle tweet censorship based on condition and apply censorship
    function handleTweets() {
        if (checkForShinigamiEyes()) {
            const tweets = collectBadTweets();
            tweets.forEach(tweet => {
                // Only apply censorship if it's not already uncensored
                if (tweet.getAttribute('data-censored') !== 'false') {
                    addCensorFunction(tweet);
                }
            });
        }
    }

    // MutationObserver to apply censorship logic when the DOM changes
    const observer = new MutationObserver(() => {
        handleTweets();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check for flagged tweets
    handleTweets();
})();
