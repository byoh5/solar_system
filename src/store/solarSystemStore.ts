import { create } from 'zustand'
import type { PlanetId } from '../data/planetData'

export type DisplayMode = 'presentation' | 'realistic'

type ModePreset = {
  timeScale: number
  distanceScale: number
  sizeExaggeration: number
}

const modePresets: Record<DisplayMode, ModePreset> = {
  presentation: {
    timeScale: 25,
    distanceScale: 1,
    sizeExaggeration: 1.25,
  },
  realistic: {
    timeScale: 25,
    distanceScale: 1,
    sizeExaggeration: 1,
  },
}

interface SolarSystemState {
  mode: DisplayMode
  timeScale: number
  distanceScale: number
  sizeExaggeration: number
  showOrbits: boolean
  showLabels: boolean
  selectedPlanetId: PlanetId | null
  frameRequest: number
  setMode: (mode: DisplayMode) => void
  setTimeScale: (value: number) => void
  setDistanceScale: (value: number) => void
  setSizeExaggeration: (value: number) => void
  toggleOrbits: () => void
  toggleLabels: () => void
  selectPlanet: (planetId: PlanetId | null) => void
  requestFrameSystem: () => void
  resetSettings: () => void
}

const defaultMode: DisplayMode = 'presentation'
const defaultPreset = modePresets[defaultMode]

export const useSolarSystemStore = create<SolarSystemState>((set) => ({
  mode: defaultMode,
  ...defaultPreset,
  showOrbits: true,
  showLabels: true,
  selectedPlanetId: null,
  frameRequest: 0,
  setMode: (mode) => {
    const preset = modePresets[mode]
    set((state) => ({
      mode,
      timeScale: preset.timeScale,
      distanceScale: preset.distanceScale,
      sizeExaggeration: preset.sizeExaggeration,
      frameRequest: state.frameRequest + 1,
    }))
  },
  setTimeScale: (value) => set({ timeScale: value }),
  setDistanceScale: (value) => set({ distanceScale: value }),
  setSizeExaggeration: (value) => set({ sizeExaggeration: value }),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  selectPlanet: (planetId) => set({ selectedPlanetId: planetId }),
  requestFrameSystem: () => set((state) => ({ frameRequest: state.frameRequest + 1 })),
  resetSettings: () =>
    set((state) => ({
      mode: defaultMode,
      ...defaultPreset,
      showOrbits: true,
      showLabels: true,
      selectedPlanetId: null,
      frameRequest: state.frameRequest + 1,
    })),
}))
