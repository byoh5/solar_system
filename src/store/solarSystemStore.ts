import { create } from 'zustand'
import type { PlanetId } from '../data/planetData'

export type DisplayMode = 'presentation' | 'realistic' | 'closeup' | 'mooncloseup'
export type CloseupSeason = '봄' | '여름' | '가을' | '겨울'
export type MoonPhaseTarget = '삭' | '상현' | '보름' | '하현'

export interface CloseupInsights {
  seasonName: CloseupSeason
  seasonDetail: string
  moonPhaseName: string
  moonLightRatio: number
  tideName: string
  tideDetail: string
  earthOrbitAngle: number
  moonOrbitAngle: number
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
    timeScale: 0.25,
    distanceScale: 1,
    sizeExaggeration: 1.8,
  },
  mooncloseup: {
    timeScale: 0.2,
    distanceScale: 1,
    sizeExaggeration: 2.1,
  },
}

const defaultCloseupInsights: CloseupInsights = {
  seasonName: '여름',
  seasonDetail: '북반구 기준으로 태양 고도가 높아지는 구간입니다.',
  moonPhaseName: '상현에 가까움',
  moonLightRatio: 0.5,
  tideName: '중간 조차',
  tideDetail: '달-태양 배치가 완전히 일직선은 아니라 조차가 중간 수준입니다.',
  earthOrbitAngle: 0,
  moonOrbitAngle: Math.PI * 1.5,
}

interface SolarSystemState {
  mode: DisplayMode
  timeScale: number
  distanceScale: number
  sizeExaggeration: number
  showOrbits: boolean
  showLabels: boolean
  paused: boolean
  surfaceTemperatureMode: boolean
  selectedPlanetId: PlanetId | null
  closeupInsights: CloseupInsights
  seasonJumpTarget: CloseupSeason
  seasonJumpRequestId: number
  moonPhaseJumpTarget: MoonPhaseTarget
  moonPhaseJumpRequestId: number
  frameRequest: number
  setMode: (mode: DisplayMode) => void
  setTimeScale: (value: number) => void
  setDistanceScale: (value: number) => void
  setSizeExaggeration: (value: number) => void
  setCloseupInsights: (insights: CloseupInsights) => void
  togglePause: () => void
  toggleSurfaceTemperatureMode: () => void
  jumpToSeason: (season: CloseupSeason) => void
  jumpToMoonPhase: (phase: MoonPhaseTarget) => void
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
  paused: false,
  surfaceTemperatureMode: true,
  selectedPlanetId: null,
  closeupInsights: defaultCloseupInsights,
  seasonJumpTarget: '여름',
  seasonJumpRequestId: 0,
  moonPhaseJumpTarget: '보름',
  moonPhaseJumpRequestId: 0,
  frameRequest: 0,
  setMode: (mode) => {
    const preset = modePresets[mode]
    set((state) => ({
      mode,
      timeScale: preset.timeScale,
      distanceScale: preset.distanceScale,
      sizeExaggeration: preset.sizeExaggeration,
      paused: false,
      frameRequest: state.frameRequest + 1,
    }))
  },
  setTimeScale: (value) => set({ timeScale: value }),
  setDistanceScale: (value) => set({ distanceScale: value }),
  setSizeExaggeration: (value) => set({ sizeExaggeration: value }),
  setCloseupInsights: (closeupInsights) => set({ closeupInsights }),
  togglePause: () => set((state) => ({ paused: !state.paused })),
  toggleSurfaceTemperatureMode: () =>
    set((state) => ({
      surfaceTemperatureMode: !state.surfaceTemperatureMode,
    })),
  jumpToSeason: (seasonJumpTarget) =>
    set((state) => ({
      mode: 'closeup',
      seasonJumpTarget,
      seasonJumpRequestId: state.seasonJumpRequestId + 1,
      frameRequest: state.frameRequest + 1,
    })),
  jumpToMoonPhase: (moonPhaseJumpTarget) =>
    set((state) => ({
      mode: 'mooncloseup',
      moonPhaseJumpTarget,
      moonPhaseJumpRequestId: state.moonPhaseJumpRequestId + 1,
      frameRequest: state.frameRequest + 1,
    })),
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
      paused: false,
      surfaceTemperatureMode: true,
      selectedPlanetId: null,
      closeupInsights: defaultCloseupInsights,
      seasonJumpTarget: '여름',
      seasonJumpRequestId: state.seasonJumpRequestId,
      moonPhaseJumpTarget: '보름',
      moonPhaseJumpRequestId: state.moonPhaseJumpRequestId,
      frameRequest: state.frameRequest + 1,
    })),
}))
