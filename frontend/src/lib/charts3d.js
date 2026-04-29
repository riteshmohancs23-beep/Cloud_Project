import * as THREE from 'three'

// ── Safe canvas size helper ───────────────────────────────────────────────────
function canvasSize(canvas) {
  const w = canvas.offsetWidth  || canvas.clientWidth  || canvas.parentElement?.offsetWidth  || 400
  const h = canvas.offsetHeight || canvas.clientHeight || canvas.parentElement?.offsetHeight || 300
  return { w, h }
}

/* ─────────────────────────────────────────────
   3D Correlation Terrain
   Peaks = strong positive, valleys = negative
───────────────────────────────────────────── */
export function buildCorrelationTerrain(canvas, matrix) {
  const cols = Object.keys(matrix)
  const n = cols.length
  if (n < 2) return null

  const { w, h } = canvasSize(canvas)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050d1a, 0.08)

  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, n * 0.9, n * 1.1)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0x334466, 3))
  const dl = new THREE.DirectionalLight(0x00d4ff, 2)
  dl.position.set(5, 10, 5)
  scene.add(dl)

  const size = n * 0.9
  const geo = new THREE.PlaneGeometry(size, size, n - 1, n - 1)
  geo.rotateX(-Math.PI / 2)

  const positions = geo.attributes.position
  const colors = []

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const idx = row * n + col
      const val = matrix[cols[row]]?.[cols[col]] ?? 0
      positions.setY(idx, val * 1.2)
      const c = new THREE.Color()
      if (val >= 0) c.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xe8527a), val)
      else          c.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0x00d4ff), -val)
      colors.push(c.r, c.g, c.b)
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true, wireframe: false,
    transparent: true, opacity: 0.88, shininess: 80,
  })
  scene.add(new THREE.Mesh(geo, mat))
  scene.add(new THREE.Mesh(geo.clone(),
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.1 })
  ))

  let isDragging = false, lastX = 0, lastY = 0, rotY = 0.4, rotX = 0.3, zoom = 1

  const onDown  = e => { isDragging = true; lastX = e.clientX; lastY = e.clientY }
  const onUp    = ()  => { isDragging = false }
  const onMove  = e => {
    if (!isDragging) return
    rotY += (e.clientX - lastX) * 0.008
    rotX += (e.clientY - lastY) * 0.005
    rotX = Math.max(-0.8, Math.min(1.2, rotX))
    lastX = e.clientX; lastY = e.clientY
  }
  const onWheel = e => { zoom = Math.max(0.5, Math.min(2.5, zoom + e.deltaY * 0.001)) }

  canvas.addEventListener('mousedown', onDown)
  canvas.addEventListener('mouseup',   onUp)
  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('wheel',     onWheel, { passive: true })

  const ro = new ResizeObserver(() => {
    const { w: rw, h: rh } = canvasSize(canvas)
    if (rw < 1 || rh < 1) return
    renderer.setSize(rw, rh)
    camera.aspect = rw / rh
    camera.updateProjectionMatrix()
  })
  ro.observe(canvas.parentElement || canvas)

  let rafId
  const animate = () => {
    rafId = requestAnimationFrame(animate)
    if (!isDragging) rotY += 0.003
    const r = n * 1.1 * zoom
    camera.position.set(Math.sin(rotY) * r, r * rotX + 2, Math.cos(rotY) * r)
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }
  animate()

  return () => {
    cancelAnimationFrame(rafId)
    ro.disconnect()
    canvas.removeEventListener('mousedown', onDown)
    canvas.removeEventListener('mouseup',   onUp)
    canvas.removeEventListener('mousemove', onMove)
    canvas.removeEventListener('wheel',     onWheel)
    renderer.dispose()
  }
}

