// Funções principais do simulador
document.addEventListener("DOMContentLoaded", function () {
  // Configurar controles deslizantes
  setupSliders();

  // Configurar abas
  setupTabs();

  // Configurar botão de simulação
  setupSimulationButton();

  // Inicializar simulação 3D
  initThreeDScene();
});

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

      // Remover classe active de todos os botões e conteúdos
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Adicionar classe active ao botão e conteúdo atual
      this.classList.add("active");
      document.getElementById(`${tabId}-visualization`).classList.add("active");
    });
  });
}

function setupSimulationButton() {
  const simulateButton = document.getElementById("run-simulation");

  simulateButton.addEventListener("click", function () {
    // Coletar parâmetros
    const size = document.getElementById("asteroid-size").value;
    const velocity = document.getElementById("asteroid-velocity").value;
    const lat = document.getElementById("latitude").value;
    const lon = document.getElementById("longitude").value;

    // Executar simulação 3D (mantém na aba 3D)
    simulate3D(size, velocity, lat, lon);
  });
}

// ===== SIMULAÇÃO 3D =====

let scene, camera, renderer, controls;
let earth, asteroid;
let asteroidVelocity = 0;

function initThreeDScene() {
  const canvas = document.getElementById("scene");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(
    canvas.parentElement.clientWidth,
    canvas.parentElement.clientHeight
  );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Câmera
  camera = new THREE.PerspectiveCamera(
    60,
    canvas.parentElement.clientWidth / canvas.parentElement.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 20);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Luz
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

  // Carregar textura do céu
  const loader = new THREE.TextureLoader();
  loader.load("./texture/asteroid_field_2.png", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
  });

  // Terra
  const earthGeometry = new THREE.SphereGeometry(5, 32, 32);
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

  // Raycaster para clique
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

  // Loop de animação
  animate();

  // Resize
  window.addEventListener("resize", onWindowResize);
}

function simulate3D(size, velocity, lat, lon) {
  // Validar coordenadas
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    alert(
      "Please select an impact location by clicking on Earth in the 3D view"
    );
    // Mudar para aba 3D para que o usuário possa clicar na Terra
    document.querySelector('[data-tab="threeD"]').click();
    return;
  }

  // Remover asteroide anterior se existir
  if (asteroid) {
    scene.remove(asteroid);
    asteroid = null;
  }

  // Criar novo asteroide
  const asteroidGeo = new THREE.SphereGeometry(size / 50, 16, 16);
  const asteroidMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
  asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);

  // Posicionar asteroide
  asteroid.position.set(-30, 0, 0);
  scene.add(asteroid);
  asteroidVelocity = velocity / 100;

  // Enviar dados para backend e processar resultados
  sendImpactData(size, velocity, lat, lon);
}

function sendImpactData(size, velocity, lat, lon) {
  const data = {
    diameter: parseFloat(size),
    velocity: parseFloat(velocity) * 1000, // Convert km/s to m/s for backend
    lat: parseFloat(lat),
    lon: parseFloat(lon),
  };

  fetch("/impact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((impactData) => {
      console.log("Backend response:", impactData);
      displayResults(impactData);
      // Mudar para aba de resultados
    })
    .catch((err) => {
      console.error("Error sending data:", err);
      // Não exibir erro na tela 3D, apenas no console
    });
}

function displayResults(data) {
  // Atualizar interface com dados do backend
  document.getElementById("kinetic-energy").textContent = formatScientific(
    data.kineticEnergy
  );
  document.getElementById("tnt-equivalent").textContent = formatTNT(data.tnt);
  document.getElementById("crater-radius").textContent = formatDistance(
    data.craterRadius
  );
  document.getElementById("seismic-magnitude").textContent =
    data.seismicMagnitude.toFixed(1);
  document.getElementById("blast-radius").textContent = formatDistance(
    data.blastRadius
  );
  document.getElementById("affected-area").textContent = formatArea(
    data.affectedArea
  );
  document.getElementById("estimated-deaths").textContent = data.estimatedDeaths
    ? data.estimatedDeaths.toLocaleString()
    : "N/A";

  // Atualizar nível de risco com styling
  const riskLevelElement = document.getElementById("risk-level");
  const riskDescriptionElement = document.getElementById("risk-description");

  riskLevelElement.textContent = data.riskLevel;
  riskLevelElement.className =
    "result-value risk-" + data.riskLevel.toLowerCase();

  // Descrição baseada no nível de risco
  const riskDescriptions = {
    Low: "Localized impact, minimal global effects",
    Average: "Regional impact, significant local damage",
    High: "Continental impact, widespread destruction",
    Catastrophic: "Global impact, civilization-threatening event",
  };

  riskDescriptionElement.textContent =
    riskDescriptions[data.riskLevel] || "Impact severity assessment";
}

// Funções de formatação usando as ordens de grandeza do backend
function formatScientific(value) {
  return value.toExponential(2).replace("e+", " × 10^");
}

function formatTNT(tons) {
  if (tons >= 1e9) {
    return `${(tons / 1e9).toFixed(2)} Gt`; // Gigatons
  } else if (tons >= 1e6) {
    return `${(tons / 1e6).toFixed(2)} Mt`; // Megatons
  } else if (tons >= 1e3) {
    return `${(tons / 1e3).toFixed(2)} kt`; // Kilotons
  } else {
    return `${tons.toFixed(2)} t`; // Tons
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

  if (asteroid) {
    asteroid.position.x += asteroidVelocity;

    const dist = asteroid.position.distanceTo(earth.position);
    if (dist < 5 + asteroid.geometry.parameters.radius) {
      createExplosion(asteroid.position.clone());
      scene.remove(asteroid);
      asteroid = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const canvas = document.getElementById("scene");
  camera.aspect =
    canvas.parentElement.clientWidth / canvas.parentElement.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    canvas.parentElement.clientWidth,
    canvas.parentElement.clientHeight
  );
}

function createExplosion(position) {
  const particles = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.1, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

  for (let i = 0; i < 50; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(position);
    p.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    );
    particles.add(p);
  }

  scene.add(particles);

  let life = 60;
  function animateExplosion() {
    life--;
    particles.children.forEach((p) => p.position.add(p.userData.velocity));
    if (life > 0) requestAnimationFrame(animateExplosion);
    else scene.remove(particles);
  }
  animateExplosion();
}
