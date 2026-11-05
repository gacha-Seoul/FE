import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { DoubleSide, Mesh, Raycaster, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh'
import { MARKET_SPAWN, MARKET_STOPS } from '../src/features/game/data/market.ts'

for (const npc of MARKET_STOPS) {
  assert.ok(Math.hypot(MARKET_SPAWN.x - npc.x, MARKET_SPAWN.z - npc.z) >= 3,
    'The player must start at least 3m from NPCs, outside the interaction radius')
}

const asset = new URL('../public/models/market/', import.meta.url)
const root = new URL('../', import.meta.url)
for (const [original, deployed] of [
  ['Covered Korean Traditional Market.spz', 'market.spz'],
  ['Covered Korean Traditional Market_collider.glb', 'collider.glb'],
  ['Covered Korean Traditional Market_pano.png', 'panorama.png'],
]) {
  const originalHash = createHash('sha256').update(await readFile(new URL(original, root))).digest('hex')
  const deployedHash = createHash('sha256').update(await readFile(new URL(deployed, asset))).digest('hex')
  assert.equal(deployedHash, originalHash, `${deployed} must be the unmodified original`)
}
const raw = gunzipSync(await readFile(new URL('market.spz', asset)))
assert.equal(raw.readUInt32LE(0), 0x5053474e)
assert.equal(raw.readUInt32LE(4), 2)
assert.equal(raw.readUInt32LE(8), 1_920_000)
assert.equal(raw.length, 16 + 19 * 1_920_000)
const bytes = await readFile(new URL('collider.glb', asset))
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
scene.updateMatrixWorld(true)
scene.traverse(object => {
  if (object instanceof Mesh) {
    object.geometry.boundsTree = new MeshBVH(object.geometry)
    object.raycast = acceleratedRaycast
    object.material.side = DoubleSide
  }
})
const ray = new Raycaster()
ray.firstHitOnly = true
for (const point of [MARKET_SPAWN, ...MARKET_STOPS]) {
  ray.set(new Vector3(point.x, 1.3, point.z), new Vector3(0, -1, 0))
  ray.far = 2.5
  const hit = ray.intersectObject(scene, true)[0]
  assert.ok(hit?.face, `Missing floor at ${JSON.stringify(point)}`)
  assert.ok(hit.face.normal.clone().transformDirection(hit.object.matrixWorld).y > 0.65,
    `Spawn/NPC must stand on walkable floor, not a stall or steep surface: ${JSON.stringify(point)}`)
}
console.log('Market assets, spawn, and all NPC floor positions: PASS')
