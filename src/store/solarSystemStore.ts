import { create } from 'zustand'
import type { PlanetId } from '../data/planetData'

export type DisplayMode = 'presentation' | 'realistic' | 'closeup'

export interface CloseupInsights {
  seasonName: '봄' | '여름' | '가을' | '겨울'
  seasonDetail: string
  moonPhaseName: string
  moonLightRatio: number
  tideName: string
  tideDetail: string
}

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
  closeup: {
    timeScale: 12,
    distanceScale: 1,
    sizeExaggeration: 1.8,
  },
}

const defaultCloseupInsights: CloseupInsights = {
  seasonName: '여름',
  seasonDetail: '북반구 기준으로 태양 고도가 높아지는 구간입니다.',
  moonPhaseName: '상현에 가까움',
  moonLightRatio: 0.5,
  tideName: '중간 조차',
  tideDetail: '달-태양 배치가 완전히 일직선은 아니라 조차가 중간 수준입니다.',
}

interface SolarSystemState {
  mode: DisplayMode
  timeScale: number
  distanceScale: number
  sizeExaggeration: number
  showOrbits: boolean
  showLabels: boolean
  selectedPlanetId: PlanetId | null
  closeupInsights: CloseupInsights
  frameRequest: number
  setMode: (mode: DisplayMode) => void
  setTimeScale: (value: number) => void
  setDistanceScale: (value: number) => void
  setSizeExaggeration: (value: number) => void
  setCloseupInsights: (insights: CloseupInsights) => void
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
  closeupInsights: defaultCloseupInsights,
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
  setCloseupInsights: (closeupInsights) => set({ closeupInsights }),
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
      closeupInsights: defaultCloseupInsights,
      frameRequest: state.frameRequest + 1,
    })),
}))
