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
          <button className="utilityButton" onClick={requestFrameSystem}>
            카메라 프레이밍
          </button>
          <button className="utilityButton" onClick={resetSettings}>
            리셋
          </button>
          <span
            className="helpBadge"
            title="보기 좋은 모드에서 개념을 먼저 이해한 뒤 실제 비율 모드로 전환하면 스케일 차이를 쉽게 설명할 수 있습니다."
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
