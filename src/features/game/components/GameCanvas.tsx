import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'

// Replace the calibration geometry with the map renderer after its asset format is known.
export default function GameCanvas({ active }: { active: boolean }) {
  return <Canvas camera={{ position: [7, 6, 9], fov: 45 }} dpr={[1, 1.5]}>
    <color attach="background" args={['#e6ece5']} />
    <ambientLight intensity={1.5} />
    <directionalLight position={[5, 8, 3]} intensity={2} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#d2dcca" /></mesh>
    <Grid args={[20, 20]} cellColor="#a5b39e" sectionColor="#7a947e" fadeDistance={25} />
    <mesh position={[0, 1, 0]}><boxGeometry args={[2, 2, 2]} /><meshStandardMaterial color="#315e4b" roughness={0.8} /></mesh>
    <mesh position={[3, 0.5, 0]}><sphereGeometry args={[0.5, 24, 16]} /><meshStandardMaterial color="#d5a44e" /></mesh>
    <OrbitControls enabled={active} target={[0, 0.8, 0]} maxPolarAngle={Math.PI / 2.05} minDistance={3} maxDistance={22} />
  </Canvas>
}
