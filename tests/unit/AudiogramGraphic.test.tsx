import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AudiogramGraphic from '../../src/components/AudiogramGraphic'
import {
  DEFAULT_FREQUENCIES,
  hzToX,
  dbToY,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '../../src/core/audiogramGrid'

// jsdom does not implement layout, so getBoundingClientRect() returns all zeros by
// default. Mock it to a fixed rect matching the plot's pure-function pixel domain so
// pointer coordinates translate deterministically through hzToX/dbToY in the component.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: GRID_WIDTH,
    bottom: GRID_HEIGHT,
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    toJSON: () => {},
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function pointerAt(hz: number, db: number) {
  return { clientX: hzToX(hz), clientY: dbToY(db) }
}

describe('AudiogramGraphic — initial render', () => {
  it('pre-populates the 6 default frequencies at 0 dB on both charts', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    for (const hz of DEFAULT_FREQUENCIES) {
      expect(screen.getByTestId(`audiogram-marker-left-${hz}`)).toHaveAttribute('data-value', '0')
      expect(screen.getByTestId(`audiogram-marker-right-${hz}`)).toHaveAttribute('data-value', '0')
    }
  })

  it('does not show a marker at 125 Hz or any interoctave column on either chart', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    for (const hz of [125, 750, 1500, 3000, 6000]) {
      expect(screen.queryByTestId(`audiogram-marker-left-${hz}`)).toBeNull()
      expect(screen.queryByTestId(`audiogram-marker-right-${hz}`)).toBeNull()
    }
  })

  it('calls onAudiogramChange once on mount with the 6 default points', () => {
    const onChange = vi.fn()
    render(<AudiogramGraphic onAudiogramChange={onChange} />)
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0]
    for (const hz of DEFAULT_FREQUENCIES) {
      expect(arg[hz]).toEqual({ left: 0, right: 0 })
    }
    expect(arg[125]).toBeUndefined()
  })
})

describe('AudiogramGraphic — placing points is chart-scoped, no cross-talk', () => {
  it('clicking the right-ear chart only ever creates a right-ear marker', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const rightPlot = screen.getByTestId('audiogram-plot-right')
    fireEvent.pointerDown(rightPlot, { pointerId: 1, ...pointerAt(750, 40) })
    fireEvent.pointerUp(rightPlot, { pointerId: 1, ...pointerAt(750, 40) })

    expect(screen.getByTestId('audiogram-marker-right-750')).toHaveAttribute('data-value', '40')
    expect(screen.queryByTestId('audiogram-marker-left-750')).toBeNull()
  })

  it('clicking the left-ear chart only ever creates a left-ear marker', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const leftPlot = screen.getByTestId('audiogram-plot-left')
    fireEvent.pointerDown(leftPlot, { pointerId: 1, ...pointerAt(1500, 35) })
    fireEvent.pointerUp(leftPlot, { pointerId: 1, ...pointerAt(1500, 35) })

    expect(screen.getByTestId('audiogram-marker-left-1500')).toHaveAttribute('data-value', '35')
    expect(screen.queryByTestId('audiogram-marker-right-1500')).toBeNull()
  })
})

describe('AudiogramGraphic — dragging an existing marker', () => {
  it('changes only the value, never the frequency column, and snaps to 5 dB', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const marker = screen.getByTestId('audiogram-marker-left-1000')
    const plot = screen.getByTestId('audiogram-plot-left')
    const xBefore = marker.style.left

    fireEvent.pointerDown(marker, { pointerId: 1, ...pointerAt(1000, 0) })
    fireEvent.pointerMove(plot, { pointerId: 1, ...pointerAt(1000, 38) })
    fireEvent.pointerUp(plot, { pointerId: 1, ...pointerAt(1000, 38) })

    expect(screen.getByTestId('audiogram-marker-left-1000')).toHaveAttribute('data-value', '40')
    expect(screen.getByTestId('audiogram-marker-left-1000').style.left).toBe(xBefore)
  })

  it('clamps to DB_MAX when dragged past the bottom of the plot', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const marker = screen.getByTestId('audiogram-marker-right-2000')
    const plot = screen.getByTestId('audiogram-plot-right')

    fireEvent.pointerDown(marker, { pointerId: 1, ...pointerAt(2000, 0) })
    fireEvent.pointerMove(plot, { pointerId: 1, clientX: hzToX(2000), clientY: GRID_HEIGHT + 500 })
    fireEvent.pointerUp(plot, { pointerId: 1, clientX: hzToX(2000), clientY: GRID_HEIGHT + 500 })

    expect(screen.getByTestId('audiogram-marker-right-2000')).toHaveAttribute('data-value', '110')
  })
})

describe('AudiogramGraphic — deleting a point', () => {
  it('removes only that ear marker and excludes the hz from the next onAudiogramChange call', () => {
    const onChange = vi.fn()
    render(<AudiogramGraphic onAudiogramChange={onChange} />)

    fireEvent.click(screen.getByTestId('audiogram-marker-delete-left-1000'))

    expect(screen.queryByTestId('audiogram-marker-left-1000')).toBeNull()
    expect(screen.getByTestId('audiogram-marker-right-1000')).toBeInTheDocument()

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall[1000]).toBeUndefined()
  })

  it('reverts a non-default hz to fully unset on both charts once both ears are deleted', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const rightPlot = screen.getByTestId('audiogram-plot-right')
    const leftPlot = screen.getByTestId('audiogram-plot-left')

    fireEvent.pointerDown(rightPlot, { pointerId: 1, ...pointerAt(750, 30) })
    fireEvent.pointerUp(rightPlot, { pointerId: 1, ...pointerAt(750, 30) })
    fireEvent.pointerDown(leftPlot, { pointerId: 2, ...pointerAt(750, 30) })
    fireEvent.pointerUp(leftPlot, { pointerId: 2, ...pointerAt(750, 30) })

    expect(screen.getByTestId('audiogram-marker-right-750')).toBeInTheDocument()
    expect(screen.getByTestId('audiogram-marker-left-750')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('audiogram-marker-delete-right-750'))
    fireEvent.click(screen.getByTestId('audiogram-marker-delete-left-750'))

    expect(screen.queryByTestId('audiogram-marker-right-750')).toBeNull()
    expect(screen.queryByTestId('audiogram-marker-left-750')).toBeNull()
  })
})

describe('AudiogramGraphic — connecting line segments', () => {
  it('renders (n - 1) segments per chart for n plotted points', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    // 6 default points on each chart -> 5 segments each
    const rightSegments = screen.getAllByTestId(/^audiogram-line-right-/)
    const leftSegments = screen.getAllByTestId(/^audiogram-line-left-/)
    expect(rightSegments).toHaveLength(DEFAULT_FREQUENCIES.length - 1)
    expect(leftSegments).toHaveLength(DEFAULT_FREQUENCIES.length - 1)
  })

  it('splits one segment into two when an interoctave point is added between two connected points', () => {
    render(<AudiogramGraphic onAudiogramChange={() => {}} />)
    const rightPlot = screen.getByTestId('audiogram-plot-right')

    fireEvent.pointerDown(rightPlot, { pointerId: 1, ...pointerAt(1500, 25) }) // between 1000 and 2000
    fireEvent.pointerUp(rightPlot, { pointerId: 1, ...pointerAt(1500, 25) })

    const rightSegments = screen.getAllByTestId(/^audiogram-line-right-/)
    expect(rightSegments).toHaveLength(DEFAULT_FREQUENCIES.length) // one more point -> one more segment
  })
})
