import { useState, useMemo } from 'react'
import { computeBands, type Audiogram } from './core/pipeline'
import { Formula, type Formula as FormulaType } from './core/formulas'
import { DisplayMode, type DisplayMode as DisplayModeType } from './core/modes'
import { iso10, type Preset } from './presets/index'
import InfoMessage from './components/InfoMessage'
import AudiogramGraphic from './components/AudiogramGraphic'
import PresetSelector from './components/PresetSelector'
import FormulaSelector from './components/FormulaSelector'
import ModeSelector from './components/ModeSelector'
import Legend from './components/Legend'
import EqGraphic from './components/EqGraphic'
import './App.css'

export default function App() {
  const [audiogram, setAudiogram] = useState<Audiogram>({})
  const [formula, setFormula] = useState<FormulaType>(Formula.HalfGain)
  const [mode, setMode] = useState<DisplayModeType>(DisplayMode.HeadroomSafe)
  const [preset, setPreset] = useState<Preset>(iso10)
  const [dismissed, setDismissed] = useState(false)

  const hasAudiogram = Object.keys(audiogram).length >= 2

  const bands = useMemo(
    () =>
      hasAudiogram
        ? computeBands(audiogram, preset.bands, formula, mode, preset.range)
        : [],
    [audiogram, formula, mode, preset, hasAudiogram]
  )

  return (
    <div className="app">
      {!dismissed && <InfoMessage onDismiss={() => setDismissed(true)} />}

      <header className="app-header">
        <h1>SoundLens</h1>
        <p className="app-tagline">Personalised equalizer settings from your audiogram</p>
      </header>

      <main className="app-main">
        <AudiogramGraphic onAudiogramChange={setAudiogram} />

        {hasAudiogram && (
          <section className="eq-section">
            <div className="selectors">
              <PresetSelector preset={preset} onPresetChange={setPreset} />
              <FormulaSelector formula={formula} onFormulaChange={setFormula} />
              <ModeSelector mode={mode} onModeChange={setMode} />
            </div>

            <p className="reference-message">
              This curve is calculated relative to the frequency where you have the least
              hearing loss — shown with a marker on the chart below. All other bands are
              adjusted relative to that reference point.
            </p>

            <EqGraphic bands={bands} preset={preset} />
            <Legend />
          </section>
        )}
      </main>
    </div>
  )
}
