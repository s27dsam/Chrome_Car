let car, keysPressed = {}, isDriving = false; let animationFrameId;
let x, y, velocity = 0, heading = 0, steerAngle = 0, carAngle = 0;
let maxSpeed = 3; let acceleration = 0.03; let deceleration = 0.05; let turnSpeed = 0.05
let staticFriction = 1.5; let kineticFriction = 0.7
let trailSegments = []
let trailColor = '#ff0000'
let maxTrailLength = 100
const fadeRate = 0.05

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'loadCar') {
    if (!document.getElementById('carElement')) {
      car = document.createElement('img')
      car.id = 'carElement'
      car.style.position = 'fixed'
      car.style.zIndex = '10000'
      car.style.cursor = 'pointer'
      car.style.border = 'none'
      document.body.appendChild(car)

      x = window.innerWidth / 2
      y = window.innerHeight / 2

      if (!window.isCarListenerAdded) {
        window.addEventListener('keydown', keydownHandler, { capture: true, passive: false })
        window.addEventListener('keyup', keyupHandler, { capture: true, passive: false })
        window.isCarListenerAdded = true
      }
    }

    updateCarSettings(request.settings)
    car.src = chrome.runtime.getURL(request.carImage || 'images/Car3.png')
    car.style.width = '40px'
    car.style.height = 'auto'

    if (!isDriving) {
      isDriving = true;
      animationFrameId = requestAnimationFrame(updateCarPosition);
    }

    sendResponse({ status: 'Car loaded and ready to drive!' })
  } else if (request.action === 'unloadCar') {
    if (car) {
      car.remove();
      car = null;
      isDriving = false;
      keysPressed = {};
      trailSegments = []; // Clear trail segments
      const canvas = document.getElementById('trailCanvas');
      if (canvas) {
        canvas.remove(); // Remove the canvas element
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (window.isCarListenerAdded) {
        window.removeEventListener('keydown', keydownHandler, { capture: true, passive: false });
        window.removeEventListener('keyup', keyupHandler, { capture: true, passive: false });
        window.isCarListenerAdded = false;
      }
    }
    sendResponse({ status: 'Car unloaded.' })
  } else if (request.action === 'updateSettings') {
    updateCarSettings(request.settings)
    sendResponse({ status: 'Settings updated.' })
  } else if (request.action === 'isCarLoaded') {
    sendResponse({ isLoaded: !!car })
  }
})

function updateCarSettings(settings) {
  maxSpeed = settings.speed || 7;
  const tires = settings.tires || 'normal';
  switch (tires) {
    case 'sport': staticFriction = 2.0; kineticFriction = 1.0; break;
    case 'drift': staticFriction = 1.0; kineticFriction = 0.5; break;
    default: staticFriction = 1.5; kineticFriction = 0.7; break;
  }
  trailColor = settings.trailColor || '#ff0000';
  maxTrailLength = settings.trailLength || 20;
}

function createSmoke (x, y) {
  const smoke = document.createElement('div')
  smoke.className = 'smoke'
  smoke.style.left = `${x}px`
  smoke.style.top = `${y}px`
  smoke.style.width = `${Math.random() * 20 + 10}px`
  smoke.style.height = smoke.style.width
  document.body.appendChild(smoke)
  setTimeout(() => smoke.remove(), 1000)
}

function updateCarPosition() {
  if (!isDriving || !car) return;

  let prevX = x;
  let prevY = y;

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

      // Apply drift rotation to carAngle for tail swing
      carAngle += (heading - carAngle) * 0.1; // Smoothly align carAngle with heading
      carAngle -= steerAngle * Math.abs(velocity) * 0.05; // Add drift offset
  } else {
      heading += steerAngle * velocity / 5;
      carAngle += (heading - carAngle) * 0.1; // Smoothly align carAngle with heading
  }

  // Update Position
  const vx = Math.sin(carAngle) * velocity;
  const vy = -Math.cos(carAngle) * velocity;
  x += vx;
  y += vy;

  // Collision with window edges
  if (x <= 0 || x >= window.innerWidth - car.offsetWidth) x -= vx;
  if (y <= 0 || y >= window.innerHeight - car.offsetHeight) y -= vy;

  car.style.left = `${x}px`;
  car.style.top = `${y}px`;
  car.style.transform = `rotate(${carAngle * (180 / Math.PI)}deg)`;

  updateTrail(prevX, prevY);
  drawTrail();

  requestAnimationFrame(updateCarPosition);
}

