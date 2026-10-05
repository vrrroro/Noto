export default function LoadingSpinner({ size = 28 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}
