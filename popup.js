document.getElementById('saveIgnoredUrls').addEventListener('click', () => {
    let ignoredUrls = document.getElementById('ignoredUrls').value.split('\n');
    chrome.storage.sync.set({ ignoredUrls: ignoredUrls }, () => {
        console.log('Ignored URLs are saved');
    });
});
