chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (request.action === 'loadCar') {
    const carImage = request.carImage || 'images/car2.png';

    if (!document.getElementById('carElement')) {
      const car = document.createElement('img');
      car.src = chrome.runtime.getURL(carImage);
      car.id = 'carElement';
      car.style.position = 'fixed';
      car.style.left = '50%';
      car.style.top = '50%';
      car.style.width = '50px';
      car.style.height = 'auto';
      car.style.zIndex = '10000';
      car.style.cursor = 'pointer';
      car.style.border = 'none';
      document.body.appendChild(car);

      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;

      // Physics variables
      let velocityX = 0;
      let velocityY = 0;
      const maxSpeed = 7; // Maximum speed
      const acceleration = 0.5; // How quickly the car accelerates
      const friction = 0.01; // How quickly the car slows down

      let isDriving = false;

      // Object to keep track of which keys are pressed
      const keysPressed = {};

      function updateCarPosition() {
        if (!isDriving) return;

        // Apply acceleration based on keys pressed
        if (keysPressed['ArrowUp']) {
          velocityY -= acceleration;
        }
        if (keysPressed['ArrowDown']) {
          velocityY += acceleration;
        }
        if (keysPressed['ArrowLeft']) {
          velocityX -= acceleration;
        }
        if (keysPressed['ArrowRight']) {
          velocityX += acceleration;
        }

        // Apply friction
        velocityX *= (1 - friction);
        velocityY *= (1 - friction);

        // Limit the speed
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (speed > maxSpeed) {
          velocityX *= maxSpeed / speed;
          velocityY *= maxSpeed / speed;
        }

        // Update position
        x += velocityX;
        y += velocityY;

        // Collision with window edges
        if (x <= 0 || x >= window.innerWidth - car.offsetWidth) {
          velocityX *= -0.5; // Reverse and reduce speed
        }
        if (y <= 0 || y >= window.innerHeight - car.offsetHeight) {
          velocityY *= -0.5;
        }

        // Boundaries
        x = Math.max(0, Math.min(window.innerWidth - car.offsetWidth, x));
        y = Math.max(0, Math.min(window.innerHeight - car.offsetHeight, y));

        car.style.left = x + 'px';
        car.style.top = y + 'px';

        // Update rotation based on velocity
        if (velocityX !== 0 || velocityY !== 0) {
          const angle = Math.atan2(velocityY, velocityX) * (180 / Math.PI);
          car.style.transform = `rotate(${angle + 90}deg)`; // Adjusted by 90 degrees to align the car image
        }

        requestAnimationFrame(updateCarPosition);
      }

      // Keydown event to track when a key is pressed
      function keydownHandler(event) {
        if (!isDriving) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation(); // Prevent event from reaching the page
          keysPressed[event.key] = true;
        }
      }

      // Keyup event to track when a key is released
      function keyupHandler(event) {
        if (!isDriving) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          keysPressed[event.key] = false;
        }
      }

      // Start the animation loop when driving mode is active
      function startDriving() {
        if (!isDriving) {
          isDriving = true;
          requestAnimationFrame(updateCarPosition);
        }
      }

      // Stop driving mode
      function stopDriving() {
        isDriving = false;
        // Clear keys pressed
        for (let key in keysPressed) {
          keysPressed[key] = false;
        }
      }

      // Toggle driving mode on click
      car.addEventListener('click', () => {
        if (isDriving) {
          stopDriving();
        } else {
          startDriving();
        }
      });

      // Add event listeners if not already added
      if (!window.isCarListenerAdded) {
        window.addEventListener('keydown', keydownHandler, { capture: true, passive: false });
        window.addEventListener('keyup', keyupHandler, { capture: true, passive: false });
        window.isCarListenerAdded = true;
      }

      sendResponse({ status: 'Car loaded! Click the car to start driving.' });
    } else {
      sendResponse({ status: 'Car is already loaded.' });
    }
  } else if (request.action === 'unloadCar') {
    const car = document.getElementById('carElement');
    if (car) {
      car.remove();

      // Remove event listeners if they were added
      if (window.isCarListenerAdded) {
        window.removeEventListener('keydown', keydownHandler, { capture: true, passive: false });
        window.removeEventListener('keyup', keyupHandler, { capture: true, passive: false });
        window.isCarListenerAdded = false;
      }

      // Reset variables
      isDriving = false;
      // Clear keysPressed object
      for (let key in keysPressed) {
        keysPressed[key] = false;
      }

      sendResponse({ status: 'Car unloaded.' });
    } else {
      sendResponse({ status: 'No car to unload.' });
    }
  }
});

