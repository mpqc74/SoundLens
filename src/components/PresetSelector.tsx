import { useState } from 'react'
import { presets, type Preset } from '../presets/index'

interface Props {
  preset: Preset
  onPresetChange: (preset: Preset) => void
}

export default function PresetSelector({ preset, onPresetChange }: Props) {
  const [open, setOpen] = useState(false)

  function select(p: Preset) {
    onPresetChange(p)
    setOpen(false)
  }

  return (
    <div className={`disclosure${open ? ' disclosure--open' : ''}`}>
      <button
        data-testid="preset-selector"
        className="disclosure-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="disclosure-caption">Equipment</span>
        <span className="disclosure-value">{preset.name}</span>
        <span className="disclosure-caret" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="disclosure-panel" role="listbox" aria-label="Equipment">
          {presets.map(p => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === preset.id}
              data-testid={`preset-option-${p.id}`}
              className={`disclosure-option${p.id === preset.id ? ' disclosure-option--selected' : ''}`}
              onClick={() => select(p)}
            >
              <strong className="disclosure-option-label">{p.name}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}