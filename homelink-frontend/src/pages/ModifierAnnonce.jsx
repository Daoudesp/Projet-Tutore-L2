import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const TYPES = ['CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA']

function ModifierAnnonce() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    api.get(`/annonces/${id}`)
      .then(res => {
        const a = res.data
        setForm({
          titre: a.titre || '',
          description: a.description || '',
          prix: a.prix || '',
          type_logement: a.type_logement || 'STUDIO',
          adresse: a.adresse || '',
          surface: a.surface || '',
          nombre_pieces: a.nombre_pieces || '',
          nombre_salles_de_bain: a.nombre_salles_de_bain || '',
          etage: a.etage ?? 0,
          meuble: a.meuble || false,
        })
      })
      .catch(() => navigate('/profil'))
      .finally(() => setChargement(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErreur('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    if (!form.titre.trim()) { setErreur('Le titre est obligatoire'); return }
    if (!form.prix || Number(form.prix) <= 0) { setErreur('Le loyer doit être supérieur à 0'); return }
    try {
      await api.put(`/annonces/${id}`, {
        ...form,
        prix: Number(form.prix),
        surface: form.surface ? Number(form.surface) : null,
        nombre_pieces: form.nombre_pieces ? Number(form.nombre_pieces) : null,
        nombre_salles_de_bain: form.nombre_salles_de_bain ? Number(form.nombre_salles_de_bain) : null,
        etage: Number(form.etage) || 0,
      })
      setSucces(true)
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la modification')
    }
  }

  if (chargement) return <div style={{ padding: '80px', textAlign: 'center', color: '#6B5E4C' }}>Chargement…</div>

  if (succes) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', textAlign: 'center' }}>✅</div>
          <h2 style={{ color: '#1C1409', marginBottom: '12px', textAlign: 'center' }}>Annonce modifiée !</h2>
          <p style={{ color: '#6B5E4C', marginBottom: '28px', textAlign: 'center', fontSize: '0.9rem' }}>
            Votre annonce est repassée en <strong>EN_ATTENTE</strong> pour validation par l'administrateur.
          </p>
          <button style={styles.btnOrange} onClick={() => navigate('/profil')}>
            Retour à mon profil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.titre}>Modifier l'annonce</h1>
        <p style={{ color: '#6B5E4C', fontSize: '0.88rem', marginBottom: '24px' }}>
          Après modification, l'annonce sera soumise à validation.
        </p>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Type de logement</label>
            <div style={styles.typeChips}>
              {TYPES.map(t => (
                <button key={t} type="button"
                  style={{ ...styles.chip, ...(form.type_logement === t ? styles.chipActif : {}) }}
                  onClick={() => setForm({ ...form, type_logement: t })}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Titre <span style={{ color: '#E8572A' }}>*</span></label>
            <input style={styles.input} name="titre" value={form.titre} onChange={handleChange} required />
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Loyer (FCFA/mois) <span style={{ color: '#E8572A' }}>*</span></label>
              <input style={styles.input} type="number" min="1" name="prix" value={form.prix} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Surface (m²)</label>
              <input style={styles.input} type="number" min="0" name="surface" value={form.surface} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Nombre de pièces</label>
              <input style={styles.input} type="number" min="1" name="nombre_pieces" value={form.nombre_pieces} onChange={handleChange} />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Salles de bain</label>
              <input style={styles.input} type="number" min="0" name="nombre_salles_de_bain" value={form.nombre_salles_de_bain} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Étage</label>
              <input style={styles.input} type="number" min="0" name="etage" value={form.etage} onChange={handleChange} />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Adresse</label>
            <input style={styles.input} name="adresse" value={form.adresse} onChange={handleChange} />
          </div>

          <div style={styles.group}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151' }}>
              <input type="checkbox" name="meuble" checked={form.meuble} onChange={handleChange} />
              Logement meublé
            </label>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Description</label>
            <textarea style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }}
              name="description" rows={4} value={form.description} onChange={handleChange} />
          </div>

          <div style={styles.row}>
            <button type="button" style={styles.btnGris} onClick={() => navigate('/profil')}>Annuler</button>
            <button type="submit" style={styles.btnOrange}>Enregistrer les modifications</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { backgroundColor: '#FAFAF8', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '48px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5DDD4', padding: '40px', width: '100%', maxWidth: '560px' },
  titre: { fontSize: '1.6rem', fontWeight: '800', color: '#1C1409', marginBottom: '8px' },
  group: { marginBottom: '20px', flex: 1 },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #E5DDD4', borderRadius: '8px', fontSize: '0.95rem', color: '#1C1409', boxSizing: 'border-box', outline: 'none' },
  row: { display: 'flex', gap: '16px' },
  typeChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  chip: { padding: '8px 18px', borderRadius: '99px', border: '1px solid #E5DDD4', backgroundColor: '#fff', color: '#6B5E4C', cursor: 'pointer', fontSize: '0.9rem' },
  chipActif: { backgroundColor: '#E8572A', color: '#fff', borderColor: '#E8572A' },
  btnOrange: { flex: 1, backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
  btnGris: { flex: 1, backgroundColor: '#fff', color: '#6B5E4C', border: '1px solid #E5DDD4', padding: '14px', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
}

export default ModifierAnnonce
