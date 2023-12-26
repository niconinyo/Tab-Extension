chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showNotification") {
      alert("This tab will be bookmarked soon due to inactivity.");
    }
  });