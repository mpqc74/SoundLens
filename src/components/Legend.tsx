export default function Legend() {
  return (
    <div className="legend" aria-label="Color key">
      <div className="legend-item">
        <span className="legend-swatch legend-swatch--none" />
        <span>Standard correction</span>
      </div>
      <div className="legend-item">
        <span className="legend-swatch legend-swatch--yellow" />
        <span>Spread &gt; 10 dB — use with care</span>
      </div>
      <div className="legend-item">
        <span className="legend-swatch legend-swatch--red" />
        <span>Spread &gt; 15 dB — full value shown; second marker is safety cap (15 dB above reference)</span>
      </div>
      <div className="legend-item">
        <span className="legend-swatch legend-swatch--limit" />
        <span>Flat-edged knob = EQ's maximum; ▲▼ above/below = where the ideal correction actually lands</span>
      </div>
      <div className="legend-item">
        <span className="legend-icon" style={{ opacity: 0.5 }}>?</span>
        <span>Estimated — outside your tested frequency range; value is extrapolated</span>
      </div>
      <div className="legend-item">
        <span className="legend-icon">👂</span>
        <span>Reference band — least hearing loss; all other bands are adjusted relative to this one</span>
      </div>
    </div>
  )
}
