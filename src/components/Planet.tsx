import { Text } from '@react-three/drei'
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
  TextureLoader,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
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
const EARTH_HEAT_VERTEX_SHADER = `
  varying vec3 vWorldNormal;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const EARTH_HEAT_FRAGMENT_SHADER = `
  uniform vec3 uSunDirection;
  uniform float uSelectionBoost;
  varying vec3 vWorldNormal;

  void main() {
    float solar = max(dot(normalize(vWorldNormal), normalize(uSunDirection)), 0.0);
    float warmBand = smoothstep(0.22, 0.9, solar);
    float hotCore = smoothstep(0.62, 1.0, solar);

    vec3 coldColor = vec3(0.07, 0.24, 0.70);
    vec3 warmColor = vec3(0.16, 0.82, 0.80);
    vec3 hotColor = vec3(1.0, 0.44, 0.14);

    vec3 tone = mix(coldColor, warmColor, warmBand);
    tone = mix(tone, hotColor, hotCore);

    float alpha = 0.08 + warmBand * 0.26 + hotCore * 0.2;
    alpha *= (0.92 + uSelectionBoost * 0.18);

    gl_FragColor = vec4(tone, alpha);
  }
`

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
  const [earthDayMap, earthNormalMap, earthSpecularMap, earthCloudMap] = useLoader(TextureLoader, [
    '/textures/earth_daymap_2048.jpg',
    '/textures/earth_normal_2048.jpg',
    '/textures/earth_specular_2048.jpg',
    '/textures/earth_clouds_1024.png',
  ])

  const orbitGroupRef = useRef<Group>(null)
  const planetAnchorRef = useRef<Group>(null)
  const earthAxisFrameRef = useRef<Group>(null)
  const tideBulgeRef = useRef<Group>(null)
  const cloudLayerRef = useRef<Mesh>(null)
  const heatOverlayMaterialRef = useRef<ShaderMaterial>(null)
  const meshRef = useRef<Mesh>(null)
  const orbitAngleRef = useRef((planet.orbitRadiusAU * 3.17 + radius) % TWO_PI)
  const moonOrbitGroupRef = useRef<Group>(null)
  const moonAnchorRef = useRef<Group>(null)
  const moonMeshRef = useRef<Mesh>(null)
  const moonOrbitAngleRef = useRef((planet.orbitRadiusAU * 1.91 + radius) % TWO_PI)
  const worldPositionRef = useRef(new Vector3())
  const moonWorldPositionRef = useRef(new Vector3())
  const sunDirectionRef = useRef(new Vector3(1, 0, 0))
  const heatOverlayUniforms = useMemo(
    () => ({
      uSunDirection: { value: new Vector3(1, 0, 0) },
      uSelectionBoost: { value: 0 },
    }),
    [],
  )

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

    const shouldTrackWorldPosition = isEarth || Boolean(onMotionUpdate)
    if (shouldTrackWorldPosition) {
      planetAnchor.getWorldPosition(worldPositionRef.current)
    }

    if (isEarth) {
      const sunDirection = sunDirectionRef.current.copy(worldPositionRef.current).multiplyScalar(-1)
      if (sunDirection.lengthSq() < 1e-6) {
        sunDirection.set(1, 0, 0)
      } else {
        sunDirection.normalize()
      }

      const heatOverlayMaterial = heatOverlayMaterialRef.current
      if (heatOverlayMaterial) {
        ;(heatOverlayMaterial.uniforms.uSunDirection.value as Vector3).copy(sunDirection)
        heatOverlayMaterial.uniforms.uSelectionBoost.value = selected ? 1 : 0
      }

      const cloudLayer = cloudLayerRef.current
      if (cloudLayer) {
        cloudLayer.rotation.y += delta * rotationSpeed * 1.05
      }
    }

    if (onMotionUpdate) {
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
                <meshPhongMaterial
                  map={earthDayMap}
                  normalMap={earthNormalMap}
                  specularMap={earthSpecularMap}
                  specular="#576b84"
                  shininess={16}
                  emissive={selected ? '#163d61' : '#061324'}
                  emissiveIntensity={selected ? 0.44 : 0.2}
                />
              </mesh>

              <mesh ref={cloudLayerRef}>
                <sphereGeometry args={[radius * 1.02, 32, 32]} />
                <meshPhongMaterial
                  map={earthCloudMap}
                  transparent
                  opacity={0.38}
                  depthWrite={false}
                  blending={AdditiveBlending}
                />
              </mesh>

              {mode === 'closeup' && (
                <mesh scale={[1.018, 1.018, 1.018]}>
                  <sphereGeometry args={[radius * (selected ? 1.15 : 1), 48, 48]} />
                  <shaderMaterial
                    ref={heatOverlayMaterialRef}
                    uniforms={heatOverlayUniforms}
                    vertexShader={EARTH_HEAT_VERTEX_SHADER}
                    fragmentShader={EARTH_HEAT_FRAGMENT_SHADER}
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              )}

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
