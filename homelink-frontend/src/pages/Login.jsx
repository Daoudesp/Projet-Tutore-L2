import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const reponse = await api.post('/connexion', {
        email: email,
        mot_de_passe: motDePasse
      })
      // Sauvegarder le token et les infos utilisateur
      localStorage.setItem('token', reponse.data.token)
      localStorage.setItem('user', JSON.stringify(reponse.data.utilisateur))
      navigate('/')
    } catch (err) {
      setErreur('Email ou mot de passe incorrect')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card} className="auth-card">
        <h1 style={styles.titre}>Connexion</h1>
        <p style={styles.sousTitre}>Accédez à votre compte HomeLink</p>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              style={styles.input}
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Votre mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.btn}>Se connecter</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.88rem' }}>
          <Link to="/forgot-password" style={{ color: '#E8572A', textDecoration: 'none' }}>
            Mot de passe oublié ?
          </Link>
        </p>

        <p style={styles.footer}>
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  card: { background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '440px' },
  titre: { fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  sousTitre: { color: '#6b7280', marginBottom: '32px' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px' },
  group: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' },
  btn: { width: '100%', backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '0.9rem' },
}

export default Login