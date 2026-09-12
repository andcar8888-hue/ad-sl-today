export default function Spinner({ className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
    />
  );
}
