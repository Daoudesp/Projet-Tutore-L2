import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Profil() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '' })
  const [annonces, setAnnonces] = useState([])
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmSuppr, setConfirmSuppr] = useState(false)
  const [supprErreur, setSupprErreur] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    // Charger les vraies données depuis le backend (inclut le téléphone)
    api.get('/profil').then(res => {
      const data = res.data
      setForm({
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        telephone: data.telephone || '',
      })
    }).catch(() => {})
    if (user.role === 'proprietaire') {
      api.get('/profil/annonces').then(res => {
        setAnnonces(res.data)
      }).catch(() => {})
    }
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validerTelephone = (tel) => {
    if (!tel) return true
    const clean = tel.replace(/[\s\-]/g, '')
    return /^(7[0-9]{8}|33[0-9]{7})$/.test(clean)
  }

  const handleChangerStatut = async (annonceId, statut) => {
    try {
      await api.put(`/annonces/${annonceId}/statut`, { statut })
      const res = await api.get('/profil/annonces')
      setAnnonces(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const handleSupprimerAnnonce = async (annonceId) => {
    if (!window.confirm('Supprimer cette annonce définitivement ?')) return
    try {
      await api.delete(`/annonces/${annonceId}`)
      setAnnonces(annonces.filter(a => a.id !== annonceId))
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const handleSupprimerCompte = async () => {
    setSupprErreur('')
    try {
      await api.delete('/profil')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    } catch (err) {
      setSupprErreur(err.response?.data?.message || 'Erreur lors de la suppression')
      setConfirmSuppr(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!validerTelephone(form.telephone)) {
      setErreur('Numéro invalide. Format attendu : 77 123 45 67 ou 33 123 45 67')
      return
    }
    try {
      await api.put('/profil', form)
      localStorage.setItem('user', JSON.stringify({ ...user, ...form }))
      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
    } catch (err) {
      setErreur('Erreur lors de la mise à jour')
    }
  }

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={styles.container}>

        {/* EN-TÊTE PROFIL */}
        <div style={styles.profilHeader}>
          <div style={styles.avatar}>
            {(user.prenom || 'U')[0]}{(user.nom || 'U')[0]}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1C1409', margin: 0 }}>
              {user.prenom} {user.nom}
            </h1>
            <span style={styles.roleBadge}>
              {user.role === 'proprietaire' ? 'Propriétaire'
                : user.role === 'administrateur' ? 'Administrateur'
                : 'Locataire'}
            </span>
          </div>
        </div>

        <div style={styles.layout}>

          {/* FORMULAIRE */}
          <div style={styles.card}>
            <h2 style={styles.cardTitre}>Mes informations</h2>

            {succes && <div style={styles.successBox}>✅ Profil mis à jour avec succès.</div>}
            {erreur && <div style={styles.erreurBox}>{erreur}</div>}

            <form onSubmit={handleSubmit}>
              <div style={styles.row}>
                <div style={styles.group}>
                  <label style={styles.label}>Prénom</label>
                  <input style={styles.input} name="prenom" value={form.prenom} onChange={handleChange} required />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Nom</label>
                  <input style={styles.input} name="nom" value={form.nom} onChange={handleChange} required />
                </div>
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Email</label>
                <input style={{ ...styles.input, backgroundColor: '#F5F0E8', color: '#9B8E83' }} name="email" value={form.email} disabled />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>Téléphone</label>
                <input style={styles.input} name="telephone" value={form.telephone} onChange={handleChange} placeholder="77 000 00 00" />
              </div>
              <button type="submit" style={styles.btnOrange}>Enregistrer les modifications</button>
            </form>
          </div>

          {/* MES ANNONCES (propriétaire) */}
          {user.role === 'proprietaire' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitre}>Mes annonces</h2>
              {annonces.length === 0 ? (
                <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>
                  Vous n'avez pas encore publié d'annonce.{' '}
                  <span style={{ color: '#E8572A', cursor: 'pointer' }} onClick={() => navigate('/publier')}>
                    Publier maintenant →
                  </span>
                </p>
              ) : (
                annonces.map(a => (
                  <div key={a.id} style={styles.annonceRow}>
                    <div style={styles.miniImg} onClick={() => navigate(`/annonces/${a.id}`)} />
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/annonces/${a.id}`)}>
                      <p style={{ fontWeight: '600', color: '#1C1409', margin: '0 0 4px', fontSize: '0.9rem' }}>{a.titre}</p>
                      <p style={{ color: '#6B5E4C', fontSize: '0.82rem', margin: 0 }}>
                        {Number(a.prix).toLocaleString('fr-FR')} FCFA/mois
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{
                        ...styles.statutBadge,
                        backgroundColor: a.statut === 'PUBLIEE' ? '#DCFCE7' : a.statut === 'LOUEE' ? '#DBEAFE' : '#FEF9C3',
                        color: a.statut === 'PUBLIEE' ? '#166534' : a.statut === 'LOUEE' ? '#1E40AF' : '#854D0E',
                      }}>
                        {a.statut === 'LOUEE' ? 'Louée' : a.statut === 'PUBLIEE' ? 'Publiée' : a.statut === 'SUSPENDUE' ? 'Suspendue' : 'En attente'}
                      </span>
                      {a.statut === 'PUBLIEE' && (
                        <button style={styles.btnAction} onClick={() => handleChangerStatut(a.id, 'LOUEE')}>
                          🔒 Marquer louée
                        </button>
                      )}
                      {a.statut === 'LOUEE' && (
                        <button style={styles.btnAction} onClick={() => handleChangerStatut(a.id, 'PUBLIEE')}>
                          🔓 Re-publier
                        </button>
                      )}
                      <button style={styles.btnSupprAnnonce} onClick={() => handleSupprimerAnnonce(a.id)}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ZONE DANGER — SUPPRESSION DE COMPTE */}
        {user.role !== 'administrateur' && (
          <div style={styles.dangerZone}>
            <h3 style={{ color: '#991B1B', fontWeight: '700', margin: '0 0 8px', fontSize: '1rem' }}>
              Zone dangereuse
            </h3>
            <p style={{ color: '#6B5E4C', fontSize: '0.88rem', margin: '0 0 16px' }}>
              La suppression de votre compte est irréversible. Toutes vos données seront effacées définitivement.
            </p>
            {supprErreur && <p style={{ color: '#dc2626', fontSize: '0.88rem', marginBottom: '12px' }}>{supprErreur}</p>}
            {!confirmSuppr ? (
              <button onClick={() => setConfirmSuppr(true)} style={styles.btnDanger}>
                Supprimer mon compte
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={handleSupprimerCompte} style={styles.btnDangerConfirm}>
                  Oui, supprimer définitivement
                </button>
                <button onClick={() => setConfirmSuppr(false)} style={styles.btnAnnuler}>
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  profilHeader: {
    display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px',
  },
  avatar: {
    width: '64px', height: '64px', borderRadius: '50%',
    backgroundColor: '#E8572A', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '1.3rem',
  },
  roleBadge: {
    display: 'inline-block', backgroundColor: '#FDE8DF', color: '#E8572A',
    fontSize: '0.8rem', fontWeight: '600', padding: '4px 12px',
    borderRadius: '99px', marginTop: '6px',
  },
  layout: { display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  card: {
    flex: 1, minWidth: '300px', backgroundColor: '#fff',
    border: '1px solid #E5DDD4', borderRadius: '14px', padding: '28px',
  },
  cardTitre: { fontSize: '1.1rem', fontWeight: '700', color: '#1C1409', marginBottom: '24px' },
  row: { display: 'flex', gap: '16px' },
  group: { marginBottom: '18px', flex: 1 },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.88rem' },
  input: { width: '100%', padding: '11px', border: '1px solid #E5DDD4', borderRadius: '8px', fontSize: '0.95rem', color: '#1C1409', boxSizing: 'border-box', outline: 'none' },
  btnOrange: { width: '100%', backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
  successBox: { backgroundColor: '#DCFCE7', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' },
  erreurBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '16px' },
  annonceRow: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 0', borderBottom: '1px solid #F3EDE6', cursor: 'pointer',
  },
  miniImg: { width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#E8DDD4', flexShrink: 0 },
  statutBadge: { fontSize: '0.72rem', fontWeight: '700', padding: '4px 10px', borderRadius: '99px' },
  btnAction: {
    fontSize: '0.72rem', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid #E5DDD4', background: '#fff', cursor: 'pointer', color: '#1C1409',
  },
  btnSupprAnnonce: {
    fontSize: '0.72rem', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
    border: '1px solid #FECACA', background: '#FFF5F5', cursor: 'pointer', color: '#dc2626',
  },
  dangerZone: {
    marginTop: '32px', border: '1px solid #FECACA', borderRadius: '14px',
    padding: '24px', backgroundColor: '#FFF5F5',
  },
  btnDanger: {
    backgroundColor: 'transparent', border: '2px solid #dc2626', color: '#dc2626',
    padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
  },
  btnDangerConfirm: {
    backgroundColor: '#dc2626', color: '#fff', border: 'none',
    padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
  },
  btnAnnuler: {
    backgroundColor: '#F3EDE6', color: '#1C1409', border: 'none',
    padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem',
  },
}

export default Profil