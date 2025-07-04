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
  const selectedCar = document.querySelector('input[name="car"]:checked').value;
  const speed = document.getElementById('speedRange').value;
  const tires = document.getElementById('tireSelection').value;

  chrome.storage.local.set({ selectedCar, speed, tires });
  executeInTab('updateSettings', { speed, tires });
}

function loadSettings() {
  chrome.storage.local.get(['selectedCar', 'speed', 'tires'], (data) => {
    if (data.selectedCar) {
      document.querySelector(`input[value="${data.selectedCar}"]`).checked = true;
    }
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

document.getElementById('carSelectionForm').addEventListener('change', saveAndSendSettings);
document.getElementById('speedRange').addEventListener('input', saveAndSendSettings);
document.getElementById('tireSelection').addEventListener('change', saveAndSendSettings);

document.getElementById('LoadCar').addEventListener('click', () => {
    const selectedCar = document.querySelector('input[name="car"]:checked').value;
    const speed = document.getElementById('speedRange').value;
    const tires = document.getElementById('tireSelection').value;

    executeInTab('loadCar', { carImage: 'images/' + selectedCar, speed, tires }, response => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message;
        } else if (response && response.status) {
            document.getElementById('result').textContent = response.status;
        }
        updateConeCounter();
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

document.getElementById('addCone').addEventListener('click', () => {
    executeInTab('addCone', {}, response => {
        if (response && response.status === 'coneAdded') {
            updateConeCounter();
        }
    });
});

loadSettings();
updateConeCounter();