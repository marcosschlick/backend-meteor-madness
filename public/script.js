document.addEventListener("DOMContentLoaded", function () {
  if (!checkDependencies()) {
    return;
  }

  setupSliders();
  setupTabs();
  setupSimulationButton();
  setupRealAsteroids();
  initThreeDScene();
});

function checkDependencies() {
  if (typeof THREE === 'undefined') {
    alert('Error: Three.js no está cargado. Por favor recarga la página.');
    return false;
  }
  if (typeof THREE.OrbitControls === 'undefined') {
    alert('Error: OrbitControls no está disponible. Por favor recarga la página.');
    return false;
  }
  return true;
}

function setupSliders() {
  const sizeSlider = document.getElementById("asteroid-size");
  const velocitySlider = document.getElementById("asteroid-velocity");

  const sizeValue = document.getElementById("size-value");
  const velocityValue = document.getElementById("velocity-value");

  sizeSlider.addEventListener("input", function () {
    sizeValue.textContent = `${this.value} m`;
  });

  velocitySlider.addEventListener("input", function () {
    velocityValue.textContent = `${this.value} km/s`;
  });
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      this.classList.add("active");
      document.getElementById(`${tabId}-visualization`).classList.add("active");
    });
  });
}

function setupSimulationButton() {
  const simulateButton = document.getElementById("run-simulation");

  simulateButton.addEventListener("click", function () {
    const size = document.getElementById("asteroid-size").value;
    const velocity = document.getElementById("asteroid-velocity").value;
    const lat = document.getElementById("latitude").value;
    const lon = document.getElementById("longitude").value;

    if (!validateInputs(size, velocity, lat, lon)) {
      return;
    }

    simulate3D(size, velocity, lat, lon);
  });
}

function setupRealAsteroids() {
  const asteroidSelect = document.getElementById("real-asteroids");

  const NASA_API_KEY = 'cAWOrn61KAvPL7kNiHtJh0rDxJ6rJ3aZrDDs7Xj1';
  const NASA_URL = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${NASA_API_KEY}`;

  fetch(NASA_URL)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`NASA API error: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      asteroidSelect.innerHTML = '<option value="">-- Choose an asteroid --</option>';

      const asteroids = data.near_earth_objects || [];
      
      asteroids.slice(0, 10).forEach((asteroid) => {
        const option = document.createElement("option");
        
        const name = asteroid.name || "Unknown";
        const diameter = asteroid.estimated_diameter?.meters?.estimated_diameter_max || 100;
        const velocity = asteroid.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second * 1000 || 15000;
        
        option.value = asteroid.id;
        option.textContent = `${name} (${Math.round(diameter)}m, ${Math.round(velocity / 1000)}km/s)`;
        option.dataset.diameter = diameter;
        option.dataset.velocity = velocity;
        asteroidSelect.appendChild(option);
      });
    })
    .catch((err) => {
      loadKnownAsteroids(asteroidSelect);
    });

  asteroidSelect.addEventListener("change", function () {
    if (this.value) {
      const selectedOption = this.options[this.selectedIndex];
      const diameter = selectedOption.dataset.diameter;
      const velocity = selectedOption.dataset.velocity / 1000;

      document.getElementById("asteroid-size").value = diameter;
      document.getElementById("asteroid-velocity").value = velocity;

      document.getElementById("size-value").textContent = `${Math.round(diameter)} m`;
      document.getElementById("velocity-value").textContent = `${velocity} km/s`;
    }
  });
}

