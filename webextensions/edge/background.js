'use strict';

function buildCancelResponse(path, isMainFrame) {
  const message = JSON.stringify(`アップロードがブロックされました:\n${path}`);
  const afterAction = isMainFrame ? 'history.back();' : '';
  const html = `<script>
    alert(${message});
    ${afterAction}
  </script>`;
  return { redirectUrl: `data:text/html,${encodeURIComponent(html)}` };
}

function isBlocked(file) {
  const blockedExtensions = [".exe", ".bat", ".cmd", ".js", ".vbs"];
  const lower = file.toLowerCase();
  return blockedExtensions.some(ext => lower.endsWith(ext));
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.requestBody?.raw) return {};
    const isMainFrame = (details.type === 'main_frame');
    for (const part of details.requestBody.raw) {
      if (part.file && isBlocked(part.file)) {
        return buildCancelResponse(part.file, isMainFrame);
      }
    }
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking", "requestBody"]
);