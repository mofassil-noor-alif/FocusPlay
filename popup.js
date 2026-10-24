document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domainInput');
  const addBtn = document.getElementById('addBtn');
  const domainList = document.getElementById('domainList');
  
  const masterPowerToggle = document.getElementById('masterPower');

  // Load domains and settings
  chrome.storage.local.get({ domains: [], masterPower: true }, (result) => {
    updateEmptyState(result.domains.length);
    result.domains.forEach(addDomainToList);
    
    // Set toggles
    masterPowerToggle.checked = result.masterPower;
  });

  // Handle Setting Toggles
  const handleSettingChange = (settingKey, event) => {
    const value = event.target.checked;
    chrome.storage.local.set({ [settingKey]: value }, () => {
      // Broadcast settings update to active tabs so they instantly adjust
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'update_settings',
            [settingKey]: value
          }).catch(() => {});
        }
      });
    });
  };

  masterPowerToggle.addEventListener('change', (e) => handleSettingChange('masterPower', e));

  addBtn.addEventListener('click', () => {
    let domain = domainInput.value.trim().toLowerCase();
    
    // Clean up domain if user pasted a full URL
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    
    if (domain) {
      chrome.storage.local.get({ domains: [] }, (result) => {
        const domains = result.domains;
        if (!domains.includes(domain)) {
          domains.push(domain);
          chrome.storage.local.set({ domains: domains }, () => {
            const emptyState = domainList.querySelector('.empty-state');
            if (emptyState) emptyState.remove();
            
            addDomainToList(domain);
            domainInput.value = '';
          });
        }
      });
    }
  });

  // Handle enter key
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    }
  });

  function addDomainToList(domain) {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.className = 'domain-name';
    span.textContent = domain;
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    removeBtn.className = 'remove-btn';
    removeBtn.title = 'Remove Domain';
    removeBtn.onclick = () => {
      chrome.storage.local.get({ domains: [] }, (result) => {
        const domains = result.domains.filter(d => d !== domain);
        chrome.storage.local.set({ domains: domains }, () => {
          domainList.removeChild(li);
          updateEmptyState(domains.length);
        });
      });
    };
    
    li.appendChild(span);
    li.appendChild(removeBtn);
    domainList.appendChild(li);
  }

  function updateEmptyState(count) {
    if (count === 0) {
      domainList.innerHTML = '<li class="empty-state" style="justify-content: center; background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.1);">No domains whitelisted yet.</li>';
    }
  }
});
