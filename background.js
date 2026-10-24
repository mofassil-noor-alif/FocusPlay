chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
    chrome.storage.local.get({ domains: [], masterPower: true }, (result) => {
      try {
        if (!result.masterPower) return; // Master Switch is OFF
        
        const url = new URL(tab.url);
        const hostname = url.hostname.toLowerCase();
        
        // Check if current hostname includes any of the saved domains
        const isMatch = result.domains.some(domain => {
          let cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
          return hostname.includes(cleanDomain);
        });
        
        if (isMatch) {
          // Retry logic to broadcast to all frames in the matched tab
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            
            // Send the message to *all* frames in the tab, not just the parent
            chrome.tabs.sendMessage(tabId, { action: "init_focus" }).then(() => {
              // Wait until a frame acknowledges it
            }).catch(() => {
              // Expected if frames aren't loaded yet
            });
            
            if (attempts > 10) clearInterval(interval);
          }, 300);
        }
      } catch (e) {
        console.error("Invalid URL format:", tab.url);
      }
    });
  }
});
