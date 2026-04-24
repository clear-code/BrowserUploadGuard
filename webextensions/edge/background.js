'use strict';

/*
 * When `{cancel: 1}` is used to block loading, Edge shows a warning page which
 * indicates that loading is canceled by an add-on. To avoid it, move back to
 * the previous page instead of blocking.
 */
const CANCEL_REQUEST = {redirectUrl:`data:text/html,${escape('<script type="application/javascript">history.back()</script>')}`};
/*
 *  Although even if we return `CANCEL_REQUEST` from `onBeforeRequest()` on a
 *  sub-frame, `history.back()` will be performed against it's parent main
 *  frame when there is no page to back in the sub-frame. As a result main
 *  frame moves back to the previous page unexpectedly.
 *  To avoid it, just move to blank page instead.
 */
const CANCEL_REQUEST_FOR_SUBFRAME = {redirectUrl:'about:blank'};

function isBlocked(file) {
  const blockedExtensions = [".exe", ".bat", ".cmd", ".js", ".vbs"];
  return blockedExtensions.some(ext => file.endsWith(ext));
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.requestBody?.raw) return {};
    const isMainFrame = (details.type == 'main_frame');
    for (const part of details.requestBody.raw) {
      if (part.file && isBlocked(part.file)) {
        if (details.tabId >= 0) {
          chrome.tabs.sendMessage(details.tabId, {
            type: "blocked",
            path: part.file
          }).catch(() => {});  // 失敗しても無視
        }
        return isMainFrame ? CANCEL_REQUEST : CANCEL_REQUEST_FOR_SUBFRAME;
      }
    }
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestBody"]
);