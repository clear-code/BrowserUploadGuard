'use strict';

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.requestBody?.raw) return {};
    for (const part of details.requestBody.raw) {
      if (part.file && isBlocked(part.file)) {
        if (details.tabId >= 0) {
          chrome.tabs.sendMessage(details.tabId, {
            type: "blocked",
            path: part.file
          }).catch(() => {});  // 失敗しても無視
        }
        return { cancel: true };
      }
    }
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestBody"]
);