function updateTrail (prevX, prevY) {
  // Use the car's dimensions to calculate offsets
  const carWidth = car.offsetWidth
  const carHeight = car.offsetHeight
  const carCenterX = x + carWidth / 2
  const carCenterY = y + carHeight / 2
  const prevCarCenterX = prevX + carWidth / 2
  const prevCarCenterY = prevY + carHeight / 2

  // Position the start of the trails at the rear of the car
  const rearOffset = carHeight / 2
  // Distance between the two trail lines
  const wheelSeparation = carWidth / 2.5

  // Calculate the center of the rear axle for the current frame
  const rearAxleX = carCenterX - rearOffset * Math.sin(carAngle)
  const rearAxleY = carCenterY + rearOffset * Math.cos(carAngle)

  // Calculate the center of the rear axle for the previous frame
  const prevRearAxleX = prevCarCenterX - rearOffset * Math.sin(carAngle)
  const prevRearAxleY = prevCarCenterY + rearOffset * Math.cos(carAngle)

  // Vector perpendicular to the car's direction to position the wheels
  const perpX = Math.cos(carAngle)
  const perpY = Math.sin(carAngle)

  // Calculate current wheel positions
  const wheelLeftX = rearAxleX - wheelSeparation * perpX
  const wheelLeftY = rearAxleY - wheelSeparation * perpY
  const wheelRightX = rearAxleX + wheelSeparation * perpX
  const wheelRightY = rearAxleY + wheelSeparation * perpY

  // Calculate previous wheel positions
  const prevWheelLeftX = prevRearAxleX - wheelSeparation * perpX
  const prevWheelLeftY = prevRearAxleY - wheelSeparation * perpY
  const prevWheelRightX = prevRearAxleX + wheelSeparation * perpX
  const prevWheelRightY = prevRearAxleY + wheelSeparation * perpY

  // Add new segments if the car has moved
  if (x !== prevX || y !== prevY) {
    trailSegments.push({ startX: prevWheelLeftX, startY: prevWheelLeftY, endX: wheelLeftX, endY: wheelLeftY, opacity: 1 })
    trailSegments.push({ startX: prevWheelRightX, startY: prevWheelRightY, endX: wheelRightX, endY: wheelRightY, opacity: 1 })
  }

  // Fade and remove old segments
  for (let i = trailSegments.length - 1; i >= 0; i--) {
    trailSegments[i].opacity -= fadeRate
    if (trailSegments[i].opacity <= 0) {
      trailSegments.splice(i, 1)
    }
  }

  // Enforce max trail length
  while (trailSegments.length > maxTrailLength * 2) {
    trailSegments.splice(0, 2) // Remove the oldest pair of segments
  }
}

function drawTrail () {
  let canvas = document.getElementById('trailCanvas')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = 'trailCanvas'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.zIndex = '9999'
    canvas.style.pointerEvents = 'none'
    document.body.appendChild(canvas)
  }

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = trailColor
  ctx.lineWidth = 2

  for (const segment of trailSegments) {
    ctx.globalAlpha = segment.opacity
    ctx.beginPath()
    ctx.moveTo(segment.startX, segment.startY)
    ctx.lineTo(segment.endX, segment.endY)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function keydownHandler (event) {
  const key = event.key.toLowerCase()
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault()
    event.stopPropagation()
    keysPressed[key] = true
  }
}

function keyupHandler (event) {
  const key = event.key.toLowerCase()
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault()
    event.stopPropagation()
    keysPressed[key] = false
  }
}
