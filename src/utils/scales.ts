import type { DisplayMode } from '../store/solarSystemStore'

const EARTH_RADIUS_KM = 6371
const REALISTIC_AU_TO_UNITS = 230

export function computeOrbitRadius(
  orbitRadiusAU: number,
  mode: DisplayMode,
  distanceScale: number,
): number {
  if (mode === 'presentation' || mode === 'closeup') {
    const compressed = Math.pow(orbitRadiusAU, 0.58) * 24 + 10
    const closeupTuning = mode === 'closeup' ? 0.92 : 1
    return compressed * distanceScale * closeupTuning
  }

  return orbitRadiusAU * REALISTIC_AU_TO_UNITS * distanceScale
}

export function computePlanetRadius(radiusKm: number, mode: DisplayMode, sizeExaggeration: number): number {
  const earthRatio = radiusKm / EARTH_RADIUS_KM

  if (mode === 'presentation' || mode === 'closeup') {
    const base = mode === 'closeup' ? 1.18 : 0.9
    const exponent = mode === 'closeup' ? 0.47 : 0.45
    return Math.pow(earthRatio, exponent) * base * sizeExaggeration
  }

  return earthRatio * 0.04 * sizeExaggeration
}

export function computeSunRadius(mode: DisplayMode, sizeExaggeration: number): number {
  if (mode === 'presentation') {
    return 4.8 * sizeExaggeration
  }

  if (mode === 'closeup') {
    return 4.2 * sizeExaggeration
  }

  return 4.36 * sizeExaggeration
}
