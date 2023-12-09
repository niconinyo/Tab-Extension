let tabTimes = {};

chrome.tabs.onCreated.addListener((tab) => {
    tabTimes[tab.id] = Date.now();
    console.log("Tab created: ", tab.id, " at ", tabTimes[tab.id]);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        console.log("Tab updated: ", tabId, changeInfo);
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    let openDuration = Date.now() - tabTimes[tabId];
    console.log("Tab was open for: ", openDuration, " hours.")
});