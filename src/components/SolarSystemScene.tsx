import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { planetData } from '../data/planetData'
import { useSolarSystemStore } from '../store/solarSystemStore'
import { computeOrbitRadius, computePlanetRadius, computeSunRadius } from '../utils/scales'
import { OrbitRing } from './OrbitRing'
import { Planet } from './Planet'

type SceneFramerProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function SceneFramer({ controlsRef }: SceneFramerProps) {
  const camera = useThree((state) => state.camera)
  const { frameRequest, mode } = useSolarSystemStore(
    useShallow((state) => ({
      frameRequest: state.frameRequest,
      mode: state.mode,
    })),
  )

  useEffect(() => {
    const controls = controlsRef.current

    if (!controls) {
      return
    }

    if (mode === 'presentation') {
      camera.position.set(0, 72, 172)
    } else {
      camera.position.set(0, 180, 920)
    }

    controls.target.set(0, 0, 0)
    controls.update()
  }, [camera, controlsRef, frameRequest, mode])

  return null
}

export function SolarSystemScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const { mode, timeScale, distanceScale, sizeExaggeration, showOrbits, showLabels, selectedPlanetId, selectPlanet } =
    useSolarSystemStore(
      useShallow((state) => ({
        mode: state.mode,
        timeScale: state.timeScale,
        distanceScale: state.distanceScale,
        sizeExaggeration: state.sizeExaggeration,
        showOrbits: state.showOrbits,
        showLabels: state.showLabels,
        selectedPlanetId: state.selectedPlanetId,
        selectPlanet: state.selectPlanet,
      })),
    )

  const scaledPlanets = useMemo(
    () =>
      planetData.map((planet) => ({
        ...planet,
        renderOrbitRadius: computeOrbitRadius(planet.orbitRadiusAU, mode, distanceScale),
        renderRadius: computePlanetRadius(planet.radiusKm, mode, sizeExaggeration),
      })),
    [distanceScale, mode, sizeExaggeration],
  )

  const sunRadius = computeSunRadius(mode, sizeExaggeration)

  return (
    <Canvas
      camera={{ fov: 50, near: 0.1, far: 20000, position: [0, 72, 172] }}
      dpr={[1, 1.8]}
      onPointerMissed={() => selectPlanet(null)}
    >
      <color attach="background" args={['#030511']} />
      <SceneFramer controlsRef={controlsRef} />

      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={0} decay={2} />

      <Stars radius={mode === 'presentation' ? 1200 : 12000} depth={70} count={4000} factor={5} fade />

      <mesh>
        <sphereGeometry args={[sunRadius, 48, 48]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ff9f3f" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {showOrbits &&
        scaledPlanets.map((planet) => <OrbitRing key={`${planet.id}-orbit`} radius={planet.renderOrbitRadius} />)}

      {scaledPlanets.map((planet) => (
        <Planet
          key={planet.id}
          planet={planet}
          orbitRadius={planet.renderOrbitRadius}
          radius={planet.renderRadius}
          timeScale={timeScale}
          selected={selectedPlanetId === planet.id}
          showLabel={showLabels}
          mode={mode}
          onSelect={selectPlanet}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={12}
        maxDistance={mode === 'presentation' ? 500 : 16000}
        maxPolarAngle={Math.PI * 0.48}
      />
    </Canvas>
  )
}
