import { useState } from 'react'
import {
  ALL_FREQUENCIES,
  hzToX,
  dbToY,
  yToDb,
  isOctave,
  segmentStyle,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../core/audiogramGrid'
import AudiogramMarker from './AudiogramMarker'
import { formatHz } from '../utils'

const Y_LABELS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const SCALE_WIDTH = 28 // must match .audiogram-scale's CSS width

type Row = { left: number | null; right: number | null }

interface Props {
  ear: 'left' | 'right'
  rows: Record<number, Row>
  onSetValue: (hz: number, value: number) => void
  onDelete: (hz: number) => void
}

function nearestColumn(x: number): number {
  return ALL_FREQUENCIES.reduce((best, hz) =>
    Math.abs(hzToX(hz) - x) < Math.abs(hzToX(best) - x) ? hz : best,
  )
}

export default function AudiogramEarChart({ ear, rows, onSetValue, onDelete }: Props) {
  const [draggingHz, setDraggingHz] = useState<number | null>(null)

  function valueAt(hz: number): number | null {
    return rows[hz] ? rows[hz][ear] : null
  }

  function handlePlotPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const nearestHz = nearestColumn(x)
    onSetValue(nearestHz, yToDb(y))
    setDraggingHz(nearestHz)
  }

  function handlePlotPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingHz === null) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    onSetValue(draggingHz, yToDb(y))
  }

  function handlePlotPointerUp() {
    setDraggingHz(null)
  }

  const points = ALL_FREQUENCIES.map(hz => ({ hz, value: valueAt(hz) }))
    .filter((p): p is { hz: number; value: number } => p.value !== null)
    .sort((a, b) => a.hz - b.hz)

  const segments = points.slice(1).map((p, i) => {
    const prev = points[i]
    const style = segmentStyle(
      { x: hzToX(prev.hz), y: dbToY(prev.value) },
      { x: hzToX(p.hz), y: dbToY(p.value) },
    )
    return { key: `${prev.hz}-${p.hz}`, from: prev.hz, to: p.hz, style }
  })

  return (
    <div className="audiogram-chart">
      <h3 className={`audiogram-chart-title audiogram-chart-title--${ear}`}>
        {ear === 'right' ? 'Right ear' : 'Left ear'}
      </h3>
      <div className="audiogram-grid-wrap">
        <div className="audiogram-freq-axis" style={{ width: GRID_WIDTH, marginLeft: SCALE_WIDTH }}>
          {ALL_FREQUENCIES.map(hz => (
            <span
              key={hz}
              className={`audiogram-freq-label${isOctave(hz) ? '' : ' audiogram-freq-label--minor'}`}
              style={{ left: hzToX(hz) }}
            >
              {formatHz(hz)}
            </span>
          ))}
        </div>

        <div className="audiogram-grid-row">
          <div className="audiogram-scale" style={{ width: SCALE_WIDTH, height: GRID_HEIGHT }}>
            {Y_LABELS.map(db => (
              <span key={db} className="audiogram-scale-label" style={{ top: dbToY(db) }}>
                {db}
              </span>
            ))}
          </div>

          <div
            className="audiogram-plot"
            style={{ width: GRID_WIDTH, height: GRID_HEIGHT }}
            data-testid={`audiogram-plot-${ear}`}
            onPointerDown={handlePlotPointerDown}
            onPointerMove={handlePlotPointerMove}
            onPointerUp={handlePlotPointerUp}
          >
            {Y_LABELS.map(db => (
              <div
                key={db}
                className={`audiogram-gridline-h${db === 0 ? ' audiogram-gridline-h--zero' : ''}`}
                style={{ top: dbToY(db) }}
                aria-hidden
              />
            ))}

            {ALL_FREQUENCIES.map(hz => (
              <div
                key={hz}
                className={`audiogram-gridline-v${isOctave(hz) ? '' : ' audiogram-gridline-v--minor'}`}
                style={{ left: hzToX(hz) }}
                data-testid={`audiogram-column-${ear}-${hz}`}
                aria-hidden
              />
            ))}

            {segments.map(seg => (
              <div
                key={seg.key}
                className={`audiogram-line-segment audiogram-line-segment--${ear}`}
                style={{
                  left: seg.style.left,
                  top: seg.style.top,
                  width: seg.style.width,
                  transform: `rotate(${seg.style.angleDeg}deg)`,
                }}
                data-testid={`audiogram-line-${ear}-${seg.from}-${seg.to}`}
                aria-hidden
              />
            ))}

            {points.map(({ hz, value }) => (
              <AudiogramMarker
                key={hz}
                hz={hz}
                ear={ear}
                value={value}
                onStartDrag={() => setDraggingHz(hz)}
                onDelete={() => onDelete(hz)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