function loadKnownAsteroids(asteroidSelect) {
  const knownAsteroids = [
    { id: "apophis", name: "99942 Apophis", diameter: 370, velocity: 12500 },
    { id: "bennu", name: "101955 Bennu", diameter: 490, velocity: 10100 },
    { id: "ryugu", name: "162173 Ryugu", diameter: 900, velocity: 9800 },
    { id: "itokawa", name: "25143 Itokawa", diameter: 330, velocity: 11200 },
    { id: "ceres", name: "1 Ceres", diameter: 946000, velocity: 8000 },
    { id: "dinosaur", name: "Chicxulub Impactor", diameter: 10000, velocity: 20000 },
    { id: "tunguska", name: "Tunguska Event", diameter: 60, velocity: 15000 },
    { id: "chelyabinsk", name: "Chelyabinsk Meteor", diameter: 20, velocity: 19000 }
  ];

  asteroidSelect.innerHTML = '<option value="">-- Choose an asteroid --</option>';
  
  knownAsteroids.forEach((asteroid) => {
    const option = document.createElement("option");
    option.value = asteroid.id;
    option.textContent = `${asteroid.name} (${Math.round(asteroid.diameter)}m, ${Math.round(asteroid.velocity / 1000)}km/s)`;
    option.dataset.diameter = asteroid.diameter;
    option.dataset.velocity = asteroid.velocity;
    asteroidSelect.appendChild(option);
  });
}

let scene, camera, renderer, controls;
let earth, asteroid;
let asteroidVelocity = 0;

const EARTH_RADIUS = 5;
const ASTEROID_SCALE_FACTOR = 1000;

function initThreeDScene() {
  const canvas = document.getElementById("scene");
  if (!canvas) {
    return;
  }

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(
    canvas.parentElement.clientWidth,
    canvas.parentElement.clientHeight
  );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    canvas.parentElement.clientWidth / canvas.parentElement.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 20);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  const ambientLight = new THREE.AmbientLight(0x808080);
  scene.add(ambientLight);

  const sunPivot = new THREE.Object3D();
  scene.add(sunPivot);
  sunPivot.add(light);

  const target = new THREE.Object3D();
  target.position.set(0, 0, 20);
  scene.add(target);
  light.target = target;

  const loader = new THREE.TextureLoader();
  loader.load("./texture/asteroid_field_2.png", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  });

  const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
  const textureLoader = new THREE.TextureLoader();

  const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("texture/Earth-Color-Map-8k.png"),
    bumpMap: textureLoader.load("texture/Earth-Bump-Map-8k.png"),
    bumpScale: 0.1,
    specularMap: textureLoader.load("texture/8k_earth_specular_map.tif"),
    specular: new THREE.Color(0x111111),
  });

  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earth);

    if (intersects.length > 0) {
      const point = intersects[0].point.clone().normalize();
      const lat = Math.asin(point.y) * (180 / Math.PI);
      const lon = Math.atan2(point.z, point.x) * (180 / Math.PI);

      document.getElementById("latitude").value = lat.toFixed(6);
      document.getElementById("longitude").value = lon.toFixed(6);
    }
  });

  animate();

  window.addEventListener("resize", onWindowResize);
}

function validateInputs(size, velocity, lat, lon) {
  const errors = [];
  
  if (!size || size < 1 || size > 100000) {
    errors.push("Tamaño del asteroide debe estar entre 1 y 100,000 m");
  }
  
  if (!velocity || velocity < 1 || velocity > 72) {
    errors.push("Velocidad debe estar entre 1 y 72 km/s");
  }
  
  if (!lat || lat < -90 || lat > 90) {
    errors.push("Latitud debe estar entre -90 y 90");
  }
  
  if (!lon || lon < -180 || lon > 180) {
    errors.push("Longitud debe estar entre -180 y 180");
  }
  
  if (errors.length > 0) {
    alert("Errores de validación:\n" + errors.join("\n"));
    return false;
  }
  
  return true;
}

function cleanupPreviousSimulation() {
  if (asteroid) {
    scene.remove(asteroid);
    asteroid = null;
  }
  
  scene.children = scene.children.filter(child => 
    !child.userData || !child.userData.isExplosion
  );
}

