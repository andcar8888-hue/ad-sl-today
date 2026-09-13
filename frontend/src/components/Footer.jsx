import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink bg-ink px-4 py-6 text-center text-sm text-gray-300">
      <p>
        AD <span className="text-primary-light">SL</span> Today &mdash; Sri Lanka&apos;s family-friendly
        classifieds platform.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} AD SL Today. All rights reserved.
      </p>
      <nav className="mx-auto mt-4 flex max-w-xs items-center justify-center gap-3 border-t border-ink-light pt-4 text-xs text-gray-400">
        <Link to="/terms" className="hover:text-white hover:underline">
          Terms &amp; Conditions
        </Link>
        <span aria-hidden="true" className="text-gray-600">
          &middot;
        </span>
        <Link to="/privacy" className="hover:text-white hover:underline">
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
}
