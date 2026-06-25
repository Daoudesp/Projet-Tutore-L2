import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoye, setEnvoye] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      await api.post('/forgot-password', { email })
      setEnvoye(true)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur. Veuillez réessayer.')
    }
  }

  if (envoye) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', textAlign: 'center' }}>📧</div>
          <h1 style={styles.titre}>Email envoyé !</h1>
          <p style={{ color: '#6B5E4C', marginBottom: '8px', fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'center' }}>
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
          </p>
          <p style={{ color: '#9B8E83', fontSize: '0.85rem', textAlign: 'center', marginBottom: '24px' }}>
            Vérifiez votre boîte mail. Le lien est valable 30 minutes.
          </p>
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
}

export default ForgotPassword
