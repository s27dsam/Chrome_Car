let car, keysPressed = {}, isDriving = false;
let x, y, velocity = 0, heading = 0, steerAngle = 0, carAngle = 0;
let maxSpeed = 7, acceleration = 0.1, deceleration = 0.05, turnSpeed = 0.05;
let staticFriction = 1.5, kineticFriction = 0.7;
let cones = [], coneCounter = 0, maxCones = 5, draggedCone = null, selectedCone = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'loadCar') {
    if (!document.getElementById('carElement')) {
      car = document.createElement('img');
      car.id = 'carElement';
      car.style.position = 'fixed';
      car.style.zIndex = '10000';
      car.style.cursor = 'pointer';
      car.style.border = 'none';
      document.body.appendChild(car);

      x = window.innerWidth / 2;
      y = window.innerHeight / 2;

      if (!window.isCarListenerAdded) {
        window.addEventListener('keydown', keydownHandler, { capture: true, passive: false });
        window.addEventListener('keyup', keyupHandler, { capture: true, passive: false });
        window.isCarListenerAdded = true;
      }
    }

    updateCarSettings(request);
    car.src = chrome.runtime.getURL(request.carImage || 'images/Car2.png');
    car.style.width = '100px';
    car.style.height = 'auto';

    if (!isDriving) {
      isDriving = true;
      requestAnimationFrame(updateCarPosition);
    }

    sendResponse({ status: 'Car loaded and ready to drive!' });

  } else if (request.action === 'unloadCar') {
    if (car) {
      car.remove();
      car = null;
      isDriving = false;
      keysPressed = {};
      if (window.isCarListenerAdded) {
        window.removeEventListener('keydown', keydownHandler, { capture: true, passive: false });
        window.removeEventListener('keyup', keyupHandler, { capture: true, passive: false });
        window.isCarListenerAdded = false;
      }
    }
    cones.forEach(c => c.remove());
    cones = [];
    coneCounter = 0;
    sendResponse({ status: 'Car and cones unloaded.' });

  } else if (request.action === 'updateSettings') {
    updateCarSettings(request);
    sendResponse({ status: 'Settings updated.' });
  } else if (request.action === 'addCone') {
    if (coneCounter < maxCones) {
      const cone = document.createElement('img');
      cone.src = chrome.runtime.getURL('images/Cone.png');
      cone.style.position = 'fixed';
      cone.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
      cone.style.top = `${Math.random() * (window.innerHeight - 50)}px`;
      cone.style.width = '50px';
      cone.style.height = 'auto';
      cone.style.zIndex = '9999';
      cone.style.cursor = 'move';
      cone.classList.add('cone-deselected');
      document.body.appendChild(cone);
      cones.push(cone);
      coneCounter++;

      cone.addEventListener('mousedown', coneMouseDown);
      cone.addEventListener('dblclick', toggleConeSelection);

      sendResponse({ status: 'coneAdded' });
    } else {
      sendResponse({ status: 'maxConesReached' });
    }
  } else if (request.action === 'getConeCount') {
    sendResponse({ coneCount: coneCounter });
  }
});

function toggleConeSelection(e) {
    const cone = e.target;
    if (selectedCone === cone) {
        selectedCone.classList.remove('cone-selected');
        selectedCone.classList.add('cone-deselected');
        selectedCone = null;
    } else {
        if (selectedCone) {
            selectedCone.classList.remove('cone-selected');
            selectedCone.classList.add('cone-deselected');
        }
        selectedCone = cone;
        selectedCone.classList.remove('cone-deselected');
        selectedCone.classList.add('cone-selected');
    }
}

function coneMouseDown(e) {
  if (selectedCone && selectedCone === e.target) {
    draggedCone = e.target;
    window.addEventListener('mousemove', coneMouseMove);
    window.addEventListener('mouseup', coneMouseUp);
  }
}

