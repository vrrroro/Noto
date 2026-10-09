import { Link } from 'react-router-dom';
import Icon from '../Icon.jsx';

// The circle-to-pill button: a label followed by a 40px circle with an arrow.
// On hover or focus the circle's background stretches left under the label.
// Variants: "ink" (purple circle, white arrow), "hot" (Noto-orange circle, ink arrow),
// "solid" (already a filled purple pill; turns orange on hover).
export default function IconButton({ to, href, onClick, children, variant = 'ink', icon = 'arrowRight', className = '', ...rest }) {
  const classes = `l-ib l-ib-${variant} ${className}`;
  const content = (
    <>
      <span className="l-ib-label">{children}</span>
      <span className="l-ib-icon" aria-hidden="true">
        <Icon name={icon} size={17} />
      </span>
      <span className="l-ib-bg" aria-hidden="true" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={classes} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}

// The tiny uppercase section label in a grey chip. Sticky on desktop.
export function UpperTitle({ children }) {
  return (
    <div className="l-upper-wrap">
      <p className="l-upper">{children}</p>
    </div>
  );
}
