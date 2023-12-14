let tabTimes = {};
let bookmarkFolderId = null;


// Record opening time of new tab
chrome.tabs.onCreated.addListener((tab) => {
    tabTimes[tab.id] = Date.now();
    console.log("Tab created: ", tab.id, " at ", tabTimes[tab.id]);
});
//  Logs updates for when a tab is updated (i.e. Changing/refreshing page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log("Tab updated: ", tabId, changeInfo);
    }
});

// Retrieves the structure of the bookmark tree
// Identifies the bookmarks bar
// Creates new bookmark folder
chrome.bookmarks.getTree((results) => {
    let bookmarkBar = results[0].children[0];
    let folderName = 'Closed Tabs';

    // Search if the folder already exists
    chrome.bookmarks.search({ title: folderName }, (results) => {
        let existingFolder = results.find(b => b.parentId === bookmarkBar.id && b.title === folderName);

        if (!existingFolder) {
            // Folder doesn't exist, create it
            chrome.bookmarks.create({
                'parentId': bookmarkBar.id,
                'title': folderName
            }, (newFolder) => {
                console.log("Added folder: " + newFolder.title);
            });
        } else {
            // Folder exists, you can skip creation
            console.log("Folder already exists");
        }
    });
});



chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    let openDuration = Date.now() - tabTimes[tabId];
    console.log("Tab was open for: ", openDuration, " hours.")
});