/* ─────────────────────────────────────────────
   3D Skewness Histogram Bars
   Metallic bars with animated growth
───────────────────────────────────────────── */
export function buildSkewnessChart(canvas, skewness) {
  const entries = Object.entries(skewness)
  if (!entries.length) return null

  const { w, h } = canvasSize(canvas)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, 4, entries.length * 0.9 + 4)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0x334466, 2))
  const dl = new THREE.DirectionalLight(0xffffff, 2)
  dl.position.set(4, 8, 4)
  scene.add(dl)

  const maxVal = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.001)
  const spacing = 1.4
  const totalW = (entries.length - 1) * spacing
  const bars = []

  entries.forEach(([col, val], i) => {
    const targetH = (Math.abs(val) / maxVal) * 3 + 0.1
    const color = val >= 0 ? 0xe8527a : 0x00d4ff
    const geo = new THREE.BoxGeometry(0.8, 0.01, 0.8)
    const mat = new THREE.MeshStandardMaterial({
      color, metalness: 0.7, roughness: 0.2,
      emissive: color, emissiveIntensity: 0.3,
    })
    const bar = new THREE.Mesh(geo, mat)
    bar.position.set(i * spacing - totalW / 2, 0, 0)
    scene.add(bar)
    bars.push({ mesh: bar, targetH, currentH: 0.01 })
  })

  const grid = new THREE.GridHelper(entries.length * 2, entries.length * 2, 0x1a2b45, 0x1a2b45)
  grid.position.y = -0.01
  scene.add(grid)

  const ro = new ResizeObserver(() => {
    const { w: rw, h: rh } = canvasSize(canvas)
    if (rw < 1 || rh < 1) return
    renderer.setSize(rw, rh)
    camera.aspect = rw / rh
    camera.updateProjectionMatrix()
  })
  ro.observe(canvas.parentElement || canvas)

  let rafId, t = 0
  const animate = () => {
    rafId = requestAnimationFrame(animate)
    t += 0.016
    bars.forEach((b, idx) => {
      if (b.currentH < b.targetH) {
        b.currentH = Math.min(b.targetH, b.currentH + b.targetH * 0.04)
        b.mesh.geometry.dispose()
        b.mesh.geometry = new THREE.BoxGeometry(0.8, b.currentH, 0.8)
        b.mesh.position.y = b.currentH / 2
      }
      b.mesh.material.emissiveIntensity = 0.25 + Math.sin(t * 1.5 + idx) * 0.1
    })
    camera.position.x = Math.sin(t * 0.15) * 2
    camera.lookAt(0, 1.5, 0)
    renderer.render(scene, camera)
  }
  animate()

  return () => { cancelAnimationFrame(rafId); ro.disconnect(); renderer.dispose() }
}

/* ─────────────────────────────────────────────
   3D Radar / Spider Chart for ML Metrics
   Slowly rotating, glowing vertices
───────────────────────────────────────────── */
export function buildRadarChart(canvas, metrics) {
  const entries = Object.entries(metrics).filter(([, v]) => v != null)
  if (!entries.length) return null

  const { w, h } = canvasSize(canvas)
  if (w < 1 || h < 1) return null

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(w, h)
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, 3, 7)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0x334466, 3))
  const pl = new THREE.PointLight(0x00d4ff, 2, 20)
  pl.position.set(0, 5, 0)
  scene.add(pl)

  const n = entries.length
  const R = 2.5

  const normalize = (label, val) => {
    if (label === 'mae' || label === 'mse') return Math.max(0, 1 - Math.min(val, 1))
    return Math.min(1, Math.max(0, val))
  }

  const angles = entries.map((_, i) => (i / n) * Math.PI * 2 - Math.PI / 2)

  // Axis lines
  angles.forEach(a => {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)]
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.6 })
    ))
  })

  // Concentric rings
  ;[0.25, 0.5, 0.75, 1.0].forEach(scale => {
    const pts = angles.map(a => new THREE.Vector3(Math.cos(a) * R * scale, 0, Math.sin(a) * R * scale))
    pts.push(pts[0].clone())
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.4 })
    ))
  })

  // Filled radar shape
  const radarPts = entries.map(([label, val], i) => {
    const r = normalize(label, val) * R
    return new THREE.Vector3(Math.cos(angles[i]) * r, 0, Math.sin(angles[i]) * r)
  })

  const shape = new THREE.Shape()
  radarPts.forEach((p, i) => i === 0 ? shape.moveTo(p.x, p.z) : shape.lineTo(p.x, p.z))
  shape.closePath()
  const shapeGeo = new THREE.ShapeGeometry(shape)
  shapeGeo.rotateX(Math.PI / 2)
  scene.add(new THREE.Mesh(shapeGeo,
    new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
  ))

  // Outline
  scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([...radarPts, radarPts[0].clone()]),
    new THREE.LineBasicMaterial({ color: 0x00d4ff, linewidth: 2 })
  ))

  // Glowing vertex spheres
  const spheres = radarPts.map((p, i) => {
    const val = normalize(entries[i][0], entries[i][1])
    const color = new THREE.Color().lerpColors(new THREE.Color(0xe8527a), new THREE.Color(0x00d4ff), val)
    const s = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1, metalness: 0.5, roughness: 0.2 })
    )
    s.position.copy(p)
    scene.add(s)
    return s
  })

  const ro = new ResizeObserver(() => {
    const { w: rw, h: rh } = canvasSize(canvas)
    if (rw < 1 || rh < 1) return
    renderer.setSize(rw, rh)
    camera.aspect = rw / rh
    camera.updateProjectionMatrix()
  })
  ro.observe(canvas.parentElement || canvas)

  let rafId, t = 0
  const animate = () => {
    rafId = requestAnimationFrame(animate)
    t += 0.016
    scene.rotation.y += 0.005
    spheres.forEach((s, i) => {
      s.material.emissiveIntensity = 0.8 + Math.sin(t * 2 + i) * 0.4
    })
    renderer.render(scene, camera)
  }
  animate()

  return () => { cancelAnimationFrame(rafId); ro.disconnect(); renderer.dispose() }
}
