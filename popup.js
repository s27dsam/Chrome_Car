function executeInTab (action, data, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      console.log(`[popup.js] Attempting to execute script for action: ${action}`);
      chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['content.js'] }, () => {
        if (chrome.runtime.lastError) {
          console.error(`[popup.js] Error executing script: ${chrome.runtime.lastError.message}`);
          if (callback) callback({ status: 'Error executing script.' });
          return;
        }
        console.log(`[popup.js] Script executed. Waiting before sending message for action: ${action}`);
        // Introduce a small delay to allow content script's listener to fully register
        setTimeout(() => {
          chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, response => {
            if (chrome.runtime.lastError) {
              console.error(`[popup.js] Error sending message for action ${action}: ${chrome.runtime.lastError.message}`);
            }
            if (callback) callback(response);
          });
        }, 50); // 50ms delay
      })
    }
  })
}

function loadCarSelection () {
  chrome.storage.local.get(['selectedCar'], (data) => {
    if (data.selectedCar) {
      document.querySelector(`input[value="${data.selectedCar}"]`).checked = true
    }
  })
}

document.getElementById('carSelectionForm').addEventListener('change', () => {
  const selectedCar = document.querySelector('input[name="car"]:checked').value
  chrome.storage.local.set({ selectedCar })
})

document.getElementById('optionsButton').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'none'
  document.getElementById('optionsView').style.display = 'block'
})

document.getElementById('donateButton').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'none'
  document.getElementById('donateView').style.display = 'block'
})

document.getElementById('backButton').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'block'
  document.getElementById('optionsView').style.display = 'none'
})

document.getElementById('backButtonDonate').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'block'
  document.getElementById('donateView').style.display = 'none'
})

document.getElementById('copyButton').addEventListener('click', () => {
  const walletAddress = document.getElementById('walletAddress')
  walletAddress.select()
  document.execCommand('copy')
})

document.getElementById('LoadCar').addEventListener('click', () => {
  const selectedCar = document.querySelector('input[name="car"]:checked').value
  chrome.storage.local.get(['speed', 'tires', 'trailColor', 'trailLength'], (data) => {
    const speed = data.speed;
        const tires = data.tires;
        const trailColor = data.trailColor;
        const trailLength = data.trailLength;
        executeInTab('loadCar', { carImage: 'images/' + selectedCar, settings: { speed, tires, trailColor, trailLength } }, response => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message)
        document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message
      } else if (response && response.status) {
        document.getElementById('result').textContent = response.status
      }
      updateUnloadButtonState()
    })
  })
})

document.getElementById('UnloadCar').addEventListener('click', () => {
  executeInTab('unloadCar', {}, response => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message)
      document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message
    } else if (response && response.status) {
      document.getElementById('result').textContent = response.status
    }
    updateUnloadButtonState()
  })
})

function updateUnloadButtonState () {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'isCarLoaded' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message)
          return
        }
        const unloadButton = document.getElementById('UnloadCar')
        if (response && response.isLoaded) {
          unloadButton.classList.add('enabled')
        } else {
          unloadButton.classList.remove('enabled')
        }
      })
    }
  })
}

loadCarSelection()

// Initial update of settings to content script when popup opens
document.addEventListener('DOMContentLoaded', () => {
  updateUnloadButtonState()
  const selectedCar = document.querySelector('input[name="car"]:checked').value
  chrome.storage.local.get(['speed', 'tires', 'trailColor', 'trailLength'], (data) => {
        const speed = data.speed;
        const tires = data.tires;
        const trailColor = data.trailColor;
        const trailLength = data.trailLength;
        executeInTab('updateSettings', { settings: { speed, tires, trailColor, trailLength } });
    });
})

loadSettings()

function saveAndSendSettings() {
  const speed = document.getElementById('speedRange').value;
  const tires = document.getElementById('tireSelection').value;
  const trailColor = document.getElementById('trailColor').value;
  const trailLength = document.getElementById('trailLength').value;

  chrome.storage.local.set({ speed, tires, trailColor, trailLength });
  executeInTab('updateSettings', { settings: { speed, tires, trailColor, trailLength } });
}

function loadSettings() {
  chrome.storage.local.get(['speed', 'tires', 'trailColor', 'trailLength'], (data) => {
    if (data.speed) {
      document.getElementById('speedRange').value = data.speed;
    }
    if (data.tires) {
      document.getElementById('tireSelection').value = data.tires;
    }
    if (data.trailColor) {
      document.getElementById('trailColor').value = data.trailColor;
    }
    if (data.trailLength) {
      document.getElementById('trailLength').value = data.trailLength;
    }
  });
}

document.getElementById('speedRange').addEventListener('input', saveAndSendSettings)

document.getElementById('tireSelection').addEventListener('change', saveAndSendSettings)

document.getElementById('trailColor').addEventListener('change', saveAndSendSettings)

document.getElementById('trailLength').addEventListener('input', saveAndSendSettings);
