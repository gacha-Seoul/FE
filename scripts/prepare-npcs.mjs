// Microsoft Rocketbox (MIT): preserve geometry and texture pixels, convert TGA
// to lossless PNG so browsers can use the supplied human skin/clothing maps.
import { mkdir, writeFile } from 'node:fs/promises'
import { deflateSync, crc32 } from 'node:zlib'
import { TGALoader } from 'three/addons/loaders/TGALoader.js'

const base = 'https://raw.githubusercontent.com/microsoft/Microsoft-Rocketbox/master/'
const destination = new URL('../public/models/npcs/', import.meta.url)
const characters = [
  { directory: 'chef', source: 'Assets/Avatars/Professions/Chef_Female_01', name: 'Chef_Female_01', maps: ['f110_body_color', 'f110_body_normal', 'f110_body_specular', 'f110_head_color_a', 'f110_head_normal_a', 'f110_head_specular_a'] },
  { directory: 'gardener', source: 'Assets/Avatars/Professions/Gardener_Male_01', name: 'Gardener_Male_01', maps: ['m106_body_color', 'm106_body_normal', 'm106_body_specular', 'm106_head_color', 'm106_head_normal', 'm106_head_specular', 'm106_opacity_color'] },
]
function chunk(type, payload) {
  const name = Buffer.from(type)
  const size = Buffer.alloc(4)
  size.writeUInt32BE(payload.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, payload])))
  return Buffer.concat([size, name, payload, checksum])
}
function png(image) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(image.width, 0)
  header.writeUInt32BE(image.height, 4)
  header[8] = 8
  header[9] = 6 // RGBA8, no resampling or color changes.
  const scanlines = Buffer.alloc(image.height * (1 + image.width * 4))
  const pixels = Buffer.from(image.data)
  for (let y = 0; y < image.height; y++) {
    pixels.copy(scanlines, y * (1 + image.width * 4) + 1, y * image.width * 4, (y + 1) * image.width * 4)
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))])
}
async function fetchBytes(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}
await mkdir(destination, { recursive: true })
await writeFile(new URL('LICENSE.md', destination), await fetchBytes('LICENSE.md'))
for (const character of characters) {
  const folder = new URL(`${character.directory}/`, destination)
  await mkdir(folder, { recursive: true })
  await Promise.all([
    (async () => {
      await writeFile(new URL('human.fbx', folder), await fetchBytes(`${character.source}/Export/${character.name}_facial.fbx`))
      await writeFile(new URL('preview.png', folder), await fetchBytes(`${character.source}/${character.name}.png`))
    })(),
    ...character.maps.map(async name => {
      const bytes = await fetchBytes(`${character.source}/Textures/${name}.tga`)
      const image = new TGALoader().parse(bytes.buffer)
      await writeFile(new URL(`${name}.png`, folder), png(image))
      console.log(`${character.directory}/${name}.png: ${image.width} × ${image.height}, lossless RGBA`)
    }),
  ])
}
console.log('Textured human NPC assets prepared. Microsoft Rocketbox MIT license retained.')
