import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [statut, setStatut] = useState('chargement') // 'chargement' | 'succes' | 'erreur'
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatut('erreur')
      setMessage('Lien de confirmation invalide.')
      return
    }
    api.get(`/verify-email?token=${token}`)
      .then(res => {
        setStatut('succes')
        setMessage(res.data.message)
      })
      .catch(err => {
        setStatut('erreur')
        setMessage(err.response?.data?.message || 'Lien invalide ou déjà utilisé.')
      })
  }, [])

  return (
    <div style={styles.page}>
      <div style={styles.card} className="auth-card">
        {statut === 'chargement' && (
          <>
            <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '16px' }}>⏳</div>
            <h1 style={styles.titre}>Vérification en cours…</h1>
            <p style={styles.sousTitre}>Veuillez patienter.</p>
          </>
        )}

        {statut === 'succes' && (
          <>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '16px' }}>✅</div>
            <h1 style={{ ...styles.titre, color: '#166534' }}>Email confirmé !</h1>
            <p style={styles.sousTitre}>{message}</p>
            <Link to="/login" style={styles.btn}>Se connecter →</Link>
          </>
        )}

        {statut === 'erreur' && (
          <>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '16px' }}>❌</div>
            <h1 style={{ ...styles.titre, color: '#dc2626' }}>Lien invalide</h1>
            <p style={styles.sousTitre}>{message}</p>
            <Link to="/register" style={styles.btn}>Créer un nouveau compte</Link>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8', padding: '40px 16px' },
  card: { background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #E5DDD4', width: '100%', maxWidth: '440px', textAlign: 'center' },
  titre: { fontSize: '1.5rem', fontWeight: '800', color: '#1C1409', marginBottom: '12px' },
  sousTitre: { color: '#6B5E4C', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' },
  btn: { display: 'inline-block', backgroundColor: '#E8572A', color: '#fff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' },
}

export default VerifyEmail
