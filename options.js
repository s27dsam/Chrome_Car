const maxCones = 5;

function executeInTab(action, data, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['content.js'] }, () => {
                chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, callback);
            });
        }
    });
}

function saveAndSendSettings() {
  const speed = document.getElementById('speedRange').value;
  const tires = document.getElementById('tireSelection').value;

  chrome.storage.local.set({ speed, tires });
  executeInTab('updateSettings', { speed, tires });
}

function loadSettings() {
  chrome.storage.local.get(['speed', 'tires'], (data) => {
    if (data.speed) {
      document.getElementById('speedRange').value = data.speed;
    }
    if (data.tires) {
      document.getElementById('tireSelection').value = data.tires;
    }
  });
}

function updateConeCounter() {
    executeInTab('getConeCount', {}, response => {
        const coneCount = response ? response.coneCount : 0;
        document.getElementById('coneCounter').textContent = `${coneCount}/${maxCones}`;
        document.getElementById('addCone').disabled = coneCount >= maxCones;
    });
}

document.getElementById('speedRange').addEventListener('input', saveAndSendSettings);
document.getElementById('tireSelection').addEventListener('change', saveAndSendSettings);

document.getElementById('addCone').addEventListener('click', () => {
    executeInTab('addCone', {}, response => {
        if (response && response.status === 'coneAdded') {
            updateConeCounter();
        }
    });
});

loadSettings();
updateConeCounter();

// Initial update of settings to content script when options page opens
document.addEventListener('DOMContentLoaded', () => {
    const speed = document.getElementById('speedRange').value;
    const tires = document.getElementById('tireSelection').value;
    executeInTab('updateSettings', { speed, tires });
});