function simulate3D(size, velocity, lat, lon) {
  cleanupPreviousSimulation();

  const asteroidSize = Math.max(size / ASTEROID_SCALE_FACTOR, 0.05);
  const asteroidGeo = new THREE.SphereGeometry(asteroidSize, 32, 32);
  const asteroidMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 30 });
  asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
  scene.add(asteroid);

  const radius = EARTH_RADIUS;
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);

  const targetX = radius * Math.cos(latRad) * Math.cos(lonRad);
  const targetY = radius * Math.sin(latRad);
  const targetZ = radius * Math.cos(latRad) * Math.sin(lonRad);
  const targetPos = new THREE.Vector3(targetX, targetY, targetZ);

  const offsetDistance = 30;
  const startPos = targetPos.clone().normalize().multiplyScalar(radius + offsetDistance);
  asteroid.position.copy(startPos);

  asteroid.userData.target = targetPos.clone();
  asteroid.userData.direction = targetPos.clone().sub(startPos).normalize();

  asteroidVelocity = velocity / 50;

  sendImpactData(size, velocity, lat, lon);
}

function sendImpactData(size, velocity, lat, lon) {
  showLoadingIndicator();

  const data = {
    diameter: parseFloat(size),
    velocity: parseFloat(velocity) * 1000,
    lat: parseFloat(lat),
    lon: parseFloat(lon),
  };

  const apiUrl = "http://localhost:5000/impact";

  fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .then((impactData) => {
      displayResults(impactData);
    })
    .catch((err) => {
      const simulatedData = simulateLocalImpact(data);
      displayResults(simulatedData);
    })
    .finally(() => {
      hideLoadingIndicator();
    });
}

function simulateLocalImpact(data) {
  const { diameter, velocity, lat, lon } = data;
  
  const density = 3000;
  const radius = diameter / 2;
  const volume = (4/3) * Math.PI * Math.pow(radius, 3);
  const mass = density * volume;
  const kineticEnergy = 0.5 * mass * Math.pow(velocity, 2);
  
  const tntEquivalent = kineticEnergy / (4.184e9);
  
  const craterRadius = 1.16 * Math.pow(diameter, 0.78) * Math.pow(density/1000, 0.44) * Math.pow(velocity/1000, 0.22);
  
  const seismicMagnitude = Math.max(0.67 * Math.log10(kineticEnergy) - 5.87, 1.0);
  
  const blastRadius = 100 * Math.pow(tntEquivalent, 1/3);
  
  const affectedArea = Math.PI * Math.pow(blastRadius, 2);
  
  
  let riskLevel = "Low";
  let riskDescription = "Localized impact, minimal global effects";
  
  if (kineticEnergy > 1e21) {
    riskLevel = "Catastrophic";
    riskDescription = "Global impact, civilization-threatening event";
    estimatedDeaths = Math.round(1000000 + Math.random() * 5000000);
  } else if (kineticEnergy > 1e18) {
    riskLevel = "High";
    riskDescription = "Continental impact, widespread destruction";
    estimatedDeaths = Math.round(100000 + Math.random() * 900000);
  } else if (kineticEnergy > 1e15) {
    riskLevel = "Average";
    riskDescription = "Regional impact, significant local damage";
    estimatedDeaths = Math.round(1000 + Math.random() * 99000);
  } else {
    riskLevel = "Low";
    riskDescription = "Localized impact, minimal damage";
    estimatedDeaths = Math.round(Math.random() * 1000);
  }
  
  return {
    kineticEnergy: kineticEnergy,
    tnt: tntEquivalent,
    craterRadius: Math.max(craterRadius, 10),
    seismicMagnitude: Math.min(seismicMagnitude, 10.0),
    blastRadius: blastRadius,
    affectedArea: affectedArea,
    riskLevel: riskLevel,
    riskDescription: riskDescription
  };
}

function showLoadingIndicator() {
  const button = document.getElementById("run-simulation");
  if (button) {
    button.disabled = true;
    button.textContent = "Simulando...";
  }
}

