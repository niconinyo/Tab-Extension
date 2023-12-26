let tabTimes = {};
let tabDetails = {};
let bookmarkFolderId = null;


// Record opening time of new tab
chrome.tabs.onCreated.addListener((tab) => {
    tabTimes[tab.id] = Date.now();
    tabDetails[tab.id] = { title: tab.title, url: tab.url};
    console.log("Tab created: ", tab.id, " at ", tabTimes[tab.id]);
});
//  Logs updates for when a tab is updated (i.e. Changing/refreshing page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    tabDetails[tabId] = { title : tab.title, url: tab.url };
    if (changeInfo.status === 'complete' && tab.active) {
        console.log("Tab updated: ", tabId, changeInfo);
    }
});

// Retrieves the structure of the bookmark tree
// Identifies the bookmarks bar
// Creates new bookmark folder
async function checkOrCreateFolder(folderName) {
    const results = await new Promise((resolve) => chrome.bookmarks.getTree(resolve));
    const bookmarkBar = results[0].children[0];
    
    const existingFolders = await new Promise((resolve) => chrome.bookmarks.search({ title: folderName }, resolve));
    const existingFolder = existingFolders.find(b => b.parentId === bookmarkBar.id && b.title === folderName);

    if (!existingFolder) {
        const newFolder = await new Promise((resolve) => chrome.bookmarks.create({
            'parentId': bookmarkBar.id,
            'title': folderName
        }, resolve));
        console.log("Added folder: " + newFolder.title);
        return newFolder.id;
    } else {
        console.log("Folder already exists");
        return existingFolder.id;
    }
}



// Function to handle tab processing
async function processTab(tabId) {
    try {
        let openDuration = Date.now() - tabTimes[tabId];
        console.log("Tab was open for: ", openDuration, " hours.");

        if (openDuration > 48 * 60 * 60 * 1000) {
            const folderId = await checkOrCreateFolder("Clutter");
            const tabInfo = tabDetails[tabId];
            if (tabInfo && tabInfo.url) {
                chrome.bookmarks.create({ parentId: folderId, title: tabInfo.title, url: tabInfo.url });
            }
            chrome.tabs.remove(tabId);
        }
    } catch (error) {
        console.error("Error processing tab: ", error);
    }
}

// Setup periodic check for tabs
setInterval(() => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => processTab(tab.id));
    });
}, 1000 * 60 * 60); // Check every hour

// Clean up on tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    delete tabTimes[tabId];
    delete tabDetails[tabId];
});