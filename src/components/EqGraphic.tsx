import { type BandResult } from '../core/pipeline'
import { type Preset } from '../presets/index'
import EqBand from './EqBand'

const TRACK_HEIGHT = 200

interface Props {
  bands: BandResult[]
  preset: Preset
}

export default function EqGraphic({ bands, preset }: Props) {
  const { rangeMin, rangeMax, gridInterval } = preset
  const range = rangeMax - rangeMin
  const zeroTop = ((rangeMax - 0) / range) * TRACK_HEIGHT

  const refCorrection = bands.find(b => b.isReference)?.correction ?? 0

  const gridValues: number[] = []
  for (let v = gridInterval; v < rangeMax; v += gridInterval) {
    gridValues.push(v)
    gridValues.push(-v)
  }

  return (
    <div className="eq-graphic" aria-label="Equalizer settings">
      <div className="eq-scale" style={{ height: TRACK_HEIGHT }}>
        <span className="eq-scale-label" style={{ top: 0 }}>{rangeMax} dB</span>
        {gridValues.map(val => (
          <span
            key={val}
            className="eq-scale-label eq-scale-label--minor"
            style={{ top: ((rangeMax - val) / range) * TRACK_HEIGHT }}
          >
            {val > 0 ? `+${val}` : val}
          </span>
        ))}
        <span className="eq-scale-label" style={{ top: zeroTop }}>0</span>
        <span className="eq-scale-label" style={{ bottom: 0 }}>{rangeMin} dB</span>
      </div>

      <div className="eq-bands-area">
        {gridValues.map(val => (
          <div
            key={val}
            className="eq-gridline"
            style={{ top: ((rangeMax - val) / range) * TRACK_HEIGHT }}
            aria-hidden
          />
        ))}
        <div
          className="eq-zero-line"
          style={{ top: zeroTop }}
          aria-hidden
        />
        <div className="eq-bands">
          {bands.map(band => (
            <EqBand
              key={band.hz}
              band={band}
              rangeMin={rangeMin}
              rangeMax={rangeMax}
              refCorrection={refCorrection}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
