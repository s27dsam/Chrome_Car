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

function loadCarSelection() {
  chrome.storage.local.get(['selectedCar'], (data) => {
    if (data.selectedCar) {
      document.querySelector(`input[value="${data.selectedCar}"]`).checked = true;
    }
  });
}

document.getElementById('carSelectionForm').addEventListener('change', () => {
  const selectedCar = document.querySelector('input[name="car"]:checked').value;
  chrome.storage.local.set({ selectedCar });
});

document.getElementById('optionsButton').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('LoadCar').addEventListener('click', () => {
    const selectedCar = document.querySelector('input[name="car"]:checked').value;
    chrome.storage.local.get(['speed', 'tires'], (data) => {
        const speed = data.speed;
        const tires = data.tires;
        executeInTab('loadCar', { carImage: 'images/' + selectedCar, settings: { speed, tires } }, response => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.status) {
            document.getElementById('result').textContent = response.status;
        }
        updateConeCounter();
    });
});
});

document.getElementById('UnloadCar').addEventListener('click', () => {
    executeInTab('unloadCar', {}, response => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.status) {
            document.getElementById('result').textContent = response.status;
        }
        updateConeCounter();
    });
});

loadCarSelection();

// Initial update of settings to content script when popup opens
document.addEventListener('DOMContentLoaded', () => {
    const selectedCar = document.querySelector('input[name="car"]:checked').value;
    chrome.storage.local.get(['speed', 'tires'], (data) => {
        executeInTab('updateSettings', { settings: { speed: data.speed, tires: data.tires } });
    });
});

loadSettings();
updateConeCounter();