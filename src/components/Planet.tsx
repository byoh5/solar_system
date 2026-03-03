import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, type Group, type Mesh } from 'three'
import type { PlanetData } from '../data/planetData'

type PlanetProps = {
  planet: PlanetData
  orbitRadius: number
  radius: number
  timeScale: number
  selected: boolean
  showLabel: boolean
  mode: 'presentation' | 'realistic'
  onSelect: (planetId: PlanetData['id']) => void
}

const TWO_PI = Math.PI * 2
const MOON_ORBITAL_PERIOD_DAYS = 27.3
const MOON_ROTATION_PERIOD_HOURS = 655.7

export function Planet({
  planet,
  orbitRadius,
  radius,
  timeScale,
  selected,
  showLabel,
  mode,
  onSelect,
}: PlanetProps) {
  const isEarth = planet.id === 'earth'
  const isSaturn = planet.id === 'saturn'

  const orbitGroupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const orbitAngleRef = useRef((planet.orbitRadiusAU * 3.17 + radius) % TWO_PI)
  const moonOrbitGroupRef = useRef<Group>(null)
  const moonMeshRef = useRef<Mesh>(null)
  const moonOrbitAngleRef = useRef((planet.orbitRadiusAU * 1.91 + radius) % TWO_PI)

  useFrame((_state, delta) => {
    const orbitGroup = orbitGroupRef.current
    const mesh = meshRef.current

    if (!orbitGroup || !mesh) {
      return
    }

    const orbitSpeed = (timeScale / planet.orbitalPeriodDays) * TWO_PI
    orbitAngleRef.current += delta * orbitSpeed
    orbitGroup.rotation.y = orbitAngleRef.current

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
    }
  })

  const handleClick = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelect(planet.id)
  }

  const labelSize = mode === 'presentation' ? Math.max(radius * 0.35, 0.5) : 0.9
  const moonOrbitRadius = mode === 'presentation' ? Math.max(radius * 3.2, 2.2) : Math.max(radius * 60, 0.6)
  const moonRadius = mode === 'presentation' ? Math.max(radius * 0.27, 0.2) : Math.max(radius * 0.27, 0.02)

  return (
    <group ref={orbitGroupRef}>
      <group position={[orbitRadius, 0, 0]}>
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
            <group position={[moonOrbitRadius, 0, 0]}>
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
