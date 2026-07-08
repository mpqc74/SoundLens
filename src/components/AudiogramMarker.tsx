import { hzToX, dbToY } from '../core/audiogramGrid'

const MARKER_R = 8

interface Props {
  hz: number
  ear: 'left' | 'right'
  value: number
  onStartDrag: () => void
  onDelete: () => void
}

export default function AudiogramMarker({ hz, ear, value, onStartDrag, onDelete }: Props) {
  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation()
    onStartDrag()
  }

  function handleMarkerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete()
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete()
  }

  function handleDeleteKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDelete()
    }
  }

  return (
    <div
      className={`audiogram-marker audiogram-marker--${ear}`}
      style={{ left: hzToX(hz) - MARKER_R, top: dbToY(value) - MARKER_R }}
      data-testid={`audiogram-marker-${ear}-${hz}`}
      data-value={value}
      tabIndex={0}
      aria-label={`${ear === 'left' ? 'Left' : 'Right'} ear at ${hz} Hz: ${value} dB HL`}
      onPointerDown={handlePointerDown}
      onKeyDown={handleMarkerKeyDown}
    >
      <button
        type="button"
        className="audiogram-marker-delete"
        data-testid={`audiogram-marker-delete-${ear}-${hz}`}
        aria-label={`Remove ${ear} ear point at ${hz} Hz`}
        onClick={handleDeleteClick}
        onKeyDown={handleDeleteKeyDown}
      >
        ×
      </button>
    </div>
  )
}
