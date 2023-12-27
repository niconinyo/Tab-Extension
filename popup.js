document.getElementById('saveIgnoredUrls').addEventListener('click', () => {
    let ignoredUrls = document.getElementById('ignoredUrls').value.split('\n');
    chrome.storage.sync.set({ ignoredUrls: ignoredUrls }, () => {
        console.log('Ignored URLs are saved');
    });
});

document.getElementById('saveCustomTimeLimit').addEventListener('click', () => {
    let customTimeLimit = document.getElementById('customTimeLimit').value;
    chrome.storage.sync.set({ customTimeLimit: customTimeLimit }, () => {
        console.log('Custom time limit saved');
    });
});