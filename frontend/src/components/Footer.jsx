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
    </footer>
  );
}
