/**
 * CrediPulse AI — Three.js WebGL 3D Interactive Scene
 * Holographic wireframe financial geometries, 3D particle constellation, and mouse parallax camera.
 */

let threeScene, threeCamera, threeRenderer;
let torusKnotMesh, icosahedronGroup, particlesMesh, gridHelper;
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;
let is3DActive = true;
let animFrameId = null;

function initThreeScene() {
  const container = document.getElementById('webgl-canvas-container');
  if (!container || typeof THREE === 'undefined') {
    console.warn('Three.js or container not available. 3D WebGL scene skipped.');
    return;
  }

  // Check saved user preference for 3D FX
  const savedFx = localStorage.getItem('credipulse_3d_fx');
  if (savedFx === 'false') {
    is3DActive = false;
    document.body.classList.add('fx-3d-disabled');
    update3DToggleUI();
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  // 1. Scene & Depth Fog
  threeScene = new THREE.Scene();
  threeScene.fog = new THREE.FogExp2(0x070a13, 0.0016);

  // 2. Camera
  threeCamera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  threeCamera.position.z = 180;
  threeCamera.position.y = 15;

  // 3. Renderer with Antialias & Alpha
  threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  threeRenderer.setSize(width, height);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(threeRenderer.domElement);

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  threeScene.add(ambientLight);

  const pointLightCyan = new THREE.PointLight(0x06b6d4, 2.5, 300);
  pointLightCyan.position.set(100, 100, 100);
  threeScene.add(pointLightCyan);

  const pointLightPurple = new THREE.PointLight(0x8b5cf6, 2.5, 300);
  pointLightPurple.position.set(-100, -50, 100);
  threeScene.add(pointLightPurple);

  // 5. Holographic Wireframe Torus Knot (Floating Hero Structure)
  const knotGeometry = new THREE.TorusKnotGeometry(26, 6, 100, 16);
  const knotMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    emissive: 0x0891b2,
    emissiveIntensity: 0.4
  });
  torusKnotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
  torusKnotMesh.position.set(65, 20, -50);
  threeScene.add(torusKnotMesh);

  // 6. Floating Polyhedron Crystals
  icosahedronGroup = new THREE.Group();
  const icoGeom = new THREE.IcosahedronGeometry(12, 1);
  const icoMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.4,
    emissive: 0x7c3aed,
    emissiveIntensity: 0.5
  });

  for (let i = 0; i < 5; i++) {
    const ico = new THREE.Mesh(icoGeom, icoMaterial.clone());
    const angle = (i / 5) * Math.PI * 2;
    ico.position.set(
      Math.cos(angle) * 110,
      Math.sin(angle) * 70 + (Math.random() * 20 - 10),
      -40 + (Math.random() * 60 - 30)
    );
    ico.scale.setScalar(0.5 + Math.random() * 0.7);
    ico.userData = {
      rotSpeedX: 0.005 + Math.random() * 0.01,
      rotSpeedY: 0.005 + Math.random() * 0.01,
      floatSpeed: 0.001 + Math.random() * 0.002,
      initialY: ico.position.y
    };
    icosahedronGroup.add(ico);
  }
  threeScene.add(icosahedronGroup);

  // 7. Interactive 3D Particle Constellation (800+ nodes)
  const particleCount = 850;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color(0x06b6d4), // Cyan
    new THREE.Color(0x8b5cf6), // Purple
    new THREE.Color(0x10b981), // Emerald
    new THREE.Color(0xf59e0b)  // Amber
  ];

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 600;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 400;

    const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    particleColors[i * 3] = chosenColor.r;
    particleColors[i * 3 + 1] = chosenColor.g;
    particleColors[i * 3 + 2] = chosenColor.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.75
  });

  particlesMesh = new THREE.Points(particleGeometry, particleMaterial);
  threeScene.add(particlesMesh);

  // 8. Cyber Perspective Grid Floor
  gridHelper = new THREE.GridHelper(600, 40, 0x06b6d4, 0x1e293b);
  gridHelper.position.y = -90;
  gridHelper.material.opacity = 0.18;
  gridHelper.material.transparent = true;
  threeScene.add(gridHelper);

  // 9. Event Listeners for Parallax and Resize
  window.addEventListener('mousemove', onThreeMouseMove, { passive: true });
  window.addEventListener('resize', onThreeWindowResize);

  // Start Animation Loop
  animateThreeScene();
  update3DToggleUI();
}

function onThreeMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  targetCameraX = mouseX * 25;
  targetCameraY = 15 + (mouseY * 18);
}

function onThreeWindowResize() {
  if (!threeCamera || !threeRenderer) return;
  const width = window.innerWidth;
  const height = window.innerHeight;

  threeCamera.aspect = width / height;
  threeCamera.updateProjectionMatrix();
  threeRenderer.setSize(width, height);
}

function animateThreeScene() {
  if (!is3DActive) return;

  animFrameId = requestAnimationFrame(animateThreeScene);

  const time = Date.now() * 0.001;

  // Smooth Camera Parallax Lerp
  threeCamera.position.x += (targetCameraX - threeCamera.position.x) * 0.04;
  threeCamera.position.y += (targetCameraY - threeCamera.position.y) * 0.04;
  threeCamera.lookAt(0, 0, 0);

  // Rotate Torus Knot
  if (torusKnotMesh) {
    torusKnotMesh.rotation.x = time * 0.25;
    torusKnotMesh.rotation.y = time * 0.35;
    torusKnotMesh.position.y = 20 + Math.sin(time * 0.8) * 6;
  }

  // Animate Floating Icosahedrons
  if (icosahedronGroup) {
    icosahedronGroup.children.forEach(ico => {
      ico.rotation.x += ico.userData.rotSpeedX;
      ico.rotation.y += ico.userData.rotSpeedY;
      ico.position.y = ico.userData.initialY + Math.sin(time + ico.position.x) * 8;
    });
  }

  // Drift Particles
  if (particlesMesh) {
    particlesMesh.rotation.y = time * 0.02;
    particlesMesh.rotation.x = Math.sin(time * 0.015) * 0.05;
  }

  // Render Frame
  threeRenderer.render(threeScene, threeCamera);
}

/**
 * Toggle 3D WebGL Effects ON / OFF
 */
function toggle3DEffects() {
  is3DActive = !is3DActive;
  localStorage.setItem('credipulse_3d_fx', is3DActive ? 'true' : 'false');

  if (is3DActive) {
    document.body.classList.remove('fx-3d-disabled');
    if (!threeRenderer) {
      initThreeScene();
    } else {
      animateThreeScene();
    }
    showToast('3D WebGL Holographic FX: Enabled', 'success');
  } else {
    document.body.classList.add('fx-3d-disabled');
    if (animFrameId) cancelAnimationFrame(animFrameId);
    showToast('3D WebGL Holographic FX: Disabled (Power Saver)', 'info');
  }

  update3DToggleUI();
}

function update3DToggleUI() {
  const btn = document.getElementById('fx-3d-toggle-btn');
  if (btn) {
    if (is3DActive) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-cube text-cyan"></i> <span>3D FX: ON</span>';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-cube text-muted"></i> <span>3D FX: OFF</span>';
    }
  }
}
