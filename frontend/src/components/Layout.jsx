import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <Navbar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 xl:px-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
