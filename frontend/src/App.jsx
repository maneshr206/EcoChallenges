import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar       from './components/Navbar';
import Home         from './pages/Home';
import Feed         from './pages/Feed';
import ChallengeDetail from './pages/ChallengeDetail';
import SubmitProof  from './pages/SubmitProof';
import Leaderboard  from './pages/Leaderboard';
import Profile      from './pages/Profile';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Vouchers     from './pages/Vouchers';
import CreateChallenge from './pages/CreateChallenge';

// Redirect unauthenticated users to /login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-eco-50">
      <div className="flex flex-col items-center gap-3">
        <span className="text-5xl animate-bounce">🌿</span>
        <p className="text-eco-700 font-medium">Loading EcoChallenges…</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/feed"       element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/challenges/:id" element={<PrivateRoute><ChallengeDetail /></PrivateRoute>} />
          <Route path="/challenges/:id/submit" element={<PrivateRoute><SubmitProof /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/vouchers"    element={<PrivateRoute><Vouchers /></PrivateRoute>} />
          <Route path="/create"      element={<PrivateRoute><CreateChallenge /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
