import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

function Register() {
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [inscrit, setInscrit] = useState(false)
  const [emailInscrit, setEmailInscrit] = useState('')
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
    setErreur('')
  }

  const validerTelephone = (tel) => {
    if (!tel) return true
    const clean = tel.replace(/[\s\-]/g, '')
    return /^(7[0-9]{8}|33[0-9]{7})$/.test(clean)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')

    if (form.mot_de_passe.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (form.mot_de_passe !== confirmation) {
      setErreur('Les mots de passe ne correspondent pas')
      return
    }
    if (!validerTelephone(form.telephone)) {
      setErreur('Numéro de téléphone invalide (ex: 77 123 45 67 ou 33 123 45 67)')
      return
    }

    try {
      await api.post('/inscription', form)
      setEmailInscrit(form.email)
      setInscrit(true)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création du compte')
    }
  }

  const forcePassword = form.mot_de_passe.length > 0 && form.mot_de_passe.length < 6

  if (inscrit) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '16px' }}>📧</div>
          <h1 style={{ ...styles.titre, textAlign: 'center' }}>Vérifiez votre email !</h1>
          <p style={{ color: '#6B5E4C', textAlign: 'center', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '8px' }}>
            Un email de confirmation a été envoyé à <strong>{emailInscrit}</strong>.
          </p>
          <p style={{ color: '#9B8E83', textAlign: 'center', fontSize: '0.85rem', marginBottom: '28px' }}>
            Cliquez sur le lien dans l'email pour activer votre compte avant de vous connecter.
          </p>
          <Link to="/login" style={{ display: 'block', textAlign: 'center', color: '#E8572A', fontWeight: '600', textDecoration: 'none' }}>
            Aller à la connexion →
          </Link>
        </div>
      </div>
    )
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
            <label style={styles.label}>Téléphone <span style={{ color: '#9B8E83', fontWeight: 400 }}>(optionnel)</span></label>
            <input style={styles.input} type="tel" name="telephone" placeholder="77 000 00 00" value={form.telephone} onChange={handleChange} />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Mot de passe</label>
            <input
              style={{ ...styles.input, borderColor: forcePassword ? '#dc2626' : '#e5e7eb' }}
              type="password"
              name="mot_de_passe"
              placeholder="Minimum 6 caractères"
              value={form.mot_de_passe}
              onChange={handleChange}
              required
            />
            {forcePassword && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                Au moins 6 caractères
              </p>
            )}
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Confirmer le mot de passe</label>
            <input
              style={{
                ...styles.input,
                borderColor: confirmation && form.mot_de_passe !== confirmation ? '#dc2626'
                  : confirmation && form.mot_de_passe === confirmation ? '#16a34a' : '#e5e7eb'
              }}
              type="password"
              placeholder="Répétez le mot de passe"
              value={confirmation}
              onChange={(e) => { setConfirmation(e.target.value); setErreur('') }}
              required
            />
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
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF8', padding: '40px 16px' },
  card: { background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #E5DDD4', width: '100%', maxWidth: '480px' },
  titre: { fontSize: '1.75rem', fontWeight: '800', color: '#1C1409', marginBottom: '4px' },
  sousTitre: { color: '#6B5E4C', marginBottom: '32px' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  row: { display: 'flex', gap: '16px' },
  group: { marginBottom: '20px', flex: 1 },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', color: '#1C1409' },
  btn: { width: '100%', backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: '24px', color: '#6b7280', fontSize: '0.9rem' },
}

export default Register
