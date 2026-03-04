import { Html, Text } from '@react-three/drei'
import { useFrame, useLoader, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  DoubleSide,
  Quaternion,
  ShaderMaterial,
  TextureLoader,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import type { PlanetData } from '../data/planetData'
import type { CloseupSeason, DisplayMode, MoonPhaseTarget } from '../store/solarSystemStore'
import { computeOrbitAnglesForDate, getMoonOrbitAngleForPhase, getOrbitAngleForSeason } from '../utils/earthScience'

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
  showOrbits: boolean
  mode: DisplayMode
  surfaceTemperatureMode: boolean
  seasonJumpTarget: CloseupSeason
  seasonJumpRequestId: number
  moonPhaseJumpTarget: MoonPhaseTarget
  moonPhaseJumpRequestId: number
  dateAnchorISO: string
  dateJumpRequestId: number
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
  uniform vec3 uNorthAxis;
  uniform float uSeasonStrength;
  uniform float uModeIntensity;
  uniform float uSelectionBoost;
  varying vec3 vWorldNormal;

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 northAxis = normalize(uNorthAxis);

    float dayTerm = smoothstep(-0.25, 0.65, dot(n, sunDir));
    float latitudeBand = 1.0 - abs(dot(n, northAxis));
    float seasonalShift = (dot(n, northAxis) * uSeasonStrength + 1.0) * 0.5;
    float tempLevel = dayTerm * 0.42 + latitudeBand * 0.33 + seasonalShift * 0.25;

    float coolBand = smoothstep(0.0, 0.5, tempLevel);
    float warmBand = smoothstep(0.28, 0.78, tempLevel);
    float hotBand = smoothstep(0.68, 1.0, tempLevel);

    vec3 coldColor = vec3(0.06, 0.20, 0.60);
    vec3 mildColor = vec3(0.10, 0.68, 0.88);
    vec3 warmColor = vec3(0.95, 0.81, 0.30);
    vec3 hotColor = vec3(0.92, 0.29, 0.14);

    vec3 tone = mix(coldColor, mildColor, coolBand);
    tone = mix(tone, warmColor, warmBand);
    tone = mix(tone, hotColor, hotBand);

    float baseAlpha = 0.18 + warmBand * 0.18 + hotBand * 0.16;
    float alpha = baseAlpha * (0.25 + uModeIntensity * 0.75);
    alpha *= (0.92 + uSelectionBoost * 0.18);

    gl_FragColor = vec4(tone, alpha);
  }
`
const MOON_PHASE_VERTEX_SHADER = `
  varying vec3 vWorldNormal;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const MOON_PHASE_FRAGMENT_SHADER = `
  uniform vec3 uSunDirection;
  uniform float uShadowStrength;
  varying vec3 vWorldNormal;

  void main() {
    float lit = dot(normalize(vWorldNormal), normalize(uSunDirection));
    float dayMask = smoothstep(-0.05, 0.18, lit);
    float darkness = (1.0 - dayMask) * uShadowStrength;
    vec3 shadowColor = vec3(0.01, 0.02, 0.05);

    gl_FragColor = vec4(shadowColor, darkness);
  }
`
const MOON_BRIGHT_VERTEX_SHADER = `
  varying vec3 vWorldNormal;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const MOON_BRIGHT_FRAGMENT_SHADER = `
  uniform vec3 uSunDirection;
  uniform float uBrightStrength;
  varying vec3 vWorldNormal;

  void main() {
    float lit = max(dot(normalize(vWorldNormal), normalize(uSunDirection)), 0.0);
    float brightCore = smoothstep(0.2, 1.0, lit);
    float edgeGlow = smoothstep(0.0, 0.35, lit) * (1.0 - smoothstep(0.35, 0.9, lit));
    float alpha = brightCore * uBrightStrength + edgeGlow * uBrightStrength * 0.42;
    vec3 glowColor = vec3(1.0, 0.98, 0.92);

    gl_FragColor = vec4(glowColor, alpha);
  }
