import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

type MerchantKind = 'chef' | 'gardener'
export interface Merchant {
  visual: THREE.Group
  update: (dt: number, time: number, player: THREE.Vector3) => void
}

async function loadHuman(kind: MerchantKind): Promise<THREE.Group> {
  const folder = `/models/npcs/${kind}/`
  const manager = new THREE.LoadingManager()
  const failures: string[] = []
  const texturesReady = new Promise<void>(resolve => { manager.onLoad = resolve })
  manager.onError = url => { failures.push(url) }
  // FBX references original TGA names. Their PNG copies preserve every pixel.
  manager.setURLModifier(url => {
    const filename = url.split(/[\\/]/).pop() ?? ''
    return /\.tga$/i.test(filename) ? folder + filename.replace(/\.tga$/i, '.png') : url
  })
  manager.addHandler(/\.tga$/i, new THREE.TextureLoader(manager))
  const root = await new FBXLoader(manager).loadAsync(folder + 'human.fbx')
  await texturesReady
  if (failures.length) throw new Error(`Human NPC textures failed: ${failures.length}`)
  root.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(root)
  const height = bounds.max.y - bounds.min.y
  root.scale.setScalar((kind === 'chef' ? 1.66 : 1.74) / height)
  root.position.y = -bounds.min.y * root.scale.x
  root.updateMatrixWorld(true)

  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    const source = Array.isArray(object.material) ? object.material : [object.material]
    const materials = source.map(value => {
      const original = value as THREE.MeshPhongMaterial
      const material = new THREE.MeshStandardMaterial({
        name: original.name,
        map: original.map,
        normalMap: original.normalMap,
        alphaMap: original.alphaMap,
        roughness: /head/.test(original.name) ? 0.72 : 0.94,
        metalness: 0,
        // Max's original diffuse tint must not darken the supplied skin maps.
        color: '#ffffff',
        alphaTest: /opacity/.test(original.name) ? 0.45 : 0,
        side: /opacity/.test(original.name) ? THREE.DoubleSide : THREE.FrontSide,
      })
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace
      material.normalScale.set(0.6, 0.6)
      return material
    })
    object.material = Array.isArray(object.material) ? materials : materials[0]
  })
  return root
}

function boneNamed(root: THREE.Object3D, name: string) {
  return root.getObjectByName(`Bip01_${name}`) as THREE.Bone | undefined
}

// Rest the upper arms by the sides and slightly bend the elbows instead of
// showing the model's authoring A-pose. All rotations remain on its real rig.
function pointBone(bone: THREE.Bone | undefined, child: THREE.Bone | undefined, direction: THREE.Vector3) {
  if (!bone || !child || !bone.parent) return
  bone.updateWorldMatrix(true, true)
  const current = child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize()
  const world = new THREE.Quaternion().setFromUnitVectors(current, direction.normalize())
    .multiply(bone.getWorldQuaternion(new THREE.Quaternion()))
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world))
  bone.updateWorldMatrix(true, true)
}

function addApron(parent: THREE.Group) {
  const rows = 12
  const columns = 10
  const positions: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= rows; row++) {
    const t = row / rows
    const y = 1.34 - t * 0.79
    const width = t < 0.35 ? 0.125 + t * 0.13 : 0.175 + (t - 0.35) * 0.07
    for (let column = 0; column <= columns; column++) {
      const u = column / columns * 2 - 1
      positions.push(u * width, y, 0.15 + 0.075 * (1 - u * u) + Math.sin(column * 1.6) * 0.003 * t)
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column
        indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const cloth = new THREE.MeshStandardMaterial({ color: '#405f4b', roughness: 1, side: THREE.DoubleSide })
  parent.add(new THREE.Mesh(geometry, cloth))
  const pocket = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.14, 3, 3), new THREE.MeshStandardMaterial({ color: '#374f40', roughness: 1, side: THREE.DoubleSide }))
  pocket.position.set(0, 0.95, 0.233)
  parent.add(pocket)
  for (const side of [-1, 1]) {
    const strap = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.10, 1.32, 0.19),
      new THREE.Vector3(side * 0.13, 1.43, 0.09),
      new THREE.Vector3(side * 0.12, 1.42, -0.11),
    ])
    parent.add(new THREE.Mesh(new THREE.TubeGeometry(strap, 12, 0.013, 5, false), cloth))
  }
}

export async function loadMerchantFactory() {
  const [gardener, chef] = await Promise.all([loadHuman('gardener'), loadHuman('chef')])
  return (index: number): Merchant => {
    const human = clone(index === 0 ? gardener : chef) as THREE.Group
    human.updateMatrixWorld(true)
    for (const [side, sign] of [['L', 1], ['R', -1]] as const) {
      pointBone(boneNamed(human, `${side}_UpperArm`), boneNamed(human, `${side}_Forearm`), new THREE.Vector3(sign * 0.12, -1, 0.04))
      pointBone(boneNamed(human, `${side}_Forearm`), boneNamed(human, `${side}_Hand`), new THREE.Vector3(-sign * 0.06, -1, 0.16))
    }
    const visual = new THREE.Group()
    visual.add(human)
    if (index === 0) addApron(visual)

    const faceMeshes: THREE.Mesh[] = []
    human.traverse(object => {
      if (object instanceof THREE.Mesh && object.morphTargetDictionary) {
        faceMeshes.push(object)
        for (const [name, target] of Object.entries(object.morphTargetDictionary)) {
          if (/AK_4[45]_MouthSmile/.test(name) && object.morphTargetInfluences) object.morphTargetInfluences[target] = 0.08
        }
      }
    })
    const spine = boneNamed(human, 'Spine2')
    const head = boneNamed(human, 'Head')
    const spineRest = spine?.quaternion.clone()
    const headRest = head?.quaternion.clone()
    const idle = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const worldPosition = new THREE.Vector3()
    const phase = index * 1.7
    return {
      visual,
      update(dt, time, player) {
        visual.getWorldPosition(worldPosition)
        const distance = Math.hypot(player.x - worldPosition.x, player.z - worldPosition.z)
        if (distance < 6) {
          const target = Math.atan2(player.x - worldPosition.x, player.z - worldPosition.z)
          const difference = THREE.MathUtils.euclideanModulo(target - visual.rotation.y + Math.PI, Math.PI * 2) - Math.PI
          visual.rotation.y += difference * Math.min(1, dt * 1.8)
        }
        const breath = Math.sin(time * 1.8 + phase)
        if (spine && spineRest) spine.quaternion.copy(spineRest).multiply(idle.setFromEuler(euler.set(0.004 * breath, 0, 0.007 * breath)))
        if (head && headRest) head.quaternion.copy(headRest).multiply(idle.setFromEuler(euler.set(0.006 * Math.sin(time * 0.7 + phase), 0, 0.012 * Math.sin(time * 0.5 + phase))))
        const blinkTime = (time + phase) % 4.7
        const blink = blinkTime < 0.18 ? Math.sin(blinkTime / 0.18 * Math.PI) : 0
        for (const mesh of faceMeshes) {
          for (const [name, target] of Object.entries(mesh.morphTargetDictionary!)) {
            if (/AK_(09|10)_EyeBlink/.test(name) && mesh.morphTargetInfluences) mesh.morphTargetInfluences[target] = blink
          }
        }
      },
    }
  }
}
