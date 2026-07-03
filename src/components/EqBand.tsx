import { type BandResult } from '../core/pipeline'
import { formatHz } from '../utils'

const TRACK_HEIGHT = 200
const KNOB_R = 12

function knobTop(value: number, rangeMin: number, rangeMax: number): number {
  const range = rangeMax - rangeMin
  const clamped = Math.max(rangeMin, Math.min(rangeMax, value))
  return ((rangeMax - clamped) / range) * TRACK_HEIGHT
}

interface Props {
  band: BandResult
  rangeMin: number
  rangeMax: number
  refCorrection: number
}

export default function EqBand({ band, rangeMin, rangeMax, refCorrection }: Props) {
  const { hz, correction, warning, isReference, isExtrapolated, cappedCorrection } = band

  const isClippedHigh = correction > rangeMax
  const isClippedLow = correction < rangeMin
  const isClipped = isClippedHigh || isClippedLow

  const primaryTop = knobTop(correction, rangeMin, rangeMax)
  const cappedTop = cappedCorrection !== undefined
    ? knobTop(cappedCorrection, rangeMin, rangeMax)
    : null

  const limitTop = isClippedHigh ? 0 - KNOB_R : TRACK_HEIGHT - KNOB_R

  const cappedAlsoClipped = cappedTop !== null && isClipped && (
    isClippedHigh
      ? (cappedCorrection as number) >= rangeMax
      : (cappedCorrection as number) <= rangeMin
  )

  const warningColor = warning === 'red' ? '#dc2626' : warning === 'yellow' ? '#d97706' : '#9ca3af'

  const knobClasses = [
    'eq-knob',
    `eq-knob--${warning}`,
    isExtrapolated ? 'eq-knob--dim' : '',
  ].filter(Boolean).join(' ')

  const limitSpread = isClippedHigh ? rangeMax - refCorrection : rangeMin - refCorrection
  const limitWarning: 'red' | 'yellow' | 'none' =
    limitSpread > 15 ? 'red' : limitSpread > 10 ? 'yellow' : 'none'

  const limitKnobClasses = [
    'eq-knob',
    `eq-knob--${limitWarning}`,
    isClippedHigh ? 'eq-knob--limit-high' : 'eq-knob--limit-low',
  ].filter(Boolean).join(' ')

  const icons = (
    <>
      {isReference && (
        <span
          className="eq-knob-icon"
          data-testid={`band-reference-icon-${hz}`}
          title="Reference band — least hearing loss"
        >
          👂
        </span>
      )}
      {isExtrapolated && (
        <span
          className="eq-knob-icon eq-knob-icon--q"
          data-testid={`band-extrapolated-icon-${hz}`}
          title="Estimated — outside tested range"
        >
          ?
        </span>
      )}
    </>
  )

  return (
    <div className={`eq-band${isExtrapolated ? ' eq-band--extrapolated' : ''}`}>
      <div className="eq-track" style={{ height: TRACK_HEIGHT }}>
        {/* Capped knob — only when cappedCorrection is within the EQ's physical range */}
        {cappedTop !== null && !cappedAlsoClipped && (
          <div
            className="eq-knob eq-knob--capped"
            style={{ top: cappedTop - KNOB_R }}
            data-testid={`band-knob-capped-${hz}`}
            data-value={(cappedCorrection as number).toFixed(1)}
            aria-label={`${formatHz(hz)} Hz safety cap: ${(cappedCorrection as number).toFixed(1)} dB`}
          />
        )}

        {!isClipped && (
          /* Primary knob — correction is within EQ range */
          <div
            className={knobClasses}
            style={{ top: primaryTop - KNOB_R }}
            data-testid={`band-knob-${hz}`}
            data-value={correction.toFixed(1)}
            data-warning={warning}
            aria-label={`${formatHz(hz)} Hz: ${correction.toFixed(1)} dB`}
          >
            {icons}
          </div>
        )}

        {isClipped && (
          <>
            {/* Hidden data carrier — keeps data-value and data-warning in DOM */}
            <div
              style={{ display: 'none' }}
              data-testid={`band-knob-${hz}`}
              data-value={correction.toFixed(1)}
              data-warning={warning}
            />

            {/* Limit knob — shows the best this EQ can actually do */}
            <div
              className={limitKnobClasses}
              style={{ top: limitTop }}
              data-testid={`band-knob-limit-${hz}`}
              data-value={correction.toFixed(1)}
              data-warning={limitWarning}
              aria-label={`${formatHz(hz)} Hz: computed ${correction.toFixed(1)} dB — EQ limit is ${isClippedHigh ? rangeMax : rangeMin} dB`}
            >
              {icons}
            </div>

            {/* Overflow chevron — shows the true correction beyond the EQ's range */}
            <div
              className="eq-overflow-chevron"
              style={isClippedHigh
                ? { bottom: TRACK_HEIGHT + KNOB_R + 4 }
                : { top: TRACK_HEIGHT + KNOB_R + 4 }
              }
              data-testid={`band-overflow-chevron-${hz}`}
              aria-label={`${formatHz(hz)} Hz: proposed correction ${correction.toFixed(1)} dB is beyond this EQ's range`}
            >
              {isClippedHigh ? (
                <>
                  <span className="eq-overflow-value" style={{ color: warningColor }}>
                    {correction > 0 ? `+${correction.toFixed(1)}` : correction.toFixed(1)}
                  </span>
                  <div className="eq-overflow-arrow eq-overflow-arrow--high" style={{ borderBottomColor: warningColor }} />
                </>
              ) : (
                <>
                  <div className="eq-overflow-arrow eq-overflow-arrow--low" style={{ borderTopColor: warningColor }} />
                  <span className="eq-overflow-value" style={{ color: warningColor }}>
                    {correction > 0 ? `+${correction.toFixed(1)}` : correction.toFixed(1)}
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="eq-tick">
        <span className="eq-hz">{formatHz(hz)}</span>
        {isReference && (
          <span
            className="eq-label eq-label--reference"
            data-testid={`band-reference-label-${hz}`}
          >
            Reference
          </span>
        )}
        {isExtrapolated && (
          <span
            className="eq-label eq-label--estimated"
            data-testid={`band-estimated-label-${hz}`}
          >
            Estimated
          </span>
        )}
      </div>
    </div>
  )
}
