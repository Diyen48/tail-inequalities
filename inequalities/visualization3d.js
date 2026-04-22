/**
 * Visualization3D — Three.js surface visualization
 * Manual orbit controls — no external imports needed.
 */

export class Visualization3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error('3D container not found: ' + containerId);

    this.scene       = null;
    this.camera      = null;
    this.renderer    = null;
    this.surfaceMesh = null;
    this.currentType = 'markov';
    this.isRotating  = false;
    this.animId      = null;

    this._orbit = { active: false, lastX: 0, lastY: 0, theta: 0.6, phi: 0.9, radius: 18 };
    this._init();
  }

  _init() {
    const W = this.container.clientWidth  || 800;
    const H = this.container.clientHeight || 500;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020917);
    this.scene.fog = new THREE.Fog(0x020917, 25, 50);

    this.camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    this._updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this._setupLights();
    this._setupGrid();
    this._setupOrbitControls();
    window.addEventListener('resize', () => this._onResize());
    this._renderLoop();
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const d1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    d1.position.set(10, 15, 10);
    this.scene.add(d1);

    const d2 = new THREE.DirectionalLight(0xffffff, 0.7);
    d2.position.set(-10, 8, -8);
    this.scene.add(d2);

    const p = new THREE.PointLight(0x34d399, 0.5, 28);
    p.position.set(0, 8, 0);
    this.scene.add(p);
  }

  _setupGrid() {
    const grid = new THREE.GridHelper(20, 20, 0x0d2840, 0x071828);
    grid.position.y = -0.02;
    this.scene.add(grid);

    this._addAxisArrow(new THREE.Vector3(10, 0, 0), 0xf87171, 'X');
    this._addAxisArrow(new THREE.Vector3(0,  8, 0), 0x34d399, 'Y');
    this._addAxisArrow(new THREE.Vector3(0,  0, 10), 0x38bdf8, 'Z');
  }

  _addAxisArrow(dir, color, label) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const geo = new THREE.CylinderGeometry(0.04, 0.04, dir.length(), 8);
    const mesh = new THREE.Mesh(geo, mat);

    if (dir.x > 0)      { mesh.rotation.z = -Math.PI / 2; mesh.position.set(dir.x / 2, 0, 0); }
    else if (dir.y > 0) { mesh.position.set(0, dir.y / 2, 0); }
    else                { mesh.rotation.x =  Math.PI / 2; mesh.position.set(0, 0, dir.z / 2); }
    this.scene.add(mesh);

    const coneGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
    const cone = new THREE.Mesh(coneGeo, mat);
    if (dir.x > 0)      { cone.rotation.z = -Math.PI / 2; cone.position.copy(dir); }
    else if (dir.y > 0) { cone.position.copy(dir); }
    else                { cone.rotation.x =  Math.PI / 2; cone.position.copy(dir); }
    this.scene.add(cone);
  }

  _setupOrbitControls() {
    const el = this.renderer.domElement;
    el.addEventListener('mousedown',  e => { this._orbit.active = true; this._orbit.lastX = e.clientX; this._orbit.lastY = e.clientY; });
    el.addEventListener('mouseup',    () => { this._orbit.active = false; });
    el.addEventListener('mouseleave', () => { this._orbit.active = false; });
    el.addEventListener('mousemove',  e => {
      if (!this._orbit.active) return;
      const dx = e.clientX - this._orbit.lastX;
      const dy = e.clientY - this._orbit.lastY;
      this._orbit.theta -= dx * 0.01;
      this._orbit.phi    = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this._orbit.phi - dy * 0.01));
      this._orbit.lastX  = e.clientX;
      this._orbit.lastY  = e.clientY;
      this._updateCameraPosition();
    });
    el.addEventListener('wheel', e => {
      this._orbit.radius = Math.max(6, Math.min(35, this._orbit.radius + e.deltaY * 0.03));
      this._updateCameraPosition();
      e.preventDefault();
    }, { passive: false });

    let lastTouch = null;
    el.addEventListener('touchstart',  e => { lastTouch = e.touches[0]; });
    el.addEventListener('touchmove',   e => {
      if (!lastTouch) return;
      const t = e.touches[0];
      const dx = t.clientX - lastTouch.clientX;
      const dy = t.clientY - lastTouch.clientY;
      this._orbit.theta -= dx * 0.01;
      this._orbit.phi    = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this._orbit.phi - dy * 0.01));
      lastTouch = t;
      this._updateCameraPosition();
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchend', () => { lastTouch = null; });
  }

  _updateCameraPosition() {
    const { theta, phi, radius } = this._orbit;
    this.camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    this.camera.lookAt(0, 1.5, 0);
  }

  _clearSurface() {
    if (this.surfaceMesh)    { this.scene.remove(this.surfaceMesh);    this.surfaceMesh.geometry.dispose(); }
    if (this.thresholdMesh)  { this.scene.remove(this.thresholdMesh);  this.thresholdMesh.geometry?.dispose(); }
    if (this.thresholdPlane) { this.scene.remove(this.thresholdPlane); this.thresholdPlane.geometry?.dispose(); }
    this.scene.children.filter(c => c.userData.isLabel).forEach(c => this.scene.remove(c));
  }

  _buildSurface(hFn, colorFn, segments = 60) {
    const geo = new THREE.BufferGeometry();
    const N   = segments + 1;
    const pos = new Float32Array(N * N * 3);
    const col = new Float32Array(N * N * 3);
    const idx = [];

    let maxH = 0;
    const raw = new Float32Array(N * N);
    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const x = (ix / segments) * 12;
        const z = (iz / segments) * 12;
        const h = Math.max(0, hFn(x, z));
        raw[iz * N + ix] = h;
        if (h > maxH) maxH = h;
      }
    }
    if (maxH === 0) maxH = 1;

    for (let iz = 0; iz < N; iz++) {
      for (let ix = 0; ix < N; ix++) {
        const i  = iz * N + ix;
        const x  = (ix / segments) * 12;
        const z  = (iz / segments) * 12;
        const h  = raw[i];
        const hn = h / maxH;

        pos[i*3]   = x - 6;
        pos[i*3+1] = hn * 5.5;
        pos[i*3+2] = z - 6;

        const c = colorFn(x, z, hn);
        col[i*3]   = c[0];
        col[i*3+1] = c[1];
        col[i*3+2] = c[2];
      }
    }

    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iz * N + ix;
        const b = a + 1;
        const c = a + N;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 70,
      transparent: true,
      opacity: 0.92
    });

    return new THREE.Mesh(geo, mat);
  }

  _addThresholdWall(threshold) {
    const tx = threshold - 6;
    const pts = [
      new THREE.Vector3(tx, 0, -6), new THREE.Vector3(tx, 6, -6),
      new THREE.Vector3(tx, 6, 6),  new THREE.Vector3(tx, 0, 6)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[0]]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf87171, linewidth: 2 });
    const line = new THREE.Line(lineGeo, lineMat);
    line.userData.isLabel = true;
    this.scene.add(line);

    const geo = new THREE.PlaneGeometry(0.05, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(tx, 3, 0);
    this.thresholdPlane = wall;
    this.scene.add(wall);
  }

  _addMeanLine(mean) {
    const mx = mean - 6;
    const pts = [new THREE.Vector3(mx, 0, -6), new THREE.Vector3(mx, 6, -6)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    line.userData.isLabel = true;
    this.scene.add(line);
  }

  // ─── PUBLIC METHODS ──────────────────────────────────────
  createMarkovVisualization(mean = 2, threshold = 5) {
    this.currentType = 'markov';
    this._clearSurface();

    this.surfaceMesh = this._buildSurface(
      (x, _z) => (1 / mean) * Math.exp(-x / mean),
      (x, _z, hn) => {
        const inTail = x >= threshold ? 1 : 0;
        return inTail
          ? [0.95, 0.25 + hn * 0.3, 0.25]
          : [0.05 + hn * 0.1, 0.55 + hn * 0.35, 0.7 - hn * 0.2];
      }
    );
    this.scene.add(this.surfaceMesh);
    this._addThresholdWall(threshold);
    this._addMeanLine(mean);
    this._updateDescription(`Markov · Exp(μ=${mean.toFixed(1)}) · a=${threshold.toFixed(1)} · bound=${Math.min(1, mean/threshold).toFixed(3)}`);
  }

  createChebyshevVisualization(mean = 2, threshold = 5) {
    this.currentType = 'chebyshev';
    this._clearSurface();
    const variance = 4;

    this.surfaceMesh = this._buildSurface(
      (x, _z) => {
        const sigma = Math.sqrt(variance);
        return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * variance));
      },
      (x, _z, hn) => {
        const inTail = Math.abs(x - mean) >= threshold ? 1 : 0;
        return inTail
          ? [0.95, 0.25, 0.3 + hn * 0.3]
          : [0.15 + hn * 0.2, 0.65 + hn * 0.3, 0.65];
      }
    );
    this.scene.add(this.surfaceMesh);
    this._addThresholdWall(mean + threshold);
    this._addMeanLine(mean);

    const tx2 = mean - threshold - 6;
    if (tx2 >= -6) {
      const pts = [
        new THREE.Vector3(tx2, 0, -6), new THREE.Vector3(tx2, 6, -6),
        new THREE.Vector3(tx2, 6,  6), new THREE.Vector3(tx2, 0,  6)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[0]]);
      const mat = new THREE.LineBasicMaterial({ color: 0xf87171 });
      const l = new THREE.Line(geo, mat); l.userData.isLabel = true;
      this.scene.add(l);
    }

    const sigma = Math.sqrt(variance);
    const k     = threshold / sigma;
    const bound = Math.min(1, 1 / (k * k));
    this._updateDescription(`Chebyshev · N(μ=${mean.toFixed(1)}, σ²=4) · k=${k.toFixed(2)}σ · bound=1/k²=${bound.toFixed(3)}`);
  }

  createChernoffVisualization(mean = 2, threshold = 5) {
    this.currentType = 'chernoff';
    this._clearSurface();

    this.surfaceMesh = this._buildSurface(
      (x, _z) => Math.exp(-x / mean),
      (x, _z, hn) => {
        const inTail = x >= threshold ? 1 : 0;
        return inTail
          ? [1.0, 0.35 + hn * 0.2, 0.15]
          : [0.95, 0.65 + hn * 0.3, 0.1 + hn * 0.15];
      }
    );
    this.scene.add(this.surfaceMesh);
    this._addThresholdWall(threshold);
    this._addMeanLine(mean);

    const delta = Math.max(0.1, threshold / mean - 1);
    const bound = Math.min(1, delta <= 1 ? Math.exp(-mean * delta * delta / 2) : Math.exp(-mean * delta / 3));
    this._updateDescription(`Chernoff · Exp(μ=${mean.toFixed(1)}) · a=${threshold.toFixed(1)} · bound=${bound.toExponential(3)}`);
  }

  _updateDescription(text) {
    const el = document.getElementById('viz-3d-description');
    if (el) el.textContent = text;
  }

  toggleRotation() { this.isRotating = !this.isRotating; }
  zoomIn()  { this._orbit.radius = Math.max(6,  this._orbit.radius * 0.85);  this._updateCameraPosition(); }
  zoomOut() { this._orbit.radius = Math.min(35, this._orbit.radius * 1.15); this._updateCameraPosition(); }

  _renderLoop() {
    this.animId = requestAnimationFrame(() => this._renderLoop());
    if (this.isRotating) {
      this._orbit.theta += 0.005;
      this._updateCameraPosition();
    }
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const W = this.container.clientWidth;
    const H = this.container.clientHeight;
    if (W === 0 || H === 0) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  dispose() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.renderer.dispose();
  }
}