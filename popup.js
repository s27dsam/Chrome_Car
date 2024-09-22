// Save the selected car to storage
function saveSelectedCar() {
  const selectedCar = document.querySelector('input[name="car"]:checked').value;
  chrome.storage.local.set({ selectedCar });
}

// Load the selected car from storage
function loadSelectedCar() {
  chrome.storage.local.get('selectedCar', (data) => {
    if (data.selectedCar) {
      const radioButton = document.querySelector(`input[value="${data.selectedCar}"]`);
      if (radioButton) {
        radioButton.checked = true;
      }
    }
  });
}

// Add event listener to save the selected car when changed
document.getElementById('carSelectionForm').addEventListener('change', saveSelectedCar);

// Load the selected car when the popup opens
loadSelectedCar();

// Load Car button functionality
document.getElementById('LoadCar').addEventListener('click', () => {
  const selectedCar = document.querySelector('input[name="car"]:checked').value;
  chrome.storage.local.set({ selectedCar }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Inject content script if not already injected
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: ['content.js'],
        },
        () => {
          // Send message to load the car with the selected image
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'loadCar', carImage: 'images/' + selectedCar },
            function (response) {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message;
              } else if (response && response.status) {
                document.getElementById('result').textContent = response.status;
              }
            }
          );
        }
      );
    });
  });
});

// Unload Car button functionality
document.getElementById('UnloadCar').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'unloadCar' }, function (response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        document.getElementById('result').textContent = 'Error: ' + chrome.runtime.lastError.message;
      } else if (response && response.status) {
        document.getElementById('result').textContent = response.status;
      }
    });
  });
});

