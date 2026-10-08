import { useRef, useState } from 'react';
import MarginNote from './MarginNote.jsx';
import { useTyper } from '../../hooks/useTyper.js';
import { MESSY_FILES, ROAST_WORDS } from './content.js';
import phoneAssignments from '../../assets/landing/phone-assignments.webp';

// Before/after card: a phone's messy downloads folder that flips to Noto.
// Mouse: flips while hovered. Touch and keyboard: the card is a toggle button.
function FlipCard({ flipped, setFlipped }) {
  const lastPointer = useRef('mouse');

  return (
    <button
      type="button"
      className="l-flip-card"
      aria-pressed={flipped}
      aria-label="Before and after: tidy the downloads folder into Noto"
      onPointerDown={(e) => (lastPointer.current = e.pointerType)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setFlipped(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setFlipped(false)}
      onClick={(e) => (e.detail === 0 || lastPointer.current !== 'mouse') && setFlipped((f) => !f)}
    >
      <span className="l-flip-inner">
        <span className="l-flip-face l-flip-front l-mess">
          <span className="l-mess-title">
            Downloads <span>214 items</span>
          </span>
          <span className="l-mess-list">
            {MESSY_FILES.map(([type, name]) => (
              <span key={name} className="l-mess-row">
                <span className={`file-type file-type-sm file-type-${type}`}>{type.toUpperCase()}</span>
                {name}
              </span>
            ))}
          </span>
          <span className="l-mess-sticky">due fri?? or thu</span>
        </span>
        <span className="l-flip-face l-flip-back">
          <img src={phoneAssignments} alt="The same work in Noto: assignments with subjects, due dates and completion" loading="lazy" />
        </span>
      </span>
    </button>
  );
}

export default function RoastSection({ motion }) {
  const word = useTyper(ROAST_WORDS, { typeMs: 55, eraseMs: 30, holdMs: 1100, startMs: 500, shuffle: true, enabled: motion });
  const [flipped, setFlipped] = useState(false);

  return (
    <section
      className="l-panel l-deal l-roast"
      data-tone="dark"
      style={{ '--deal-tilt': '-0.7deg' }}
      aria-labelledby="l-roast-title"
    >
      <div className="l-roast-copy">
        <h2 id="l-roast-title" className="l-roast-heading" data-lag>
          <span className="l-eyebrow">Your semester is</span>
          <span className="l-roast-word" aria-hidden="true">
            <span>{word}</span>
          </span>
          <span className="visually-hidden">scattered, overdue and seven tabs deep.</span>
          <span className="l-mega">Noto can help.</span>
        </h2>
        <p className="l-body l-rise" data-reveal>
          We get it. The brief is in the group chat, the slides are somewhere in your downloads, and the deadline
          lives in someone else’s memory. Noto puts it all in one place: every assignment with its subject, due date
          and priority, every set of notes filed by subject, and a dashboard that tells you what’s due next.
        </p>
      </div>

      <div className={`l-flip ${flipped ? 'is-flipped' : ''}`}>
        <MarginNote
          className="l-note-before"
          text="where is the PDF??"
          arrow={{ '--arrow-rot': '-20deg' }}
        />
        <div className="l-flip-tilt">
          <FlipCard flipped={flipped} setFlipped={setFlipped} />
        </div>
        <MarginNote
          className="l-note-after"
          text="oh. there it is."
          arrow={{ '--arrow-sy': -1 }}
        />
        <p className="l-flip-hint" aria-hidden="true">
          <span className="l-hint-hover">Hover to tidy up</span>
          <span className="l-hint-tap">Tap to tidy up</span>
        </p>
      </div>
    </section>
  );
}
