import { useState } from 'react'
import { Formula, type Formula as FormulaType } from '../core/formulas'

const OPTIONS = [
  {
    value: Formula.Ideal,
    label: 'Ideal',
    description:
      'Boosts each pitch by the full amount your audiogram suggests. This gives the most ' +
      'complete correction, but is also the most likely to feel too strong — especially if ' +
      'your hearing loss is more pronounced at certain pitches. A good option to try if your ' +
      'loss is mild, or just to see the full range of what\'s possible before dialing it back.',
  },
  {
    value: Formula.HalfGain,
    label: 'Half-gain',
    description:
      'A long-used rule of thumb: boosts each pitch by about half of what your audiogram ' +
      'suggests. A balanced, moderate starting point that works reasonably well for most ' +
      'people — neither the strongest nor the gentlest option here.',
  },
  {
    value: Formula.LossAdjusted,
    label: 'Loss-adjusted',
    description:
      'Boosts each pitch by a portion of your measured loss — using a smaller portion where ' +
      'the loss is more pronounced, since larger corrections tend to feel less comfortable. A ' +
      'good fit if your hearing loss varies a lot between pitches, since it avoids ' +
      'over-correcting the areas where you need the most help.',
  },
]

interface Props {
  formula: FormulaType
  onFormulaChange: (formula: FormulaType) => void
}

export default function FormulaSelector({ formula, onFormulaChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = OPTIONS.find(o => o.value === formula)!

  function select(value: FormulaType) {
    onFormulaChange(value)
    setOpen(false)
  }

  return (
    <div className={`disclosure${open ? ' disclosure--open' : ''}`}>
      <button
        data-testid="formula-selector"
        className="disclosure-toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span className="disclosure-caption">Formula</span>
        <span className="disclosure-value">{current.label}</span>
        <span className="disclosure-caret" aria-hidden>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="disclosure-panel" role="listbox" aria-label="Formula">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="option"
              aria-selected={opt.value === formula}
              data-testid={`formula-option-${opt.value}`}
              className={`disclosure-option${opt.value === formula ? ' disclosure-option--selected' : ''}`}
              onClick={() => select(opt.value as FormulaType)}
            >
              <strong className="disclosure-option-label">{opt.label}</strong>
              <p className="disclosure-option-desc">{opt.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
