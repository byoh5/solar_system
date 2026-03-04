import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, Vector3, type Group, type Mesh } from 'three'
import type { PlanetData } from '../data/planetData'
import type { DisplayMode } from '../store/solarSystemStore'

export type PlanetMotionPayload = {
  planetId: PlanetData['id']
  orbitAngle: number
  moonOrbitAngle?: number
  worldPosition: [number, number, number]
  moonWorldPosition?: [number, number, number]
}

type PlanetProps = {
  planet: PlanetData
  orbitRadius: number
  radius: number
  timeScale: number
  selected: boolean
  showLabel: boolean
  mode: DisplayMode
  onSelect: (planetId: PlanetData['id']) => void
  onMotionUpdate?: (payload: PlanetMotionPayload) => void
}

const TWO_PI = Math.PI * 2
const MOON_ORBITAL_PERIOD_DAYS = 27.3
const MOON_ROTATION_PERIOD_HOURS = 655.7
const EARTH_AXIAL_TILT_RAD = (23.44 * Math.PI) / 180

export function Planet({
  planet,
  orbitRadius,
  radius,
  timeScale,
  selected,
  showLabel,
  mode,
  onSelect,
  onMotionUpdate,
}: PlanetProps) {
  const isEarth = planet.id === 'earth'
  const isSaturn = planet.id === 'saturn'

  const orbitGroupRef = useRef<Group>(null)
  const planetAnchorRef = useRef<Group>(null)
  const earthAxisFrameRef = useRef<Group>(null)
  const tideBulgeRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const orbitAngleRef = useRef((planet.orbitRadiusAU * 3.17 + radius) % TWO_PI)
  const moonOrbitGroupRef = useRef<Group>(null)
  const moonAnchorRef = useRef<Group>(null)
  const moonMeshRef = useRef<Mesh>(null)
  const moonOrbitAngleRef = useRef((planet.orbitRadiusAU * 1.91 + radius) % TWO_PI)
  const worldPositionRef = useRef(new Vector3())
  const moonWorldPositionRef = useRef(new Vector3())

  useFrame((_state, delta) => {
    const orbitGroup = orbitGroupRef.current
    const planetAnchor = planetAnchorRef.current
    const mesh = meshRef.current

    if (!orbitGroup || !planetAnchor || !mesh) {
      return
    }

    const orbitSpeed = (timeScale / planet.orbitalPeriodDays) * TWO_PI
    orbitAngleRef.current += delta * orbitSpeed
    orbitGroup.rotation.y = orbitAngleRef.current

    if (isEarth) {
      const earthAxisFrame = earthAxisFrameRef.current

      if (earthAxisFrame) {
        earthAxisFrame.rotation.y = -orbitAngleRef.current
        earthAxisFrame.rotation.z = EARTH_AXIAL_TILT_RAD
      }
    }

    const rotationDirection = planet.rotationPeriodHours < 0 ? -1 : 1
    const rotationHours = Math.max(Math.abs(planet.rotationPeriodHours), 0.01)
    const rotationSpeed = (timeScale * 24 * TWO_PI) / rotationHours
    mesh.rotation.y += delta * rotationSpeed * rotationDirection

    if (isEarth) {
      const moonOrbitGroup = moonOrbitGroupRef.current
      const moonMesh = moonMeshRef.current

      if (moonOrbitGroup && moonMesh) {
        const moonOrbitSpeed = (timeScale / MOON_ORBITAL_PERIOD_DAYS) * TWO_PI
        moonOrbitAngleRef.current += delta * moonOrbitSpeed
        moonOrbitGroup.rotation.y = moonOrbitAngleRef.current

        const moonRotationSpeed = (timeScale * 24 * TWO_PI) / MOON_ROTATION_PERIOD_HOURS
        moonMesh.rotation.y += delta * moonRotationSpeed
      }

      const tideBulge = tideBulgeRef.current
      if (tideBulge) {
        tideBulge.rotation.y = moonOrbitAngleRef.current
      }
    }

    if (onMotionUpdate) {
      planetAnchor.getWorldPosition(worldPositionRef.current)
      const payload: PlanetMotionPayload = {
        planetId: planet.id,
        orbitAngle: orbitAngleRef.current,
        worldPosition: [worldPositionRef.current.x, worldPositionRef.current.y, worldPositionRef.current.z],
      }

      if (isEarth) {
        payload.moonOrbitAngle = moonOrbitAngleRef.current
        if (moonAnchorRef.current) {
          moonAnchorRef.current.getWorldPosition(moonWorldPositionRef.current)
          payload.moonWorldPosition = [
            moonWorldPositionRef.current.x,
            moonWorldPositionRef.current.y,
            moonWorldPositionRef.current.z,
          ]
        }
      }

      onMotionUpdate(payload)
    }
  })

  const handleClick = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelect(planet.id)
  }

  const labelSize =
    mode === 'realistic' ? 0.9 : mode === 'closeup' ? Math.max(radius * 0.52, 0.8) : Math.max(radius * 0.35, 0.5)

  const moonOrbitRadius =
    mode === 'realistic'
      ? Math.max(radius * 60, 0.6)
      : mode === 'closeup'
        ? Math.max(radius * 4.8, 3.6)
        : Math.max(radius * 3.2, 2.2)

  const moonRadius =
    mode === 'realistic'
      ? Math.max(radius * 0.27, 0.02)
      : mode === 'closeup'
        ? Math.max(radius * 0.3, 0.35)
        : Math.max(radius * 0.27, 0.2)

  return (
    <group ref={orbitGroupRef}>
      <group ref={planetAnchorRef} position={[orbitRadius, 0, 0]}>
        {isEarth ? (
          <>
            <group ref={earthAxisFrameRef}>
              <mesh ref={meshRef} onClick={handleClick}>
                <sphereGeometry args={[radius * (selected ? 1.15 : 1), 32, 32]} />
                <meshStandardMaterial
                  color={planet.color}
                  emissive={selected ? '#c9e8ff' : '#000000'}
                  emissiveIntensity={selected ? 0.7 : 0}
                  roughness={0.8}
                  metalness={0.1}
                />
              </mesh>

              {mode === 'closeup' && (
                <>
                  <mesh>
                    <cylinderGeometry args={[Math.max(radius * 0.03, 0.04), Math.max(radius * 0.03, 0.04), radius * 3.4, 20]} />
                    <meshBasicMaterial color="#ffe8a8" transparent opacity={0.88} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[radius * 1.2, Math.max(radius * 0.03, 0.04), 12, 72]} />
                    <meshBasicMaterial color="#8fc2ff" transparent opacity={0.72} />
                  </mesh>
                </>
              )}
            </group>

            {mode === 'closeup' && (
              <group ref={tideBulgeRef}>
                <mesh scale={[1.34, 1.03, 0.82]}>
                  <sphereGeometry args={[radius * 1.1, 32, 32]} />
                  <meshStandardMaterial
                    color="#7ca6ff"
                    transparent
                    opacity={0.2}
                    emissive="#5f8ff2"
                    emissiveIntensity={0.14}
                    roughness={0.38}
                    metalness={0.05}
                  />
                </mesh>
              </group>
            )}
          </>
        ) : (
          <mesh ref={meshRef} onClick={handleClick}>
            <sphereGeometry args={[radius * (selected ? 1.15 : 1), 32, 32]} />
            <meshStandardMaterial
              color={planet.color}
              emissive={selected ? '#c9e8ff' : '#000000'}
              emissiveIntensity={selected ? 0.7 : 0}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        )}

        {isSaturn && (
          <mesh rotation={[Math.PI * 0.48, 0.3, 0]} onClick={handleClick}>
            <ringGeometry args={[radius * 1.45, radius * 2.35, 64]} />
            <meshStandardMaterial
              color="#dcc8a4"
              transparent
              opacity={0.58}
              side={DoubleSide}
              roughness={0.88}
              metalness={0.04}
            />
          </mesh>
        )}

        {isEarth && (
          <group ref={moonOrbitGroupRef}>
            <group ref={moonAnchorRef} position={[moonOrbitRadius, 0, 0]}>
              <mesh ref={moonMeshRef} onClick={handleClick}>
                <sphereGeometry args={[moonRadius, 20, 20]} />
                <meshStandardMaterial color="#d7dde8" roughness={0.9} metalness={0.05} />
              </mesh>
            </group>
          </group>
        )}

        {showLabel && (
          <Text
            position={[0, radius + 0.7, 0]}
            fontSize={labelSize}
            color="#dbe7ff"
            anchorX="center"
            anchorY="bottom"
          >
            {planet.nameKr}
          </Text>
        )}
      </group>
    </group>
  )
}
