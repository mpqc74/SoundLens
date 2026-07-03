interface Props {
  onDismiss: () => void
}

export default function InfoMessage({ onDismiss }: Props) {
  return (
    <div className="info-message" role="dialog" aria-label="About SoundLens">
      <div className="info-message-body">
        <p>
          Here's a simple idea worth knowing: many people with hearing loss can get noticeably better
          sound just by adjusting the equalizer already built into their TV, computer, or car stereo —
          no new equipment required.
        </p>
        <p>
          Why does that work? Your audiogram — the chart from your hearing test — shows which pitches
          are harder for you to pick up. Correcting for that usually just means nudging those particular
          pitches up a bit relative to everything else, and that's exactly what an equalizer lets you do.
        </p>
        <p>
          This tool takes your audiogram and turns it into a few suggested equalizer settings to try,
          based on the gear you already own.
        </p>
        <p>
          You'll find a few different ways to calculate these suggestions — try more than one if you like.
          They're starting points, not exact prescriptions, so trust your ears and keep adjusting from there.
        </p>
        <p>
          Worth knowing: if you're not the only one listening, your settings might not suit everyone else
          in the room. And your audiogram data stays on your computer — it's never sent anywhere.
        </p>
      </div>
      <button
        className="info-message-dismiss"
        data-testid="info-dismiss"
        onClick={onDismiss}
      >
        Got it
      </button>
    </div>
  )
}
