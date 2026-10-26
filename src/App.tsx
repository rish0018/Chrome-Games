import { useEffect, useState } from 'react'
import { CalibrationModal } from './components/CalibrationModal'
import { GameScreen } from './components/GameScreen'
import { MenuScreen } from './components/MenuScreen'
import { Button } from './components/ui'
import type { GameMode } from './engine/types'
import { useHandTracking } from './hand/useHandTracking'
import { useHighScores } from './hooks/useHighScores'
import { useSettings } from './hooks/useSettings'

type Screen = { name: 'menu' } | { name: 'game'; mode: GameMode; run: number }

export default function App() {
  const tracking = useHandTracking()
  const [settings, updateSettings] = useSettings()
  const [scores, submitScore] = useHighScores()
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null)
  const [calibrating, setCalibrating] = useState(false)

  const startGame = (mode: GameMode) => {
    setPendingMode(null)
    setScreen((prev) => ({ name: 'game', mode, run: prev.name === 'game' ? prev.run + 1 : 0 }))
  }

  const handlePlay = (mode: GameMode) => {
    if (settings.controlMode === 'gesture' && tracking.status !== 'ready') setPendingMode(mode)
    else startGame(mode)
  }

  // Start the game as soon as the camera comes up after the user asked to play.
  useEffect(() => {
    if (pendingMode && tracking.status === 'ready') startGame(pendingMode)
  }, [pendingMode, tracking.status])

  if (screen.name === 'game') {
    return (
      <GameScreen
        key={`${screen.mode}-${screen.run}`}
        mode={screen.mode}
        controlMode={settings.controlMode}
        tracking={tracking}
        best={scores[screen.mode]}
        onSubmitScore={submitScore}
        onChangeMode={startGame}
        onSwitchToManual={() => updateSettings({ controlMode: 'manual' })}
        onExit={() => setScreen({ name: 'menu' })}
      />
    )
  }

  const prompting = pendingMode !== null
  return (
    <>
      <MenuScreen
        tracking={tracking}
        settings={settings}
        scores={scores}
        onPlay={handlePlay}
        onControlMode={(controlMode) => updateSettings({ controlMode })}
        onCalibrate={() => setCalibrating(true)}
      />
      {calibrating && tracking.status === 'ready' && <CalibrationModal tracking={tracking} onClose={() => setCalibrating(false)} />}
      {prompting && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-prompt-title"
        >
          <div className="px-box animate-pop w-full max-w-md p-6 text-center sm:p-8">
            <h2 id="camera-prompt-title" className="text-lg sm:text-xl">
              Camera needed
            </h2>
            <p className="mt-4 text-lg text-ink-soft" role="status">
              {tracking.status === 'idle' ? 'Gesture mode reads your hand through the webcam.' : tracking.message}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="primary"
                onClick={() => void tracking.start()}
                disabled={tracking.status === 'loading'}
                autoFocus
              >
                {tracking.status === 'loading' ? 'Starting' : 'Enable camera'}
              </Button>
              <Button
                onClick={() => {
                  updateSettings({ controlMode: 'manual' })
                  startGame(pendingMode)
                }}
              >
                Play with keyboard instead
              </Button>
              <Button variant="ghost" onClick={() => setPendingMode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
