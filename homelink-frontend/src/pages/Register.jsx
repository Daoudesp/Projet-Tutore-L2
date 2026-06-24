import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Register() {
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role: 'locataire'
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/inscription', form)
      navigate('/login')
    } catch (err) {
      setErreur('Cet email est déjà utilisé')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.titre}>Créer un compte</h1>
        <p style={styles.sousTitre}>Rejoignez la plateforme HomeLink</p>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Prénom</label>
              <input style={styles.input} type="text" name="prenom" placeholder="Votre prénom" value={form.prenom} onChange={handleChange} required />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Nom</label>
              <input style={styles.input} type="text" name="nom" placeholder="Votre nom" value={form.nom} onChange={handleChange} required />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" name="email" placeholder="exemple@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.input} type="tel" name="telephone" placeholder="77 000 00 00" value={form.telephone} onChange={handleChange} />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Mot de passe</label>
            <input style={styles.input} type="password" name="mot_de_passe" placeholder="Choisissez un mot de passe" value={form.mot_de_passe} onChange={handleChange} required />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Je suis</label>
            <select style={styles.input} name="role" value={form.role} onChange={handleChange}>
              <option value="locataire">Locataire</option>
              <option value="proprietaire">Propriétaire</option>
            </select>
          </div>

          <button type="submit" style={styles.btn}>Créer mon compte</button>
        </form>

        <p style={styles.footer}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '40px 16px' },
  card: { background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px' },
  titre: { fontSize: '1.75rem', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  sousTitre: { color: '#6b7280', marginBottom: '32px' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px' },
  row: { display: 'flex', gap: '16px' },
  group: { marginBottom: '20px', flex: 1 },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box' },
  btn: { width: '100%', backgroundColor: '#1a56db', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '0.9rem' },
}

export default Register