import './App.css'
import { ControlPanel } from './components/ControlPanel'
import { SolarSystemScene } from './components/SolarSystemScene'
import { useSolarSystemStore } from './store/solarSystemStore'
import { useShallow } from 'zustand/react/shallow'

function App() {
  const { mode, setMode, resetSettings, requestFrameSystem } = useSolarSystemStore(
    useShallow((state) => ({
      mode: state.mode,
      setMode: state.setMode,
      resetSettings: state.resetSettings,
      requestFrameSystem: state.requestFrameSystem,
    })),
  )

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="titleBlock">
          <p className="eyebrow">Interactive Classroom Model</p>
          <h1>교육용 태양계 3D 모형</h1>
        </div>

        <div className="topActions">
          <button
            className={`modeButton ${mode === 'presentation' ? 'active' : ''}`}
            onClick={() => setMode('presentation')}
          >
            보기 좋은 모드
          </button>
          <button
            className={`modeButton ${mode === 'realistic' ? 'active' : ''}`}
            onClick={() => setMode('realistic')}
          >
            실제 비율 모드
          </button>
          <button
            className={`modeButton ${mode === 'closeup' ? 'active' : ''}`}
            onClick={() => setMode('closeup')}
          >
            지구 클로즈업 모드
          </button>
          <button
            className={`modeButton ${mode === 'mooncloseup' ? 'active' : ''}`}
            onClick={() => setMode('mooncloseup')}
          >
            달 클로즈업 모드
          </button>
          <button className="utilityButton" onClick={requestFrameSystem}>
            카메라 프레이밍
          </button>
          <button className="utilityButton" onClick={resetSettings}>
            리셋
          </button>
          <span
            className="helpBadge"
            title="보기 좋은 모드로 전체 구조를 익히고, 지구/달 클로즈업 모드에서 계절·달 위상·조석과 달 표면을 관찰한 뒤 실제 비율 모드로 스케일 차이를 비교해보세요."
          >
            도움말
          </span>
        </div>
      </header>

      <main className="contentLayout">
        <section className="sceneArea">
          <SolarSystemScene />
        </section>
        <aside className="sidePanel">
          <ControlPanel />
        </aside>
      </main>
    </div>
  )
}

export default App