function hideLoadingIndicator() {
  const button = document.getElementById("run-simulation");
  if (button) {
    button.disabled = false;
    button.textContent = "Ejecutar Simulación";
  }
}

function displayResults(data) {
  document.getElementById("kinetic-energy").textContent = formatScientific(data.kineticEnergy);
  document.getElementById("tnt-equivalent").textContent = formatTNT(data.tnt);
  document.getElementById("crater-radius").textContent = formatDistance(data.craterRadius);
  document.getElementById("seismic-magnitude").textContent = data.seismicMagnitude.toFixed(1);
  document.getElementById("blast-radius").textContent = formatDistance(data.blastRadius);
  document.getElementById("affected-area").textContent = formatArea(data.affectedArea);

  const riskLevelElement = document.getElementById("risk-level");
  const riskDescriptionElement = document.getElementById("risk-description");

  riskLevelElement.textContent = data.riskLevel;
  riskLevelElement.className = "result-value risk-" + data.riskLevel.toLowerCase();

  const riskDescriptions = {
    Low: "Localized impact, minimal global effects",
    Average: "Regional impact, significant local damage",
    High: "Continental impact, widespread destruction",
    Catastrophic: "Global impact, civilization-threatening event",
  };

  riskDescriptionElement.textContent = riskDescriptions[data.riskLevel] || "Impact severity assessment";
}

function formatScientific(value) {
  return value.toExponential(2).replace("e+", " × 10^");
}

function formatTNT(tons) {
  if (tons >= 1e9) {
    return `${(tons / 1e9).toFixed(2)} Gt`;
  } else if (tons >= 1e6) {
    return `${(tons / 1e6).toFixed(2)} Mt`;
  } else if (tons >= 1e3) {
    return `${(tons / 1e3).toFixed(2)} kt`;
  } else {
    return `${tons.toFixed(2)} t`;
  }
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${meters.toFixed(0)} m`;
  }
}

function formatArea(squareMeters) {
  if (squareMeters >= 1e6) {
    return `${(squareMeters / 1e6).toFixed(2)} km²`;
  } else {
    return `${squareMeters.toFixed(0)} m²`;
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (earth) {
    earth.rotation.y += 0.001;
  }

  if (asteroid) {
    asteroid.position.addScaledVector(asteroid.userData.direction, asteroidVelocity);

    asteroid.rotation.x += 0.02;
    asteroid.rotation.y += 0.03;

    const dist = asteroid.position.distanceTo(asteroid.userData.target);
    if (dist < EARTH_RADIUS) {
      createExplosion(asteroid.userData.target.clone());
      scene.remove(asteroid);
      asteroid = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const canvas = document.getElementById("scene");
  if (!canvas) return;
  
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function createExplosion(position) {
  const explosionGroup = new THREE.Group();
  explosionGroup.userData = { isExplosion: true, life: 60 };
  
  const particleCount = 250;

  const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  
  const flash = new THREE.PointLight(0xffaa33, 3, 10);
  flash.position.copy(position);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 300);

  for (let i = 0; i < particleCount; i++) {
    const material = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5) 
    });
    const particle = new THREE.Mesh(particleGeometry, material);
    
    particle.position.copy(position);
    
    const speed = 0.1 + Math.random() * 0.2;
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed, 
      (Math.random() - 0.5) * speed
    );
    
    explosionGroup.add(particle);
  }
  
  scene.add(explosionGroup);
  animateExplosion(explosionGroup);
}

function animateExplosion(explosionGroup) {
  function updateExplosion() {
    explosionGroup.userData.life--;
    
    explosionGroup.children.forEach(particle => {
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.y -= 0.005;
      
      particle.scale.multiplyScalar(0.97);
    });
    
    if (explosionGroup.userData.life > 0) {
      requestAnimationFrame(updateExplosion);
    } else {
      scene.remove(explosionGroup);
    }
  }
  
  updateExplosion();
}