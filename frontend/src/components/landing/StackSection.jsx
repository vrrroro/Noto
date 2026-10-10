import Icon from '../Icon.jsx';
import IconButton from './IconButton.jsx';
import { STACK } from './content.js';

// "Built on AWS": four tiles that share one very soft orange-to-purple tint,
// painted inside the tiles themselves (see .l-aws-card::before).
export default function StackSection() {
  return (
    <section id="aws" className="l-section l-aws" aria-labelledby="l-aws-title">
      <div className="l-container">
        <h2 id="l-aws-title" className="l-h3 l-aws-title">
          Built on AWS
        </h2>
        <p className="l-text-large l-aws-sub">Seven managed services, and not one server of our own to look after.</p>
        <div className="l-aws-stage">
          <ul className="l-aws-cards">
            {STACK.map((card, i) => (
              <li key={card.title} className="l-aws-card" style={{ '--i': i }}>
                <Icon name={card.icon} size={48} />
                <div className="l-aws-card-text">
                  <p className="l-aws-service">{card.service}</p>
                  <h3 className="l-h6">{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="l-aws-cta">
          <IconButton href="#app">See it in the app</IconButton>
        </div>
      </div>
    </section>
  );
}
