import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-3xl font-bold text-ink">404</h1>
      <p className="text-gray-500">Page not found.</p>
      <Link to="/" className="text-primary hover:underline">
        Back to Home
      </Link>
    </div>
  );
}
