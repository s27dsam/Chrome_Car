# Car Chrome Extension

**Drive a customizable car around any webpage for a fun, interactive browsing experience!**

## Features

- **Select Your Car**: Choose from multiple car images to personalize your driving experience.
- **Smooth Controls**: Drive the car around the webpage using your arrow keys, with realistic physics for acceleration and friction.
- **Interactive Fun**: Turn any webpage into your playground by driving the car around. Toggle driving mode on and off with a simple click.
- **Non-intrusive**: The car moves smoothly without interfering with webpage elements like scrolling or video playback.

## How to Install

1. Download or clone the repository:
   ```bash
   git clone https://github.com/yourusername/car-chrome-extension.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top right corner.
4. Click **Load unpacked** and select the directory where this extension is located.
5. The extension is now installed and available for use!

## How to Use

1. Click on the car icon in your Chrome toolbar.
2. Select a car from the available options.
3. Click the **Load Car** button to place the car on the webpage.
4. Use the arrow keys to drive the car around!
5. Click the **Unload Car** button to remove the car from the page.

## Permissions

The extension requires the following permissions:
- **`activeTab`**: To display the car on the currently active webpage.
- **`scripting`**: To inject the content script that handles car interaction.
- **`storage`**: To save your car selection locally.
