import type { DisplayMode } from '../store/solarSystemStore'

const EARTH_RADIUS_KM = 6371
const REALISTIC_AU_TO_UNITS = 230

export function computeOrbitRadius(
  orbitRadiusAU: number,
  mode: DisplayMode,
  distanceScale: number,
): number {
  if (mode === 'presentation') {
    const compressed = Math.pow(orbitRadiusAU, 0.58) * 24 + 10
    return compressed * distanceScale
  }

  return orbitRadiusAU * REALISTIC_AU_TO_UNITS * distanceScale
}

export function computePlanetRadius(radiusKm: number, mode: DisplayMode, sizeExaggeration: number): number {
  const earthRatio = radiusKm / EARTH_RADIUS_KM

  if (mode === 'presentation') {
    return Math.pow(earthRatio, 0.45) * 0.9 * sizeExaggeration
  }

  return earthRatio * 0.04 * sizeExaggeration
}

export function computeSunRadius(mode: DisplayMode, sizeExaggeration: number): number {
  if (mode === 'presentation') {
    return 4.8 * sizeExaggeration
  }

  return 4.36 * sizeExaggeration
}
