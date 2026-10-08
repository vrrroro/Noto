import { useState } from 'react';
import MarginNote from './MarginNote.jsx';
import { LOG_LINES, SERVICES } from './content.js';

// CloudWatch has no Noto screen of its own, so it shows the backend's real log lines.
function LogScreen() {
  return (
    <div className="l-logs">
      <p className="l-logs-title">/aws/lambda/student-cloud-manager-assignments-dev</p>
      {LOG_LINES.map(([level, message, route], i) => (
        <p key={i} className="l-logs-line">
          {`{"level":"${level}","message":"${message}","route":"${route}"}`}
        </p>
      ))}
    </div>
  );
}

// "Show your work": the AWS services behind Noto as a stack of ghost names.
// Hovering, focusing or tapping one makes it the headline, tilts in the part
// of Noto it powers, and swings down a short brief.
export default function StackSection() {
  const [active, setActive] = useState(null);
  const service = active === null ? null : SERVICES[active];

  return (
    <section
      className="l-panel l-deal l-stack"
      data-tone="light"
      style={{ '--deal-tilt': '-0.7deg' }}
      aria-labelledby="l-stack-title"
    >
      <div className="l-heading" data-lag>
        <p className="l-eyebrow">Under the hood</p>
        <h2 id="l-stack-title" className="l-mega">
          Mind if we show our work?
        </h2>
      </div>

      <p className="l-stack-hint">Tap a service to see what it does</p>
      <div
        className="l-stack-body"
        onMouseLeave={() => setActive(null)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setActive(null)}
      >
        <ul className="l-stack-list">
          {SERVICES.map((s, i) => (
            <li key={s.name}>
              <button
                type="button"
                className="l-stack-name"
                aria-expanded={active === i}
                aria-controls="l-stack-brief"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span>{s.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {!service && <MarginNote className="l-note-pick" text="pick one" arrow={{ '--arrow-rot': '100deg' }} />}

        {service && (
          <div key={service.name} className="l-stack-screen" aria-hidden="true">
            <p className="l-stack-tag">{service.nickname}</p>
            <div className="l-stack-frame">{service.image ? <img src={service.image} alt="" /> : <LogScreen />}</div>
          </div>
        )}

        <div id="l-stack-brief" className="l-stack-brief" aria-live="polite">
          {service && (
            <div key={service.name} className="l-stack-brief-inner">
              <p className="l-card-heading">What {service.name} does in Noto</p>
              <p>{service.does}</p>
              <p className="l-card-heading">You meet it</p>
              <p>{service.when}</p>
              {service.alt && <p className="visually-hidden">Pictured: {service.alt}.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
