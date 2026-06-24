import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState('')
  const [demoToken, setDemoToken] = useState(null)
  const [envoye, setEnvoye] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      const res = await api.post('/forgot-password', { email })
      setEnvoye(true)
      if (res.data.demo_token) {
        setDemoToken(res.data.demo_token)
      }
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur. Veuillez réessayer.')
    }
  }

  if (envoye) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center' }}>📧</div>
          <h1 style={styles.titre}>Demande envoyée</h1>
          <p style={{ color: '#6B5E4C', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Si cet email est enregistré, un lien de réinitialisation a été généré.
          </p>

          {demoToken && (
            <div style={styles.demoBox}>
              <p style={{ fontWeight: '700', color: '#92400E', marginBottom: '10px', fontSize: '0.85rem' }}>
                ⚠️ MODE DÉMONSTRATION — En production, ce lien serait envoyé par email :
              </p>
              <button
                style={styles.demoBtn}
                onClick={() => navigate(`/reset-password?token=${demoToken}`)}
              >
                👉 Réinitialiser mon mot de passe
              </button>
              <p style={{ color: '#92400E', fontSize: '0.75rem', marginTop: '8px' }}>
                Lien valable 30 minutes
              </p>
            </div>
          )}

          <Link to="/login" style={styles.retour}>← Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: '2rem', marginBottom: '12px', textAlign: 'center' }}>🔑</div>
        <h1 style={styles.titre}>Mot de passe oublié</h1>
        <p style={{ color: '#6B5E4C', marginBottom: '28px', fontSize: '0.9rem' }}>
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Adresse email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.btn}>Envoyer le lien</button>
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
  demoBox: { backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '16px', marginBottom: '20px' },
  demoBtn: { width: '100%', backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
}

export default ForgotPassword
