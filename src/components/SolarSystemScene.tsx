import { OrbitControls, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useShallow } from 'zustand/react/shallow'
import { planetData } from '../data/planetData'
import { useSolarSystemStore } from '../store/solarSystemStore'
import { computeCloseupInsights } from '../utils/earthScience'
import { computeOrbitRadius, computePlanetRadius, computeSunRadius } from '../utils/scales'
import { OrbitRing } from './OrbitRing'
import { Planet, type PlanetMotionPayload } from './Planet'

type SceneFramerProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  earthPositionRef: React.RefObject<Vector3>
  moonPositionRef: React.RefObject<Vector3>
  fallbackEarthOrbitRadius: number
}

function SceneFramer({ controlsRef, earthPositionRef, moonPositionRef, fallbackEarthOrbitRadius }: SceneFramerProps) {
  const camera = useThree((state) => state.camera)
  const earthToMoonDirectionRef = useRef(new Vector3())
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

    if (mode === 'closeup') {
      if (earthPositionRef.current.lengthSq() < 0.01) {
        earthPositionRef.current.set(fallbackEarthOrbitRadius, 0, 0)
      }

      camera.position.set(
        earthPositionRef.current.x + 10.5,
        earthPositionRef.current.y + 4.8,
        earthPositionRef.current.z + 9.5,
      )
      controls.target.copy(earthPositionRef.current)
    } else if (mode === 'mooncloseup') {
      if (earthPositionRef.current.lengthSq() < 0.01) {
        earthPositionRef.current.set(fallbackEarthOrbitRadius, 0, 0)
      }

      if (moonPositionRef.current.lengthSq() < 0.01) {
        moonPositionRef.current.copy(earthPositionRef.current).add(new Vector3(6.8, 0, 0))
      }

      earthToMoonDirectionRef.current.copy(moonPositionRef.current).sub(earthPositionRef.current)
      if (earthToMoonDirectionRef.current.lengthSq() < 1e-5) {
        earthToMoonDirectionRef.current.set(1, 0, 0)
      } else {
        earthToMoonDirectionRef.current.normalize()
      }

      camera.position
        .copy(earthPositionRef.current)
        .addScaledVector(earthToMoonDirectionRef.current, 2.8)
        .add(new Vector3(0, 0.85, 0.35))
      controls.target.copy(moonPositionRef.current)
    } else if (mode === 'presentation') {
      camera.position.set(0, 72, 172)
      controls.target.set(0, 0, 0)
    } else {
      camera.position.set(0, 180, 920)
      controls.target.set(0, 0, 0)
    }

    controls.update()
  }, [camera, controlsRef, earthPositionRef, fallbackEarthOrbitRadius, frameRequest, mode, moonPositionRef])

  return null
}

type CloseupFollowerProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
  earthPositionRef: React.RefObject<Vector3>
  moonPositionRef: React.RefObject<Vector3>
}

function CloseupFollower({ controlsRef, earthPositionRef, moonPositionRef }: CloseupFollowerProps) {
  const camera = useThree((state) => state.camera)
  const mode = useSolarSystemStore((state) => state.mode)
  const previousEarthPositionRef = useRef(new Vector3())
  const movementDeltaRef = useRef(new Vector3())
  const currentOffsetRef = useRef(new Vector3())
  const defaultOffsetRef = useRef(new Vector3(10.5, 4.8, 9.5))
  const initializedRef = useRef(false)

  useEffect(() => {
    initializedRef.current = false
  }, [mode])

  useFrame(() => {
    if (mode !== 'closeup' && mode !== 'mooncloseup') {
      return
    }

    const controls = controlsRef.current
    if (!controls) {
      return
    }

    const focusPosition = mode === 'mooncloseup' ? moonPositionRef.current : earthPositionRef.current

    if (!initializedRef.current) {
      currentOffsetRef.current.copy(camera.position).sub(controls.target)
      if (currentOffsetRef.current.lengthSq() < 0.01) {
        currentOffsetRef.current.copy(defaultOffsetRef.current)
      }

      camera.position.copy(focusPosition).add(currentOffsetRef.current)
      controls.target.copy(focusPosition)
      previousEarthPositionRef.current.copy(focusPosition)
      initializedRef.current = true
      controls.update()
      return
    }

    movementDeltaRef.current.copy(focusPosition).sub(previousEarthPositionRef.current)
    if (movementDeltaRef.current.lengthSq() > 1e-8) {
      camera.position.add(movementDeltaRef.current)
    }

    controls.target.copy(focusPosition)
    previousEarthPositionRef.current.copy(focusPosition)
    controls.update()
  })

  return null
}

