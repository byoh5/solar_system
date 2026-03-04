import type { CloseupInsights } from '../store/solarSystemStore'

const TWO_PI = Math.PI * 2
const QUARTER_TURN = Math.PI / 2
const EIGHTH_TURN = Math.PI / 4

function normalizeAngle(angle: number): number {
  const wrapped = angle % TWO_PI
  return wrapped >= 0 ? wrapped : wrapped + TWO_PI
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return Math.min(diff, TWO_PI - diff)
}

function resolveSeason(seasonPhase: number): Pick<CloseupInsights, 'seasonName' | 'seasonDetail'> {
  const seasonIndex = Math.floor(normalizeAngle(seasonPhase + EIGHTH_TURN) / QUARTER_TURN) % 4

  if (angularDistance(seasonPhase, 0) < 0.28) {
    return {
      seasonName: '여름',
      seasonDetail: '북반구 기준 하지 무렵이라 낮이 가장 길어집니다.',
    }
  }

  if (angularDistance(seasonPhase, Math.PI) < 0.28) {
    return {
      seasonName: '겨울',
      seasonDetail: '북반구 기준 동지 무렵이라 태양 고도가 가장 낮습니다.',
    }
  }

  if (angularDistance(seasonPhase, QUARTER_TURN) < 0.28) {
    return {
      seasonName: '가을',
      seasonDetail: '북반구 기준 추분 무렵이라 낮과 밤 길이가 비슷합니다.',
    }
  }

  if (angularDistance(seasonPhase, QUARTER_TURN * 3) < 0.28) {
    return {
      seasonName: '봄',
      seasonDetail: '북반구 기준 춘분 무렵이라 낮과 밤 길이가 비슷합니다.',
    }
  }

  switch (seasonIndex) {
    case 0:
      return {
        seasonName: '여름',
        seasonDetail: '북반구 자전축이 태양 쪽으로 기울어 더 많은 복사에너지를 받습니다.',
      }
    case 1:
      return {
        seasonName: '가을',
        seasonDetail: '북반구 태양 고도가 낮아지며 일조 시간이 점차 짧아집니다.',
      }
    case 2:
      return {
        seasonName: '겨울',
        seasonDetail: '북반구 자전축이 태양 반대쪽으로 기울어 복사에너지가 줄어듭니다.',
      }
    default:
      return {
        seasonName: '봄',
        seasonDetail: '북반구 태양 고도가 올라가며 일조 시간이 다시 길어집니다.',
      }
  }
}

function resolveMoonPhase(phaseCycle: number): Pick<CloseupInsights, 'moonPhaseName' | 'moonLightRatio'> {
  const phaseIndex = Math.floor(normalizeAngle(phaseCycle + EIGHTH_TURN / 2) / EIGHTH_TURN) % 8
  const moonLightRatio = Math.min(1, Math.max(0, (1 - Math.cos(phaseCycle)) / 2))

  switch (phaseIndex) {
    case 0:
      return { moonPhaseName: '삭(신월)', moonLightRatio }
    case 1:
      return { moonPhaseName: '초승달', moonLightRatio }
    case 2:
      return { moonPhaseName: '상현달', moonLightRatio }
    case 3:
      return { moonPhaseName: '상현 이후(볼록달)', moonLightRatio }
    case 4:
      return { moonPhaseName: '망(보름달)', moonLightRatio }
    case 5:
      return { moonPhaseName: '하현 이전(볼록달)', moonLightRatio }
    case 6:
      return { moonPhaseName: '하현달', moonLightRatio }
    default:
      return { moonPhaseName: '그믐달', moonLightRatio }
  }
}

function resolveTides(phaseCycle: number): Pick<CloseupInsights, 'tideName' | 'tideDetail'> {
  const alignment = Math.abs(Math.cos(phaseCycle))

  if (alignment >= 0.84) {
    return {
      tideName: '대조기',
      tideDetail: '태양-지구-달이 거의 일직선이라 밀물과 썰물의 높이 차가 커집니다.',
    }
  }

  if (alignment <= 0.32) {
    return {
      tideName: '소조기',
      tideDetail: '태양과 달 인력이 직각에 가까워 밀물과 썰물의 높이 차가 작아집니다.',
    }
  }

  return {
    tideName: '중간 조차',
    tideDetail: '대조기와 소조기 사이 구간이라 조차가 중간 수준입니다.',
  }
}

export function computeCloseupInsights(earthOrbitAngle: number, moonOrbitAngle: number): CloseupInsights {
  const seasonPhase = normalizeAngle(-earthOrbitAngle)
  const phaseCycle = normalizeAngle(moonOrbitAngle - Math.PI)

  return {
    ...resolveSeason(seasonPhase),
    ...resolveMoonPhase(phaseCycle),
    ...resolveTides(phaseCycle),
  }
}

