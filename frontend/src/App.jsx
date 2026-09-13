import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import AdDetails from './pages/AdDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import PostAd from './pages/PostAd';
import EditAd from './pages/EditAd';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Favourites from './pages/Favourites';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/ads/:id" element={<AdDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Favourites has no server-side auth requirement — it works for
                guests too via a localStorage "guest" namespace. */}
            <Route path="/favourites" element={<Favourites />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/post-ad" element={<PostAd />} />
              <Route path="/checkout/:adId" element={<Checkout />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-ads/:id/edit" element={<EditAd />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
