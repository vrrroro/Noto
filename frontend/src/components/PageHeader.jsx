// A fine vine underlines every page title and ends in Noto's dot.
export default function PageHeader({ title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <svg className="page-vine" viewBox="0 0 320 24" aria-hidden="true" focusable="false">
          <path d="M0 14 C 36 2, 64 24, 104 13 S 172 1, 214 12 S 282 24, 312 11" />
          <circle cx="312" cy="11" r="4" />
        </svg>
        {description && <p className="text-muted">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
