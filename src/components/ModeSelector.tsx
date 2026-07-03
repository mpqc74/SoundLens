import { useState } from 'react'
import { DisplayMode, type DisplayMode as DisplayModeType } from '../core/modes'

const OPTIONS = [
  {
    value: DisplayMode.Boost,
    label: 'Boost',
    description:
      'Pitches you have more trouble hearing get turned up, while the rest stay as they are. ' +
      'This is the more direct approach, but boosting multiple pitches at once can push your ' +
      'equipment past what it handles cleanly — leading to distortion or a harsh, crackly ' +
      'sound, especially at higher volumes.\n\n' +
      'Mechanically: the reference band (least loss) sits at 0 dB; all other bands are ' +
      'positive values above it.',
  },
  {
    value: DisplayMode.HeadroomSafe,
    label: 'Headroom-safe',
    description:
      'Instead of turning anything up, this mode turns less-needed pitches down — preserving ' +
      'the same balance between pitches without ever exceeding your equipment\'s normal volume, ' +
      'which avoids the distortion that Boost mode can sometimes cause. The trade-off is a ' +
      'quieter overall result, which you can usually compensate for by raising your main volume.\n\n' +
      'Mechanically: the band with the most loss sits at 0 dB; all other bands are negative ' +
      'values below it. The spread between any two bands is identical in both modes.',
  },
]

interface Props {
  mode: DisplayModeType
  onModeChange: (mode: DisplayModeType) => void
}

export default function ModeSelector({ mode, onModeChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === mode)!

  function select(value: DisplayModeType) {
    onModeChange(value)
    setOpen(false)
  }

  return (
    <div className={`disclosure${open ? ' disclosure--open' : ''}`}>
      <button
        data-testid="mode-selector"
        className="disclosure-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="disclosure-caption">Mode</span>
        <span className="disclosure-value">{current.label}</span>
        <span className="disclosure-caret" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="disclosure-panel" role="listbox" aria-label="Mode">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === mode}
              data-testid={`mode-option-${opt.value}`}
              className={`disclosure-option${opt.value === mode ? ' disclosure-option--selected' : ''}`}
              onClick={() => select(opt.value as DisplayModeType)}
            >
              <strong className="disclosure-option-label">{opt.label}</strong>
              {opt.description.split('\n\n').map((para, i) => (
                <p key={i} className="disclosure-option-desc">{para}</p>
              ))}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