export function SolarSystemScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const earthPositionRef = useRef(new Vector3())
  const moonPositionRef = useRef(new Vector3())
  const insightsUpdatedAtRef = useRef(0)

  const {
    mode,
    timeScale,
    paused,
    distanceScale,
    sizeExaggeration,
    showOrbits,
    showLabels,
    surfaceTemperatureMode,
    seasonJumpTarget,
    seasonJumpRequestId,
    selectedPlanetId,
    selectPlanet,
  } =
    useSolarSystemStore(
      useShallow((state) => ({
        mode: state.mode,
        timeScale: state.timeScale,
        paused: state.paused,
        distanceScale: state.distanceScale,
        sizeExaggeration: state.sizeExaggeration,
        showOrbits: state.showOrbits,
        showLabels: state.showLabels,
        surfaceTemperatureMode: state.surfaceTemperatureMode,
        seasonJumpTarget: state.seasonJumpTarget,
        seasonJumpRequestId: state.seasonJumpRequestId,
        selectedPlanetId: state.selectedPlanetId,
        selectPlanet: state.selectPlanet,
      })),
    )

  const setCloseupInsights = useSolarSystemStore((state) => state.setCloseupInsights)

  const scaledPlanets = useMemo(
    () =>
      planetData.map((planet) => ({
        ...planet,
        renderOrbitRadius: computeOrbitRadius(planet.orbitRadiusAU, mode, distanceScale),
        renderRadius: computePlanetRadius(planet.radiusKm, mode, sizeExaggeration),
      })),
    [distanceScale, mode, sizeExaggeration],
  )

  const visiblePlanets = useMemo(
    () =>
      mode === 'closeup' || mode === 'mooncloseup'
        ? scaledPlanets.filter((planet) => planet.id === 'earth')
        : scaledPlanets,
    [mode, scaledPlanets],
  )

  const earthOrbitRadius = useMemo(
    () => scaledPlanets.find((planet) => planet.id === 'earth')?.renderOrbitRadius ?? 34,
    [scaledPlanets],
  )

  const handleEarthMotion = useCallback(
    (payload: PlanetMotionPayload) => {
      const [x, y, z] = payload.worldPosition
      earthPositionRef.current.set(x, y, z)
      if (payload.moonWorldPosition) {
        moonPositionRef.current.set(payload.moonWorldPosition[0], payload.moonWorldPosition[1], payload.moonWorldPosition[2])
      }

      if ((mode !== 'closeup' && mode !== 'mooncloseup') || typeof payload.moonOrbitAngle !== 'number') {
        return
      }

      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      if (now - insightsUpdatedAtRef.current < 120) {
        return
      }

      insightsUpdatedAtRef.current = now
      setCloseupInsights(computeCloseupInsights(payload.orbitAngle, payload.moonOrbitAngle))
    },
    [mode, setCloseupInsights],
  )

  const sunRadius = computeSunRadius(mode, sizeExaggeration)
  const effectiveTimeScale = paused ? 0 : timeScale

  return (
    <Canvas
      camera={{ fov: 50, near: 0.1, far: 20000, position: [0, 72, 172] }}
      dpr={[1, 1.8]}
      onPointerMissed={() => selectPlanet(null)}
    >
      <color attach="background" args={['#030511']} />
      <SceneFramer
        controlsRef={controlsRef}
        earthPositionRef={earthPositionRef}
        moonPositionRef={moonPositionRef}
        fallbackEarthOrbitRadius={earthOrbitRadius}
      />
      <CloseupFollower controlsRef={controlsRef} earthPositionRef={earthPositionRef} moonPositionRef={moonPositionRef} />

      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={0} decay={2} />

      <Stars radius={mode === 'realistic' ? 12000 : 1200} depth={70} count={4000} factor={5} fade />

      <mesh>
        <sphereGeometry args={[sunRadius, 48, 48]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ff9f3f" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {showOrbits &&
        visiblePlanets.map((planet) => <OrbitRing key={`${planet.id}-orbit`} radius={planet.renderOrbitRadius} />)}

      <Suspense fallback={null}>
        {visiblePlanets.map((planet) => (
          <Planet
            key={planet.id}
            planet={planet}
            orbitRadius={planet.renderOrbitRadius}
            radius={planet.renderRadius}
            timeScale={effectiveTimeScale}
            selected={selectedPlanetId === planet.id}
            showLabel={showLabels}
            showOrbits={showOrbits}
            mode={mode}
            surfaceTemperatureMode={surfaceTemperatureMode}
            seasonJumpTarget={seasonJumpTarget}
            seasonJumpRequestId={seasonJumpRequestId}
            onSelect={selectPlanet}
            onMotionUpdate={planet.id === 'earth' ? handleEarthMotion : undefined}
          />
        ))}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={mode !== 'closeup' && mode !== 'mooncloseup'}
        minDistance={mode === 'closeup' ? 3 : mode === 'mooncloseup' ? 1.2 : 12}
        maxDistance={mode === 'presentation' ? 500 : mode === 'closeup' ? 240 : mode === 'mooncloseup' ? 120 : 16000}
        minPolarAngle={mode === 'closeup' || mode === 'mooncloseup' ? 0.02 : 0}
        maxPolarAngle={mode === 'closeup' || mode === 'mooncloseup' ? Math.PI - 0.02 : Math.PI * 0.48}
      />
    </Canvas>
  )
}
