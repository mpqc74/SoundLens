import { useState, useEffect } from 'react'
import { type Audiogram } from '../core/pipeline'
import { DEFAULT_FREQUENCIES, buildAudiogram } from '../core/audiogramGrid'
import AudiogramEarChart from './AudiogramEarChart'

type Row = { left: number | null; right: number | null }
type GridState = Record<number, Row>

function initialRows(): GridState {
  return Object.fromEntries(DEFAULT_FREQUENCIES.map(hz => [hz, { left: 0, right: 0 }]))
}

interface Props {
  onAudiogramChange: (audiogram: Audiogram) => void
}

export default function AudiogramGraphic({ onAudiogramChange }: Props) {
  const [rows, setRows] = useState<GridState>(initialRows)

  useEffect(() => {
    onAudiogramChange(buildAudiogram(rows))
    // onAudiogramChange intentionally omitted: only `rows` changes should re-trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows])

  function setEarValue(hz: number, ear: 'left' | 'right', value: number) {
    setRows(prev => {
      const existing = prev[hz] ?? { left: null, right: null }
      return { ...prev, [hz]: { ...existing, [ear]: value } }
    })
  }

  function deleteMarker(hz: number, ear: 'left' | 'right') {
    setRows(prev => {
      const existing = prev[hz]
      if (!existing) return prev
      const updated = { ...existing, [ear]: null }
      const next = { ...prev, [hz]: updated }
      if (!DEFAULT_FREQUENCIES.includes(hz) && updated.left === null && updated.right === null) {
        delete next[hz]
      }
      return next
    })
  }

  return (
    <section className="audiogram-graphic" aria-label="Audiogram entry">
      <h2>Enter your audiogram</h2>
      <p className="audiogram-hint">
        Click a spot on either chart to place a point at that frequency, drag an existing point to
        fine-tune it, and use the × to remove a point placed by mistake. Values snap to the nearest
        5 dB.
      </p>
      <div className="audiogram-charts">
        <AudiogramEarChart
          ear="right"
          rows={rows}
          onSetValue={(hz, value) => setEarValue(hz, 'right', value)}
          onDelete={hz => deleteMarker(hz, 'right')}
        />
        <AudiogramEarChart
          ear="left"
          rows={rows}
          onSetValue={(hz, value) => setEarValue(hz, 'left', value)}
          onDelete={hz => deleteMarker(hz, 'left')}
        />
      </div>
    </section>
  )
}
