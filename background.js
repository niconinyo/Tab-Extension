let tabTimes = {};
let tabDetails = {};
let bookmarkFolderId = null;
let ignoredUrls = [];

//48 hour time limit
const defaultTimeLimit = 48 * 60 * 60 * 1000;

// Loads ignored URLs from storage
chrome.storage.sync.get(['ignoredUrls'], (result) => {
    ignoredUrls = result.ignoredUrls || [];
});


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
        let timeLimit = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
        const folderId = await checkOrCreateFolder("Clutter");
        const tabInfo = tabDetails[tabId];

        if (tabInfo && tabInfo.url) {
            // Check if URL is in the ignored list or bookmarked in other folders
            if (!ignoredUrls.includes(tabInfo.url) && !await urlExistsInAnyFolder(tabInfo.url, folderId)) {
                if (openDuration > timeLimit) {
                    await chrome.bookmarks.create({ parentId: folderId, title: tabInfo.title, url: tabInfo.url });
                }
            } else if (openDuration > timeLimit) {
                // Close the tab directly if it's in the ignored list or already bookmarked elsewhere
                chrome.tabs.remove(tabId);
            }
        }
    } catch (error) {
        console.error("Error processing tab: ", error);
    }
}



async function getTabsNearingClosure(timeLimit, notifyTime) {
    let tabsToNotify = [];
    const tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        let openDuration = Date.now() - (tabTimes[tab.id] || 0);
        if (openDuration > timeLimit - notifyTime && openDuration < timeLimit) {
            tabsToNotify.push(tab.title);
        }
    }
    return tabsToNotify;
}

async function urlExistsInAnyFolder(url, excludeFolderId) {
    const bookmarks = await new Promise(resolve => chrome.bookmarks.search({ url: url }, resolve));
    return bookmarks.some(bookmark => bookmark.parentId !== excludeFolderId);
}



// Setup periodic check for tabs
setInterval(async () => {
    let customTimeLimit = await new Promise(resolve => {
        chrome.storage.sync.get(['customTimeLimit'], (result) => {
            resolve(result.customTimeLimit ? result.customTimeLimit * 60 * 60 * 1000 : defaultTimeLimit);
        });
    });

    const notifyTime = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const tabsToNotify = await getTabsNearingClosure(customTimeLimit, notifyTime);

    if (tabsToNotify.length > 0) {
        const message = `The following tabs will be bookmarked soon due to inactivity: ${tabsToNotify.join(', ')}`;
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Tab Notification',
            message: message
        });
    }
}, 1000 * 60 * 60); // Check every hour

// Clean up on tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    delete tabTimes[tabId];
    delete tabDetails[tabId];
});