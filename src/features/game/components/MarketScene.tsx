import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { MARKET_ASSETS, MARKET_NPCS, MARKET_SPAWN, MARKET_SPLAT_COUNT, MARKET_START_VIEW, MARKET_STOPS } from '../data/market'
import { loadMerchantFactory } from './merchant'
import type { Merchant } from './merchant'

export interface MarketInput { forward: number; side: number; turn: number; reset: number }
interface Props {
  active: boolean
  target: number
  input: RefObject<MarketInput>
  onReady: () => void
  onError: (message: string) => void
  onPosition: (x: number, z: number, near: boolean) => void
  onProgress: (value: number) => void
}

// The renderer owns per-frame state; React only receives HUD updates at 8 Hz.
export default function MarketScene(props: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  useEffect(() => { latest.current = props }, [props])

  useEffect(() => {
    // Deferring allocation avoids two concurrent WASM decodes in StrictMode.
    const resource: { dispose?: () => void } = {}
    const timer = window.setTimeout(() => { resource.dispose = initialize() }, 0)
    function initialize() {
      const host = mount.current
      if (!host) return
      const lifetime = { stopped: false }
      const runtime = { ready: false, collider: null as THREE.Group | null, ...MARKET_START_VIEW, drag: null as { x: number; y: number; id: number } | null, lastHud: 0, lastReset: 0 }
      const keys = new Set<string>()
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#171e1b')
      const camera = new THREE.PerspectiveCamera(67, 1, 0.08, 90)
      camera.rotation.order = 'YXZ'
      const eyeHeight = 1.58
      camera.position.set(MARKET_SPAWN.x, eyeHeight, MARKET_SPAWN.z)
      let renderer: THREE.WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
      } catch {
        latest.current.onError('이 브라우저에서는 3D 시장을 열 수 없어요. WebGL2를 지원하는 브라우저로 다시 열어 주세요.')
        return
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.tabIndex = 0
      renderer.domElement.setAttribute('aria-label', '전통시장 3D 공간. W A S D 또는 방향키로 이동하고 드래그로 둘러보세요.')
      host.appendChild(renderer.domElement)
      const spark = new SparkRenderer({ renderer })
      scene.add(spark)
      const splat = new SplatMesh({
        url: MARKET_ASSETS.splat, enableLod: false, raycastable: false,
        onProgress: event => {
          if (!lifetime.stopped && event.lengthComputable) latest.current.onProgress(Math.min(95, Math.round(event.loaded / event.total * 90)))
        },
      })
      // This capture's SPZ positions are already in Three.js world coordinates.
      scene.add(splat)
      const ray = new THREE.Raycaster()
      ray.firstHitOnly = true
      const down = new THREE.Vector3(0, -1, 0)
      const up = new THREE.Vector3(0, 1, 0)
      const probe = new THREE.Vector3()
      const delta = new THREE.Vector3()
      const markers: THREE.Group[] = []
      const rings: THREE.Mesh[] = []
      const merchants: Merchant[] = []
      scene.add(new THREE.HemisphereLight('#fff7e4', '#706752', 2.2))
      const sunlight = new THREE.DirectionalLight('#fff1d6', 1.8)
      sunlight.position.set(2, 8, -5)
      scene.add(sunlight)
      const fillLight = new THREE.DirectionalLight('#f2f5ff', 0.8)
      fillLight.position.set(-4, 3, 5)
      scene.add(fillLight)

      function floorAt(x: number, z: number, height: number) {
        if (!runtime.collider) return null
        ray.set(probe.set(x, height, z), down)
        ray.near = 0
        ray.far = 2.5
        const hit = ray.intersectObject(runtime.collider, true)[0]
        if (!hit || !hit.face) return null
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        return normal.dot(up) > 0.65 ? hit.point.y : null
      }

      function makeNpc(x: number, z: number, index: number, createMerchant: (index: number) => Merchant) {
        const group = new THREE.Group()
        group.position.set(x, floorAt(x, z, 1.3) ?? 0, z)
        const merchant = createMerchant(index)
        group.add(merchant.visual)
        merchants.push(merchant)
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.65), new THREE.ShaderMaterial({
          transparent: true, depthWrite: false,
          vertexShader: 'varying vec2 shadowUv; void main(){shadowUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader: 'varying vec2 shadowUv; void main(){float r=length(shadowUv-0.5)*2.0;gl_FragColor=vec4(0.06,0.05,0.03,0.3*pow(max(0.0,1.0-r),1.5));}',
        }))
        shadow.rotation.x = -Math.PI / 2
        shadow.position.y = 0.015
        group.add(shadow)
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.025, 6, 48), new THREE.MeshBasicMaterial({ color: '#f2bd69', depthTest: false, transparent: true }))
        ring.rotation.x = -Math.PI / 2
        ring.position.y = 0.08
        ring.renderOrder = 10
        group.add(ring)
        const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: '#ffe1a3', depthTest: false }))
        beacon.position.y = 2.05
        beacon.renderOrder = 10
        group.add(beacon)
        scene.add(group)
        rings.push(ring)
        markers.push(group)
      }

      const loader = new GLTFLoader()
      Promise.all([splat.initialized, loader.loadAsync(MARKET_ASSETS.collider), loadMerchantFactory()]).then(([, gltf, createMerchant]) => {
        if (lifetime.stopped) {
          gltf.scene.traverse(object => {
            if (object instanceof THREE.Mesh) object.geometry.dispose()
          })
          return
        }
        if (splat.numSplats !== MARKET_SPLAT_COUNT) throw new Error(`Expected ${MARKET_SPLAT_COUNT} original splats, received ${splat.numSplats}`)
        console.info(`Market original loaded: ${splat.numSplats.toLocaleString()} splats; LOD disabled`)
        runtime.collider = gltf.scene
        runtime.collider.updateMatrixWorld(true)
        runtime.collider.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.boundsTree = new MeshBVH(object.geometry)
            object.raycast = acceleratedRaycast
            // Collision is queried separately; do not draw the runtime.collider over the splats.
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach(material => { material.side = THREE.DoubleSide })
          }
        })
        const floor = floorAt(MARKET_SPAWN.x, MARKET_SPAWN.z, 1.3)
        if (floor === null) throw new Error('spawn has no floor')
        camera.position.y = floor + eyeHeight
        MARKET_NPCS.forEach((stop, index) => makeNpc(stop.x, stop.z, index, createMerchant))
        runtime.ready = true
        latest.current.onProgress(100)
        latest.current.onReady()
      }).catch(cause => {
        console.error('Market initialization failed', cause)
        if (!lifetime.stopped) latest.current.onError('시장 맵을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.')
      })

      function resize() {
        const { width, height } = host!.getBoundingClientRect()
        renderer.setSize(width, height)
        camera.aspect = width / Math.max(height, 1)
        camera.updateProjectionMatrix()
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()
      const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable]')
      function keyDown(event: KeyboardEvent) {
        if (!latest.current.active || isTyping(event.target)) return
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
          keys.add(event.code)
          event.preventDefault()
        }
      }
      function keyUp(event: KeyboardEvent) { keys.delete(event.code) }
      function blur() { keys.clear(); runtime.drag = null }
      function pointerDown(event: PointerEvent) {
        if (!latest.current.active) return
        renderer.domElement.focus({ preventScroll: true })
        renderer.domElement.setPointerCapture(event.pointerId)
        runtime.drag = { x: event.clientX, y: event.clientY, id: event.pointerId }
      }
      function pointerMove(event: PointerEvent) {
        if (!runtime.drag || !latest.current.active || event.pointerId !== runtime.drag.id) return
        runtime.yaw -= (event.clientX - runtime.drag.x) * 0.003
        runtime.pitch = THREE.MathUtils.clamp(runtime.pitch - (event.clientY - runtime.drag.y) * 0.003, -0.8, 0.8)
        runtime.drag.x = event.clientX
        runtime.drag.y = event.clientY
      }
      function pointerUp() { runtime.drag = null }
      window.addEventListener('keydown', keyDown)
      window.addEventListener('keyup', keyUp)
      window.addEventListener('blur', blur)
      renderer.domElement.addEventListener('pointerdown', pointerDown)
      renderer.domElement.addEventListener('pointermove', pointerMove)
      renderer.domElement.addEventListener('pointerup', pointerUp)
      renderer.domElement.addEventListener('pointercancel', pointerUp)
      renderer.domElement.addEventListener('lostpointercapture', pointerUp)
      const timing = { last: performance.now(), elapsed: 0 }

      function canStep(x: number, z: number) {
        const foot = camera.position.y - eyeHeight
        const ground = floorAt(x, z, foot + 0.45)
        if (ground === null || Math.abs(ground - foot) > 0.32) return null
        const dx = x - camera.position.x
        const dz = z - camera.position.z
        delta.set(dx, 0, dz).normalize()
        for (const height of [0.45, 1.15]) {
          ray.set(probe.set(camera.position.x, foot + height, camera.position.z), delta)
          ray.near = 0
          ray.far = Math.hypot(dx, dz) + 0.25
          if (runtime.collider && ray.intersectObject(runtime.collider, true).length) return null
        }
        if (markers.some(marker => Math.hypot(marker.position.x - x, marker.position.z - z) < 0.6)) return null
        return ground
      }

      renderer.setAnimationLoop(() => {
        if (lifetime.stopped) return
        const now = performance.now()
        const dt = Math.min((now - timing.last) / 1000, 0.04)
        timing.last = now
        timing.elapsed += dt
        const current = latest.current
        const controls = current.input.current
        if (!current.active) { keys.clear(); runtime.drag = null }
        if (runtime.ready && controls.reset !== runtime.lastReset) {
          runtime.lastReset = controls.reset
          camera.position.set(MARKET_SPAWN.x, (floorAt(MARKET_SPAWN.x, MARKET_SPAWN.z, 1.3) ?? 0) + eyeHeight, MARKET_SPAWN.z)
          runtime.yaw = MARKET_START_VIEW.yaw
          runtime.pitch = MARKET_START_VIEW.pitch
        }
        if (runtime.ready && current.active) {
          const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')) + controls.forward
          const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + controls.side
          runtime.yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight')) - controls.turn) * dt * 1.4
          const length = Math.max(1, Math.hypot(forward, side))
          const step = 2.1 * dt / length
          const dx = (side * Math.cos(runtime.yaw) - forward * Math.sin(runtime.yaw)) * step
          const dz = (-forward * Math.cos(runtime.yaw) - side * Math.sin(runtime.yaw)) * step
          if (dx || dz) {
            const groundX = canStep(camera.position.x + dx, camera.position.z)
            if (groundX !== null) { camera.position.x += dx; camera.position.y = groundX + eyeHeight }
            const groundZ = canStep(camera.position.x, camera.position.z + dz)
            if (groundZ !== null) { camera.position.z += dz; camera.position.y = groundZ + eyeHeight }
          }
        }
        camera.rotation.set(runtime.pitch, runtime.yaw, 0)
        merchants.forEach(merchant => merchant.update(dt, timing.elapsed, camera.position))
        const activeMarker = current.target === 0 ? 0 : current.target === 3 ? 2 : 1
        rings.forEach((ring, i) => {
          const material = ring.material as THREE.MeshBasicMaterial
          material.opacity = i === activeMarker ? 0.9 : 0.25
          const beacon = markers[i].children[markers[i].children.length - 1]
          if (beacon) { beacon.rotation.y += dt; beacon.position.y = 2.05 + Math.sin(timing.elapsed * 2) * 0.1 }
        })
        if (runtime.ready && timing.elapsed - runtime.lastHud > 0.12) {
          runtime.lastHud = timing.elapsed
          const stop = MARKET_STOPS[current.target] ?? MARKET_STOPS[0]
          current.onPosition(camera.position.x, camera.position.z, Math.hypot(camera.position.x - stop.x, camera.position.z - stop.z) < 2.4)
        }
        renderer.render(scene, camera)
      })

      return () => {
        lifetime.stopped = true
        observer.disconnect()
        renderer.setAnimationLoop(null)
        window.removeEventListener('keydown', keyDown)
        window.removeEventListener('keyup', keyUp)
        window.removeEventListener('blur', blur)
        renderer.domElement.removeEventListener('pointerdown', pointerDown)
        renderer.domElement.removeEventListener('pointermove', pointerMove)
        renderer.domElement.removeEventListener('pointerup', pointerUp)
        renderer.domElement.removeEventListener('pointercancel', pointerUp)
        renderer.domElement.removeEventListener('lostpointercapture', pointerUp)
        const textures = new Set<THREE.Texture>()
        scene.traverse(object => {
          if (object instanceof THREE.Mesh && object !== spark) {
            object.geometry?.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach(material => {
              Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value) })
              material.dispose()
            })
            if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose()
          }
        })
        textures.forEach(texture => texture.dispose())
        runtime.collider?.traverse(object => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose()
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            materials.forEach(material => material.dispose())
          }
        })
        splat.dispose()
        spark.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }
    return () => { window.clearTimeout(timer); resource.dispose?.() }
  }, [])

  return <div className="market-scene" ref={mount} />
}