`

export function Planet({
  planet,
  orbitRadius,
  radius,
  timeScale,
  selected,
  showLabel,
  showOrbits,
  mode,
  surfaceTemperatureMode,
  seasonJumpTarget,
  seasonJumpRequestId,
  moonPhaseJumpTarget,
  moonPhaseJumpRequestId,
  dateAnchorISO,
  dateJumpRequestId,
  onSelect,
  onMotionUpdate,
}: PlanetProps) {
  const isEarth = planet.id === 'earth'
  const isSaturn = planet.id === 'saturn'
  const earthTexturePaths = useMemo(() => {
    const prefix = `${import.meta.env.BASE_URL}textures/`
    return [
      `${prefix}earth_daymap_2048.jpg`,
      `${prefix}earth_normal_2048.jpg`,
      `${prefix}earth_specular_2048.jpg`,
      `${prefix}earth_clouds_1024.png`,
      `${prefix}moon_daymap_1024.jpg`,
    ]
  }, [])
  const [earthDayMap, earthNormalMap, earthSpecularMap, earthCloudMap, moonDayMap] = useLoader(
    TextureLoader,
    earthTexturePaths,
  )

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
  const moonPhaseOverlayMaterialRef = useRef<ShaderMaterial>(null)
  const moonBrightOverlayMaterialRef = useRef<ShaderMaterial>(null)
  const moonOrbitAngleRef = useRef((planet.orbitRadiusAU * 1.91 + radius) % TWO_PI)
  const worldPositionRef = useRef(new Vector3())
  const moonWorldPositionRef = useRef(new Vector3())
  const sunDirectionRef = useRef(new Vector3(1, 0, 0))
  const moonSunDirectionRef = useRef(new Vector3(1, 0, 0))
  const earthNorthAxisRef = useRef(new Vector3(0, 1, 0))
  const earthWorldQuaternionRef = useRef(new Quaternion())
  const heatOverlayUniforms = useMemo(
    () => ({
      uSunDirection: { value: new Vector3(1, 0, 0) },
      uNorthAxis: { value: new Vector3(0, 1, 0) },
      uSeasonStrength: { value: 1 },
      uModeIntensity: { value: 1 },
      uSelectionBoost: { value: 0 },
    }),
    [],
  )
  const moonPhaseUniforms = useMemo(
    () => ({
      uSunDirection: { value: new Vector3(1, 0, 0) },
      uShadowStrength: { value: 0.82 },
    }),
    [],
  )
  const moonBrightUniforms = useMemo(
    () => ({
      uSunDirection: { value: new Vector3(1, 0, 0) },
      uBrightStrength: { value: 0.34 },
    }),
    [],
  )
  const realisticLocatorPoint = useMemo(() => new Float32Array([0, 0, 0]), [])

  useEffect(() => {
    if (!isEarth) {
      return
    }

    const targetOrbitAngle = getOrbitAngleForSeason(seasonJumpTarget)
    orbitAngleRef.current = targetOrbitAngle

    const orbitGroup = orbitGroupRef.current
    if (orbitGroup) {
      orbitGroup.rotation.y = targetOrbitAngle
    }

    const earthAxisFrame = earthAxisFrameRef.current
    if (earthAxisFrame) {
      earthAxisFrame.rotation.y = -targetOrbitAngle
      earthAxisFrame.rotation.z = EARTH_AXIAL_TILT_RAD
    }
  }, [isEarth, seasonJumpRequestId, seasonJumpTarget])

  useEffect(() => {
    if (!isEarth) {
      return
    }

    const targetMoonOrbitAngle = getMoonOrbitAngleForPhase(moonPhaseJumpTarget)
    moonOrbitAngleRef.current = targetMoonOrbitAngle

    const moonOrbitGroup = moonOrbitGroupRef.current
    if (moonOrbitGroup) {
      moonOrbitGroup.rotation.y = targetMoonOrbitAngle
    }
  }, [isEarth, moonPhaseJumpRequestId, moonPhaseJumpTarget])

  useEffect(() => {
    if (!isEarth) {
      return
    }

    const targetDate = new Date(`${dateAnchorISO}T12:00:00`)
    if (Number.isNaN(targetDate.getTime())) {
      return
    }

    const { earthOrbitAngle, moonOrbitAngle } = computeOrbitAnglesForDate(targetDate)
    orbitAngleRef.current = earthOrbitAngle
    moonOrbitAngleRef.current = moonOrbitAngle

    const orbitGroup = orbitGroupRef.current
    if (orbitGroup) {
      orbitGroup.rotation.y = earthOrbitAngle
    }

    const moonOrbitGroup = moonOrbitGroupRef.current
    if (moonOrbitGroup) {
      moonOrbitGroup.rotation.y = moonOrbitAngle
    }

    const earthAxisFrame = earthAxisFrameRef.current
    if (earthAxisFrame) {
      earthAxisFrame.rotation.y = -earthOrbitAngle
      earthAxisFrame.rotation.z = EARTH_AXIAL_TILT_RAD
    }
  }, [dateAnchorISO, dateJumpRequestId, isEarth])

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

      const earthAxisFrame = earthAxisFrameRef.current
      if (earthAxisFrame) {
        earthAxisFrame.getWorldQuaternion(earthWorldQuaternionRef.current)
        earthNorthAxisRef.current
          .set(0, 1, 0)
          .applyQuaternion(earthWorldQuaternionRef.current)
          .normalize()
      }

      const heatOverlayMaterial = heatOverlayMaterialRef.current
      if (heatOverlayMaterial) {
        ;(heatOverlayMaterial.uniforms.uSunDirection.value as Vector3).copy(sunDirection)
        ;(heatOverlayMaterial.uniforms.uNorthAxis.value as Vector3).copy(earthNorthAxisRef.current)
        heatOverlayMaterial.uniforms.uSeasonStrength.value = Math.cos(-orbitAngleRef.current)
        heatOverlayMaterial.uniforms.uModeIntensity.value = surfaceTemperatureMode ? 1 : 0
        heatOverlayMaterial.uniforms.uSelectionBoost.value = selected ? 1 : 0
      }

      const cloudLayer = cloudLayerRef.current
      if (cloudLayer) {
        cloudLayer.rotation.y += delta * rotationSpeed * 1.05
      }

      const moonAnchor = moonAnchorRef.current
      if (moonAnchor) {
        moonAnchor.getWorldPosition(moonWorldPositionRef.current)
        const moonSunDirection = moonSunDirectionRef.current.copy(moonWorldPositionRef.current).multiplyScalar(-1)
        if (moonSunDirection.lengthSq() < 1e-6) {
          moonSunDirection.set(1, 0, 0)
        } else {
          moonSunDirection.normalize()
        }

        const moonPhaseOverlayMaterial = moonPhaseOverlayMaterialRef.current
        if (moonPhaseOverlayMaterial) {
          ;(moonPhaseOverlayMaterial.uniforms.uSunDirection.value as Vector3).copy(moonSunDirection)
          moonPhaseOverlayMaterial.uniforms.uShadowStrength.value = mode === 'mooncloseup' ? 0.92 : 0.82
        }

        const moonBrightOverlayMaterial = moonBrightOverlayMaterialRef.current
        if (moonBrightOverlayMaterial) {
          ;(moonBrightOverlayMaterial.uniforms.uSunDirection.value as Vector3).copy(moonSunDirection)
          moonBrightOverlayMaterial.uniforms.uBrightStrength.value = mode === 'mooncloseup' ? 0.54 : 0.36
        }
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
    mode === 'realistic'
      ? 0.9
      : mode === 'closeup' || mode === 'mooncloseup'
        ? Math.max(radius * 0.52, 0.8)
        : Math.max(radius * 0.35, 0.5)

  const moonOrbitRadius =
    mode === 'realistic'
      ? Math.max(radius * 60, 0.6)
      : mode === 'mooncloseup'
        ? Math.max(radius * 6.8, 5.4)
        : mode === 'closeup'
        ? Math.max(radius * 4.8, 3.6)
        : Math.max(radius * 3.2, 2.2)

  const moonRadius =
    mode === 'realistic'
      ? Math.max(radius * 0.27, 0.02)
      : mode === 'mooncloseup'
        ? Math.max(radius * 0.38, 0.5)
        : mode === 'closeup'
        ? Math.max(radius * 0.3, 0.35)
        : Math.max(radius * 0.27, 0.2)
  const realisticLocatorHeight = Math.max(radius * 2.2, 0.42)
  const realisticLabelHeight = realisticLocatorHeight + 0.44

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

              {mode === 'closeup' && surfaceTemperatureMode && (
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

            {mode === 'closeup' && !surfaceTemperatureMode && (
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
          <>
            {showOrbits && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[moonOrbitRadius * 0.992, moonOrbitRadius * 1.008, 120]} />
                <meshBasicMaterial color="#96baff" transparent opacity={mode === 'mooncloseup' ? 0.72 : 0.52} side={DoubleSide} />
              </mesh>
            )}

            <group ref={moonOrbitGroupRef}>
              <group ref={moonAnchorRef} position={[moonOrbitRadius, 0, 0]}>
                <mesh ref={moonMeshRef} onClick={handleClick}>
                  <sphereGeometry args={[moonRadius, mode === 'mooncloseup' ? 56 : 30, mode === 'mooncloseup' ? 56 : 30]} />
                  <meshPhongMaterial
                    map={moonDayMap}
                    bumpMap={moonDayMap}
                    bumpScale={mode === 'mooncloseup' ? 0.085 : 0.05}
                    shininess={5}
                    specular="#4a5263"
                    emissive="#090d17"
                    emissiveIntensity={0.08}
                  />
                </mesh>

                <mesh scale={[1.004, 1.004, 1.004]}>
                  <sphereGeometry args={[moonRadius, mode === 'mooncloseup' ? 56 : 30, mode === 'mooncloseup' ? 56 : 30]} />
                  <shaderMaterial
                    ref={moonBrightOverlayMaterialRef}
                    uniforms={moonBrightUniforms}
                    vertexShader={MOON_BRIGHT_VERTEX_SHADER}
                    fragmentShader={MOON_BRIGHT_FRAGMENT_SHADER}
                    transparent
                    depthWrite={false}
                    blending={AdditiveBlending}
                  />
                </mesh>

                <mesh scale={[1.008, 1.008, 1.008]}>
                  <sphereGeometry args={[moonRadius, mode === 'mooncloseup' ? 56 : 30, mode === 'mooncloseup' ? 56 : 30]} />
                  <shaderMaterial
                    ref={moonPhaseOverlayMaterialRef}
                    uniforms={moonPhaseUniforms}
                    vertexShader={MOON_PHASE_VERTEX_SHADER}
                    fragmentShader={MOON_PHASE_FRAGMENT_SHADER}
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              </group>
            </group>
          </>
        )}

        {showLabel && (
          mode === 'realistic' ? (
            <Html position={[0, realisticLabelHeight, 0]} center style={{ pointerEvents: 'none' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  color: '#e7f1ff',
                  border: selected ? '1px solid rgba(255, 241, 165, 0.95)' : '1px solid rgba(152, 198, 255, 0.8)',
                  background: selected ? 'rgba(41, 58, 92, 0.9)' : 'rgba(10, 20, 38, 0.82)',
                  boxShadow: selected
                    ? '0 0 14px rgba(255, 230, 143, 0.45)'
                    : '0 0 10px rgba(120, 175, 255, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                {planet.nameKr}
              </span>
            </Html>
          ) : (
            <Text
              position={[0, radius + 0.7, 0]}
              fontSize={labelSize}
              color="#dbe7ff"
              anchorX="center"
              anchorY="bottom"
            >
              {planet.nameKr}
            </Text>
          )
        )}

        {mode === 'realistic' && (
          <group position={[0, realisticLocatorHeight, 0]}>
            <points renderOrder={30}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[realisticLocatorPoint, 3]} />
              </bufferGeometry>
              <pointsMaterial
                color={planet.color}
                size={selected ? 11 : 9}
                sizeAttenuation={false}
                transparent
                opacity={0.95}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </points>
            <points renderOrder={31}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[realisticLocatorPoint, 3]} />
              </bufferGeometry>
              <pointsMaterial
                color="#ffffff"
                size={selected ? 5.4 : 4.2}
                sizeAttenuation={false}
                transparent
                opacity={0.95}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </points>
          </group>
        )}
      </group>
    </group>
  )
}
