export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export interface PlanetData {
  id: PlanetId
  nameKr: string
  nameEn: string
  radiusKm: number
  orbitRadiusAU: number
  orbitalPeriodDays: number
  rotationPeriodHours: number
  color: string
  moonsCount: number
  desc: string
}

export const planetData: PlanetData[] = [
  {
    id: 'mercury',
    nameKr: '수성',
    nameEn: 'Mercury',
    radiusKm: 2439,
    orbitRadiusAU: 0.39,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1407.6,
    color: '#b6a89b',
    moonsCount: 0,
    desc: '태양에 가장 가까운 암석 행성으로 공전이 매우 빠릅니다.',
  },
  {
    id: 'venus',
    nameKr: '금성',
    nameEn: 'Venus',
    radiusKm: 6052,
    orbitRadiusAU: 0.72,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5832.5,
    color: '#d8bd8d',
    moonsCount: 0,
    desc: '짙은 대기로 덮여 있으며 자전 방향이 대부분 행성과 반대입니다.',
  },
  {
    id: 'earth',
    nameKr: '지구',
    nameEn: 'Earth',
    radiusKm: 6371,
    orbitRadiusAU: 1,
    orbitalPeriodDays: 365.2,
    rotationPeriodHours: 23.9,
    color: '#4f83ff',
    moonsCount: 1,
    desc: '액체 물과 생명체가 존재하는 것으로 확인된 유일한 행성입니다.',
  },
  {
    id: 'mars',
    nameKr: '화성',
    nameEn: 'Mars',
    radiusKm: 3389,
    orbitRadiusAU: 1.52,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.6,
    color: '#d1744f',
    moonsCount: 2,
    desc: '산화철 성분으로 붉게 보이며 계절 변화가 뚜렷합니다.',
  },
  {
    id: 'jupiter',
    nameKr: '목성',
    nameEn: 'Jupiter',
    radiusKm: 69911,
    orbitRadiusAU: 5.2,
    orbitalPeriodDays: 4331,
    rotationPeriodHours: 9.9,
    color: '#d9b38b',
    moonsCount: 95,
    desc: '태양계에서 가장 큰 가스 행성으로 매우 빠르게 자전합니다.',
  },
  {
    id: 'saturn',
    nameKr: '토성',
    nameEn: 'Saturn',
    radiusKm: 58232,
    orbitRadiusAU: 9.58,
    orbitalPeriodDays: 10747,
    rotationPeriodHours: 10.7,
    color: '#d8c08f',
    moonsCount: 146,
    desc: '거대한 고리로 유명한 가스 행성이며 위성이 매우 많습니다.',
  },
  {
    id: 'uranus',
    nameKr: '천왕성',
    nameEn: 'Uranus',
    radiusKm: 25362,
    orbitRadiusAU: 19.2,
    orbitalPeriodDays: 30589,
    rotationPeriodHours: -17.2,
    color: '#9ec8cf',
    moonsCount: 27,
    desc: '자전축이 크게 기울어져 누운 듯한 상태로 공전합니다.',
  },
  {
    id: 'neptune',
    nameKr: '해왕성',
    nameEn: 'Neptune',
    radiusKm: 24622,
    orbitRadiusAU: 30.05,
    orbitalPeriodDays: 59800,
    rotationPeriodHours: 16.1,
    color: '#6188ff',
    moonsCount: 14,
    desc: '강한 바람이 관측되는 먼 얼음형 거대 행성입니다.',
  },
]

export const planetMap = Object.fromEntries(planetData.map((planet) => [planet.id, planet])) as Record<
  PlanetId,
  PlanetData
>