function coneMouseMove(e) {
  if (draggedCone) {
    draggedCone.style.left = `${e.clientX - 25}px`;
    draggedCone.style.top = `${e.clientY - 25}px`;
  }
}

function coneMouseUp(e) {
  draggedCone = null;
  window.removeEventListener('mousemove', coneMouseMove);
  window.removeEventListener('mouseup', coneMouseUp);
}

function updateCarSettings(settings) {
  maxSpeed = settings.speed || 7;
  const tires = settings.tires || 'normal';
  switch (tires) {
    case 'sport': staticFriction = 2.0; kineticFriction = 1.0; break;
    case 'drift': staticFriction = 1.0; kineticFriction = 0.5; break;
    default: staticFriction = 1.5; kineticFriction = 0.7; break;
  }
}

function createSmoke(x, y) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    smoke.style.left = `${x}px`;
    smoke.style.top = `${y}px`;
    smoke.style.width = `${Math.random() * 20 + 10}px`;
    smoke.style.height = smoke.style.width;
    document.body.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1000);
}

function updateCarPosition() {
  if (!isDriving || !car) return;

  // Steering
  if (keysPressed['arrowleft'] || keysPressed['a']) steerAngle = Math.max(-0.1, steerAngle - turnSpeed);
  else if (keysPressed['arrowright'] || keysPressed['d']) steerAngle = Math.min(0.1, steerAngle + turnSpeed);
  else steerAngle *= 0.9; // Auto-center steering

  // Acceleration and Deceleration
  if (keysPressed['arrowup'] || keysPressed['w']) velocity = Math.min(maxSpeed, velocity + acceleration);
  else if (keysPressed['arrowdown'] || keysPressed['s']) velocity = Math.max(-maxSpeed / 2, velocity - acceleration);
  else velocity *= (1 - deceleration);

  // Drifting Physics
  const turnRadius = 3.5 / Math.sin(steerAngle);
  const criticalSpeed = Math.sqrt(staticFriction * Math.abs(turnRadius));
  let isDrifting = Math.abs(velocity) > criticalSpeed;
  let frictionToUse = isDrifting ? kineticFriction : staticFriction;

  if (isDrifting) {
      const driftRadius = velocity * velocity / frictionToUse;
      const driftAngle = velocity / driftRadius;
      heading += driftAngle * Math.sign(steerAngle);
      createSmoke(x + car.offsetWidth / 2, y + car.offsetHeight / 2);

      // GTA2-style spin out
      if (Math.abs(steerAngle) > 0.05 && Math.abs(velocity) > maxSpeed * 0.6) {
          carAngle += 25; // Spin out
      }
  } else {
      heading += steerAngle * velocity / 5;
  }

  carAngle += (heading - carAngle) * 0.1;

  // Update Position
  const vx = Math.sin(carAngle) * velocity;
  const vy = -Math.cos(carAngle) * velocity;
  x += vx;
  y += vy;

  // Collision with window edges
  if (x <= 0 || x >= window.innerWidth - car.offsetWidth) x -= vx;
  if (y <= 0 || y >= window.innerHeight - car.offsetHeight) y -= vy;

  // Collision with cones
  for (const cone of cones) {
    const carRect = car.getBoundingClientRect();
    const coneRect = cone.getBoundingClientRect();
    if (carRect.left < coneRect.right && carRect.right > coneRect.left && carRect.top < coneRect.bottom && carRect.bottom > coneRect.top) {
      x -= vx;
      y -= vy;
      velocity = 0;
    }
  }

  car.style.left = `${x}px`;
  car.style.top = `${y}px`;
  car.style.transform = `rotate(${carAngle * (180 / Math.PI)}deg)`;

  requestAnimationFrame(updateCarPosition);
}

function keydownHandler(event) {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
    keysPressed[key] = true;
  }
}

function keyupHandler(event) {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    event.stopPropagation();
    keysPressed[key] = false;
  }
}