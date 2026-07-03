import { useState } from 'react'
import { type Audiogram } from '../core/pipeline'
import { formatHz } from '../utils'

const FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]

type EarValue = string
type Row = { left: EarValue; right: EarValue }

function isValid(v: string): boolean {
  if (v === '') return true
  const n = Number(v)
  return !isNaN(n) && n >= 0 && n <= 120
}

function buildAudiogram(rows: Record<number, Row>): Audiogram {
  const audiogram: Audiogram = {}
  for (const hz of FREQUENCIES) {
    const { left, right } = rows[hz]
    if (left !== '' && right !== '' && isValid(left) && isValid(right)) {
      audiogram[hz] = { left: Number(left), right: Number(right) }
    }
  }
  return audiogram
}

interface Props {
  onAudiogramChange: (audiogram: Audiogram) => void
}

export default function AudiogramInput({ onAudiogramChange }: Props) {
  const [rows, setRows] = useState<Record<number, Row>>(
    Object.fromEntries(FREQUENCIES.map(hz => [hz, { left: '0', right: '0' }]))
  )

  function handleChange(hz: number, ear: 'left' | 'right', value: string) {
    const updated = { ...rows, [hz]: { ...rows[hz], [ear]: value } }
    setRows(updated)
    onAudiogramChange(buildAudiogram(updated))
  }

  return (
    <section className="audiogram-input">
      <h2>Enter your audiogram</h2>
      <p className="audiogram-hint">
        Fill in the thresholds from your hearing test (in dB HL). Enter both ears for a
        frequency to include it. Leave a row blank if that pitch wasn't tested.
      </p>
      <table className="audiogram-table">
        <thead>
          <tr>
            <th scope="col">Frequency</th>
            <th scope="col">Left ear (dB HL)</th>
            <th scope="col">Right ear (dB HL)</th>
          </tr>
        </thead>
        <tbody>
          {FREQUENCIES.map(hz => {
            const leftErr = !isValid(rows[hz].left)
            const rightErr = !isValid(rows[hz].right)
            return (
              <tr key={hz}>
                <td className="audiogram-freq">{formatHz(hz)} Hz</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    value={rows[hz].left}
                    data-testid={`input-left-${hz}`}
                    className={`audiogram-field${leftErr ? ' audiogram-field--error' : ''}`}
                    onChange={e => handleChange(hz, 'left', e.target.value)}
                    aria-label={`${formatHz(hz)} Hz left ear`}
                  />
                  {leftErr && <span className="audiogram-error">0–120</span>}
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    step={1}
                    value={rows[hz].right}
                    data-testid={`input-right-${hz}`}
                    className={`audiogram-field${rightErr ? ' audiogram-field--error' : ''}`}
                    onChange={e => handleChange(hz, 'right', e.target.value)}
                    aria-label={`${formatHz(hz)} Hz right ear`}
                  />
                  {rightErr && <span className="audiogram-error">0–120</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
