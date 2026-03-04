import { planetMap } from '../data/planetData'
import { useSolarSystemStore, type CloseupSeason } from '../store/solarSystemStore'
import { useShallow } from 'zustand/react/shallow'

function formatRotationPeriod(hours: number): string {
  const isRetrograde = hours < 0
  const absoluteHours = Math.abs(hours)

  if (absoluteHours >= 48) {
    const days = absoluteHours / 24
    return `${days.toFixed(1)}일${isRetrograde ? ' (역자전)' : ''}`
  }

  return `${absoluteHours.toFixed(1)}시간${isRetrograde ? ' (역자전)' : ''}`
}

function formatTimeScale(daysPerSecond: number): string {
  if (daysPerSecond >= 10) {
    return daysPerSecond.toFixed(0)
  }

  if (daysPerSecond >= 1) {
    return daysPerSecond.toFixed(1)
  }

  return daysPerSecond.toFixed(2)
}

const closeupSeasonOrder: CloseupSeason[] = ['봄', '여름', '가을', '겨울']

export function ControlPanel() {
  const {
    mode,
    timeScale,
    paused,
    distanceScale,
    sizeExaggeration,
    showOrbits,
    showLabels,
    surfaceTemperatureMode,
    closeupInsights,
    selectedPlanetId,
    setTimeScale,
    setDistanceScale,
    setSizeExaggeration,
    togglePause,
    toggleSurfaceTemperatureMode,
    jumpToSeason,
    toggleOrbits,
    toggleLabels,
  } = useSolarSystemStore(
    useShallow((state) => ({
      mode: state.mode,
      timeScale: state.timeScale,
      paused: state.paused,
      distanceScale: state.distanceScale,
      sizeExaggeration: state.sizeExaggeration,
      showOrbits: state.showOrbits,
      showLabels: state.showLabels,
      surfaceTemperatureMode: state.surfaceTemperatureMode,
      closeupInsights: state.closeupInsights,
      selectedPlanetId: state.selectedPlanetId,
      setTimeScale: state.setTimeScale,
      setDistanceScale: state.setDistanceScale,
      setSizeExaggeration: state.setSizeExaggeration,
      togglePause: state.togglePause,
      toggleSurfaceTemperatureMode: state.toggleSurfaceTemperatureMode,
      jumpToSeason: state.jumpToSeason,
      toggleOrbits: state.toggleOrbits,
      toggleLabels: state.toggleLabels,
    })),
  )

  const selectedPlanet = selectedPlanetId ? planetMap[selectedPlanetId] : null
  const moonLightPercent = Math.round(closeupInsights.moonLightRatio * 100)

  return (
    <div className="panel">
      <section className="panelSection">
        <h2>학습 컨트롤</h2>
        <p className="sectionHint">모드와 슬라이더를 조합해 공전/자전, 계절, 달 위상, 조석 변화를 확인하세요.</p>

        <label className="rangeLabel" htmlFor="timeScale">
          시간 가속: <strong>1초 = {formatTimeScale(timeScale)}일</strong>
        </label>
        <input
          id="timeScale"
          type="range"
          min={0.05}
          max={120}
          step={0.05}
          value={timeScale}
          onChange={(event) => setTimeScale(Number(event.target.value))}
        />

        <div className="quickActionRow">
          <button className="panelActionButton" onClick={togglePause}>
            {paused ? '재생' : '일시정지'}
          </button>
          {mode === 'closeup' && (
            <label className="panelInlineToggle">
              <input
                type="checkbox"
                checked={surfaceTemperatureMode}
                onChange={toggleSurfaceTemperatureMode}
              />
              표면 온도 모드
            </label>
          )}
        </div>

        <label className="rangeLabel" htmlFor="distanceScale">
          거리 스케일: <strong>{distanceScale.toFixed(2)}x</strong>
        </label>
        <input
          id="distanceScale"
          type="range"
          min={0.2}
          max={2.5}
          step={0.05}
          value={distanceScale}
          onChange={(event) => setDistanceScale(Number(event.target.value))}
        />

        <label className="rangeLabel" htmlFor="sizeExaggeration">
          크기 과장: <strong>{sizeExaggeration.toFixed(2)}x</strong>
        </label>
        <input
          id="sizeExaggeration"
          type="range"
          min={0.6}
          max={20}
          step={0.1}
          value={sizeExaggeration}
          onChange={(event) => setSizeExaggeration(Number(event.target.value))}
        />

        <div className="toggleRow">
          <label>
            <input type="checkbox" checked={showOrbits} onChange={toggleOrbits} /> 궤도선 표시
          </label>
          <label>
            <input type="checkbox" checked={showLabels} onChange={toggleLabels} /> 라벨 표시
          </label>
        </div>

        {mode === 'realistic' && (
          <p className="modeWarning">
            실제 비율 모드에서는 행성이 너무 작고 멀어서 거의 보이지 않을 수 있습니다. 이것이 우주 스케일입니다.
          </p>
        )}

        {mode === 'closeup' && (
          <div className="closeupCard">
            <h3>지구 클로즈업 학습 카드</h3>
            <dl>
              <div>
                <dt>계절(북반구)</dt>
                <dd>{closeupInsights.seasonName}</dd>
              </div>
              <div>
                <dt>달 위상</dt>
                <dd>{closeupInsights.moonPhaseName}</dd>
              </div>
              <div>
                <dt>달 조명 비율</dt>
                <dd>{moonLightPercent}%</dd>
              </div>
              <div>
                <dt>조석 상태</dt>
                <dd>{closeupInsights.tideName}</dd>
              </div>
            </dl>
            <p className="seasonJumpTitle">계절 바로 이동</p>
            <div className="seasonJumpRow">
              {closeupSeasonOrder.map((season) => (
                <button
                  key={season}
                  className={`seasonJumpButton ${closeupInsights.seasonName === season ? 'active' : ''}`}
                  onClick={() => jumpToSeason(season)}
                >
                  {season}
                </button>
              ))}
            </div>
            <p>{closeupInsights.seasonDetail}</p>
            <p>{closeupInsights.tideDetail}</p>
            <p className="closeupLegend">
              {surfaceTemperatureMode
                ? '온도색: 파랑(저온) → 청록(온난) → 노랑/주황(고온), 계절에 따라 반구별 분포가 바뀝니다.'
                : '표면 온도 모드를 켜면 계절별 지표면 온도 분포를 색상으로 볼 수 있습니다.'}
            </p>
          </div>
        )}
      </section>

      <section className="panelSection infoCard">
        <h2>행성 정보 카드</h2>
        {!selectedPlanet && <p className="emptyState">3D 화면에서 행성을 클릭하면 정보가 표시됩니다.</p>}

        {selectedPlanet && (
          <div>
            <h3>
              {selectedPlanet.nameKr} <span>{selectedPlanet.nameEn}</span>
            </h3>
            <p>{selectedPlanet.desc}</p>
            <dl>
              <div>
                <dt>반지름</dt>
                <dd>{selectedPlanet.radiusKm.toLocaleString('ko-KR')} km</dd>
              </div>
              <div>
                <dt>태양까지 거리</dt>
                <dd>{selectedPlanet.orbitRadiusAU.toFixed(2)} AU</dd>
              </div>
              <div>
                <dt>공전 주기</dt>
                <dd>{selectedPlanet.orbitalPeriodDays.toLocaleString('ko-KR')} 일</dd>
              </div>
              <div>
                <dt>자전 주기</dt>
                <dd>{formatRotationPeriod(selectedPlanet.rotationPeriodHours)}</dd>
              </div>
              <div>
                <dt>위성 수</dt>
                <dd>{selectedPlanet.moonsCount.toLocaleString('ko-KR')} 개</dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </div>
  )
}
