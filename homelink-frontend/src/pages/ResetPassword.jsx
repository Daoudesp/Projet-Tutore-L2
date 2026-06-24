import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')

    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (motDePasse !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas')
      return
    }
    if (!token) {
      setErreur('Lien invalide. Faites une nouvelle demande.')
      return
    }

    try {
      await api.post('/reset-password', { token, mot_de_passe: motDePasse })
      setSucces(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur. Le lien est peut-être expiré.')
    }
  }

  if (succes) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px', textAlign: 'center' }}>✅</div>
          <h1 style={styles.titre}>Mot de passe modifié</h1>
          <p style={{ color: '#6B5E4C', textAlign: 'center', fontSize: '0.95rem' }}>
            Redirection vers la connexion…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', textAlign: 'center' }}>🔒</div>
        <h1 style={styles.titre}>Nouveau mot de passe</h1>
        <p style={{ color: '#6B5E4C', marginBottom: '28px', fontSize: '0.9rem', textAlign: 'center' }}>
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        {!token && (
          <div style={styles.erreur}>
            Lien invalide. <Link to="/forgot-password" style={{ color: '#E8572A' }}>Faire une nouvelle demande</Link>
          </div>
        )}

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Nouveau mot de passe</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Minimum 6 caractères"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Confirmer</label>
            <input
              style={{
                ...styles.input,
                borderColor: confirmation && motDePasse !== confirmation ? '#dc2626'
                  : confirmation && motDePasse === confirmation ? '#16a34a' : '#E5DDD4'
              }}
              type="password"
              placeholder="Répétez le mot de passe"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.btn} disabled={!token}>
            Enregistrer le nouveau mot de passe
          </button>
        </form>

        <Link to="/login" style={styles.retour}>← Retour à la connexion</Link>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8', padding: '40px 16px' },
  card: { background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #E5DDD4', width: '100%', maxWidth: '440px' },
  titre: { fontSize: '1.5rem', fontWeight: '800', color: '#1C1409', marginBottom: '8px', textAlign: 'center' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  group: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #E5DDD4', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', color: '#1C1409' },
  btn: { width: '100%', backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  retour: { display: 'block', textAlign: 'center', marginTop: '20px', color: '#6B5E4C', fontSize: '0.9rem', textDecoration: 'none' },
}

export default ResetPassword
