import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Annonces from './pages/Annonces'
import DetailAnnonce from './pages/DetailAnnonce'
import Profil from './pages/Profil'
import PublierAnnonce from './pages/PublierAnnonce'
import Admin from './pages/Admin'
import Messages from './pages/Messages'
import Favoris from './pages/Favoris'

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
        <Route path="/profil" element={<Profil />} />
        <Route path="/publier" element={<PublierAnnonce />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/favoris" element={<Favoris />} />
      </Routes>
    </>
  )
}

export default App
