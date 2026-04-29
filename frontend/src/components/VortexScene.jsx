import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { buildVortex, updateParticles } from '../lib/vortex'

gsap.registerPlugin(ScrollTrigger)

export default function VortexScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const { renderer, scene, camera, mesh, particles, rings } = buildVortex(canvasRef.current)

    const state = { speedMultiplier: 1, idleTimer: 0, autoRotate: false }
    let targetRotX = 0, targetRotY = 0, lastTime = performance.now()

    // Mouse parallax
    const onMouseMove = (e) => {
      targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.52
      targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.26
      state.idleTimer = 0
      state.autoRotate = false
    }
    window.addEventListener('mousemove', onMouseMove)

    // Scroll speed
    gsap.to(state, {
      speedMultiplier: 3,
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 },
    })

    // Ring pulses
    rings.forEach((ring, i) => {
      const pulse = () => {
        gsap.to(ring.mesh.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' })
        gsap.to(ring.mat, { emissiveIntensity: 1.5, duration: 0.3, yoyo: true, repeat: 1 })
      }
      pulse()
      setInterval(pulse, 2000 + i * 400)
    })

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // Animation loop
    let rafId
    const animate = (now) => {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      state.idleTimer += dt
      if (state.idleTimer > 3) state.autoRotate = true
      if (state.autoRotate) targetRotY += 0.05 * dt

      scene.rotation.y += (targetRotY - scene.rotation.y) * 0.05
      scene.rotation.x += (targetRotX - scene.rotation.x) * 0.05

      updateParticles(mesh, particles, now / 1000, dt, state.speedMultiplier)
      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Animated visualization of a data pipeline — raw data particles flowing through Upload, Profile, Clean, Analyze, and Train stages"
    />
  )
}
