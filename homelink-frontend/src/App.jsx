import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import ModifierAnnonce from './pages/ModifierAnnonce'
import Annonces from './pages/Annonces'
import DetailAnnonce from './pages/DetailAnnonce'
import Profil from './pages/Profil'
import PublierAnnonce from './pages/PublierAnnonce'
import Admin from './pages/Admin'
import Messages from './pages/Messages'
import Favoris from './pages/Favoris'

// Utilitaire pour lire le user sans crash si JSON corrompu
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}

// Route protégée : redirige vers /login si pas de token
function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  if (role) {
    const user = getUser()
    if (user.role !== role) return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/annonces" element={<Annonces />} />
        <Route path="/annonces/:id" element={<DetailAnnonce />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/modifier-annonce/:id" element={
          <ProtectedRoute role="proprietaire"><ModifierAnnonce /></ProtectedRoute>
        } />

        <Route path="/profil" element={
          <ProtectedRoute><Profil /></ProtectedRoute>
        } />
        <Route path="/publier" element={
          <ProtectedRoute role="proprietaire"><PublierAnnonce /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="administrateur"><Admin /></ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute><Messages /></ProtectedRoute>
        } />
        <Route path="/favoris" element={
          <ProtectedRoute role="locataire"><Favoris /></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
