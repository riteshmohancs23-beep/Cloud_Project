import * as THREE from 'three'

const PARTICLE_COUNT = window.navigator.hardwareConcurrency < 4 ? 500 : 2000

const STAGES = [
  { label: 'Upload',  color: 0x00d4ff, z: 0   },
  { label: 'Profile', color: 0xe8527a, z: -4  },
  { label: 'Clean',   color: 0x00b8d9, z: -8  },
  { label: 'Analyze', color: 0xff6b9d, z: -12 },
  { label: 'Train',   color: 0x00d4ff, z: -16 },
]

export function buildVortex(canvas) {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  // Scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050d1a)
  scene.fog = new THREE.FogExp2(0x050d1a, 0.032)

  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 3, 12)
  camera.lookAt(0, 0, -8)

  // Lights
  scene.add(new THREE.AmbientLight(0x1a2b45, 2))
  STAGES.forEach(s => {
    const pl = new THREE.PointLight(s.color, 3, 12)
    pl.position.set(0, 0, s.z)
    scene.add(pl)
  })

  // Grid floor
  const grid = new THREE.GridHelper(40, 40, 0x1A2B45, 0x1A2B45)
  grid.position.y = -4
  scene.add(grid)

  // Particles — InstancedMesh
  const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08)
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x00d4ff, transparent: true, opacity: 0.65,
    roughness: 0.1, metalness: 0.4, transmission: 0.3,
  })
  const mesh = new THREE.InstancedMesh(geo, mat, PARTICLE_COUNT)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(mesh)

  // Particle state
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    theta: Math.random() * Math.PI * 2,
    r0: 4 + Math.random() * 3,
    t: Math.random() * 6,
    z: Math.random() * 2,
    seed: Math.random() * Math.PI * 2,
  }))

  // Rings
  const rings = STAGES.map(s => {
    const rGeo = new THREE.TorusGeometry(2, 0.05, 16, 100)
    const rMat = new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.8 })
    const torus = new THREE.Mesh(rGeo, rMat)
    torus.position.z = s.z
    torus.rotation.x = Math.PI / 2
    scene.add(torus)
    return { mesh: torus, mat: rMat }
  })

  return { renderer, scene, camera, mesh, particles, rings }
}

export function updateParticles(mesh, particles, time, dt, speedMult) {
  const dummy = new THREE.Object3D()
  const stageColors = [0x00d4ff, 0xe8527a, 0x00b8d9, 0xff6b9d, 0x00d4ff]

  particles.forEach((p, i) => {
    p.theta += (0.3 * dt + Math.sin(time + p.seed) * 0.02) * speedMult
    p.radius = p.r0 * Math.exp(-0.15 * p.t)
    p.t += dt * 0.5 * speedMult
    p.z -= dt * 0.8 * speedMult

    if (p.z < -18 || p.radius < 0.1) {
      p.theta = Math.random() * Math.PI * 2
      p.r0 = 4 + Math.random() * 3
      p.t = 0
      p.z = 2
    }

    dummy.position.set(
      p.radius * Math.cos(p.theta),
      p.radius * Math.sin(p.theta) * 0.4,
      p.z
    )
    dummy.rotation.set(time * 0.3 + p.seed, time * 0.2, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)

    // Color by stage
    const stageIdx = Math.min(4, Math.floor((-p.z) / 4))
    const c = new THREE.Color(stageColors[stageIdx])
    mesh.setColorAt(i, c)
  })

  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}
