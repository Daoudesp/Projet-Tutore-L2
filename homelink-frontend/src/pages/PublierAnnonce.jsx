import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const TYPES = ['CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA']

function PublierAnnonce() {
  const navigate = useNavigate()
  const [etape, setEtape] = useState(1)
  const [quartiers, setQuartiers] = useState([])
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [annonceId, setAnnonceId] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploadEnCours, setUploadEnCours] = useState(false)

  const [form, setForm] = useState({
    titre: '',
    description: '',
    prix: '',
    type_logement: 'STUDIO',
    quartier_id: '',
    adresse: '',
    surface: '',
    nombre_pieces: '',
    etage: '0',
    meuble: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user.role !== 'proprietaire') { navigate('/'); return }
    api.get('/quartiers').then(res => setQuartiers(res.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setErreur('')
  }

  const validerEtape1 = () => {
    if (!form.quartier_id) { setErreur('Veuillez choisir un quartier'); return }
    setErreur(''); setEtape(2)
  }

  const validerEtape2 = () => {
    if (!form.titre.trim()) { setErreur('Le titre de l\'annonce est obligatoire'); return }
    if (!form.prix || Number(form.prix) <= 0) { setErreur('Le loyer doit être supérieur à 0 FCFA'); return }
    if (!form.nombre_pieces || Number(form.nombre_pieces) < 1) { setErreur('Le nombre de pièces est obligatoire (min. 1)'); return }
    if (!form.description.trim()) { setErreur('La description est obligatoire'); return }
    setErreur(''); setEtape(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErreur('')
    try {
      const res = await api.post('/annonces', {
        ...form,
        prix: Number(form.prix),
        surface: Number(form.surface),
        nombre_pieces: Number(form.nombre_pieces),
        etage: Number(form.etage),
        quartier_id: Number(form.quartier_id),
      })
      setAnnonceId(res.data.annonce_id)
      setEtape(4) // étape upload photos
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la publication')
    }
  }

  const handleUploadPhoto = async (e) => {
    const fichier = e.target.files[0]
    if (!fichier || !annonceId) return
    setUploadEnCours(true)
    try {
      const formData = new FormData()
      formData.append('photo', fichier)
      await api.post(`/photos/${annonceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPhotos(prev => [...prev, URL.createObjectURL(fichier)])
    } catch {
      alert('Erreur lors de l\'upload de la photo')
    } finally {
      setUploadEnCours(false)
    }
  }

  if (succes) {
    return (
      <div style={styles.page}>
        <div style={styles.card} className="auth-card">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#1C1409', marginBottom: '12px' }}>Annonce soumise !</h2>
          <p style={{ color: '#6B5E4C', marginBottom: '28px' }}>
            Votre annonce est en statut <strong>EN_ATTENTE</strong>. Un administrateur
            la vérifiera avant sa mise en ligne.
          </p>
          <button style={styles.btnOrange} onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.titre}>Publier une annonce</h1>

        {/* ÉTAPES */}
        <div style={styles.etapesRow}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={styles.etapeItem}>
              <div style={{ ...styles.etapeBulle, ...(etape >= n ? styles.etapeBulleActive : {}) }}>
                {n}
              </div>
              <span style={{ fontSize: '0.78rem', color: etape >= n ? '#E8572A' : '#9B8E83' }}>
                {n === 1 ? 'Localisation' : n === 2 ? 'Détails' : n === 3 ? 'Confirmation' : 'Photos'}
              </span>
              {n < 4 && <div style={{ ...styles.etapeLigne, ...(etape > n ? styles.etapeLigneActive : {}) }} />}
            </div>
          ))}
        </div>

        {erreur && <p style={styles.erreur}>{erreur}</p>}

        <form onSubmit={handleSubmit}>

          {/* ÉTAPE 1 : TYPE + LOCALISATION */}
          {etape === 1 && (
            <div>
              <p style={styles.etapeLabel}>Étape 1/3 · Type & Localisation</p>

              <div style={styles.group}>
                <label style={styles.label}>Type de logement</label>
                <div style={styles.typeChips}>
                  {TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      style={{ ...styles.chip, ...(form.type_logement === t ? styles.chipActif : {}) }}
                      onClick={() => setForm({ ...form, type_logement: t })}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Quartier <span style={styles.reqStar}>*</span></label>
                <select style={styles.input} name="quartier_id" value={form.quartier_id} onChange={handleChange}>
                  <option value="">Choisir un quartier</option>
                  {quartiers.map(q => (
                    <option key={q.id} value={q.id}>{q.nom}</option>
                  ))}
                </select>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Adresse</label>
                <input style={styles.input} name="adresse" placeholder="Rue de Fann, Point E" value={form.adresse} onChange={handleChange} />
              </div>

              <button type="button" style={styles.btnOrange} onClick={validerEtape1}>
                Continuer →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : DÉTAILS + PRIX */}
          {etape === 2 && (
            <div>
              <p style={styles.etapeLabel}>Étape 2/3 · Détails du logement</p>

              <div style={styles.group}>
                <label style={styles.label}>Titre de l'annonce <span style={styles.reqStar}>*</span></label>
                <input style={styles.input} name="titre" placeholder="Studio meublé proche UCAD" value={form.titre} onChange={handleChange} />
              </div>

              <div style={styles.row}>
                <div style={styles.group}>
                  <label style={styles.label}>Loyer (FCFA/mois) <span style={styles.reqStar}>*</span></label>
                  <input style={styles.input} type="number" min="1" name="prix" placeholder="125 000" value={form.prix} onChange={handleChange} />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Surface (m²)</label>
                  <input style={styles.input} type="number" min="0" name="surface" placeholder="25" value={form.surface} onChange={handleChange} />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.group}>
                  <label style={styles.label}>Nombre de pièces <span style={styles.reqStar}>*</span></label>
                  <input style={styles.input} type="number" min="1" name="nombre_pieces" placeholder="1" value={form.nombre_pieces} onChange={handleChange} />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Étage</label>
                  <input style={styles.input} type="number" min="0" name="etage" placeholder="0" value={form.etage} onChange={handleChange} />
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.checkboxRow}>
                  <input type="checkbox" name="meuble" checked={form.meuble} onChange={handleChange} />
                  <span style={{ marginLeft: '8px' }}>Logement meublé</span>
                </label>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Description <span style={styles.reqStar}>*</span></label>
                <textarea style={{ ...styles.input, resize: 'vertical', fontFamily: 'inherit' }} name="description" rows={4} placeholder="Décrivez votre logement, l'environnement, les équipements…" value={form.description} onChange={handleChange} />
              </div>

              <div style={styles.infoBox}>
                🔍 Votre annonce sera <strong>vérifiée par un administrateur</strong> avant sa mise en ligne.
              </div>

              <div style={styles.row}>
                <button type="button" style={styles.btnGris} onClick={() => setEtape(1)}>← Retour</button>
                <button type="button" style={styles.btnOrange} onClick={validerEtape2}>Continuer →</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : RÉCAPITULATIF */}
          {etape === 3 && (
            <div>
              <p style={styles.etapeLabel}>Étape 3/3 · Confirmation</p>

              <div style={styles.recapCard}>
                <div style={styles.recapRow}><span>Type</span><strong>{form.type_logement}</strong></div>
                <div style={styles.recapRow}><span>Titre</span><strong>{form.titre}</strong></div>
                <div style={styles.recapRow}>
                  <span>Quartier</span>
                  <strong>{quartiers.find(q => q.id == form.quartier_id)?.nom || '–'}</strong>
                </div>
                <div style={styles.recapRow}>
                  <span>Loyer</span>
                  <strong style={{ color: '#E8572A' }}>
                    {Number(form.prix).toLocaleString('fr-FR')} FCFA/mois
                  </strong>
                </div>
                <div style={styles.recapRow}><span>Surface</span><strong>{form.surface} m²</strong></div>
                <div style={styles.recapRow}><span>Meublé</span><strong>{form.meuble ? 'Oui' : 'Non'}</strong></div>
              </div>

              <div style={styles.infoBox}>
                🔍 Votre annonce sera <strong>vérifiée par un administrateur</strong> avant sa mise en ligne.
              </div>

              <div style={styles.row}>
                <button type="button" style={styles.btnGris} onClick={() => setEtape(2)}>← Retour</button>
                <button type="submit" style={styles.btnOrange}>Soumettre pour validation</button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : PHOTOS */}
          {etape === 4 && (
            <div>
              <p style={styles.etapeLabel}>Étape 4/4 · Photos du logement</p>

              <div style={styles.photosGrid}>
                {photos.map((url, i) => (
                  <div key={i} style={styles.photoPreview}>
                    <img src={url} alt={`photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                {photos.length < 5 && (
                  <label style={styles.photoAjouter}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadPhoto}
                      disabled={uploadEnCours}
                    />
                    <span style={{ fontSize: '1.5rem' }}>📷</span>
                    <span style={{ fontSize: '0.8rem', color: '#6B5E4C', marginTop: '4px' }}>
                      {uploadEnCours ? 'Envoi…' : 'Ajouter'}
                    </span>
                  </label>
                )}
              </div>

              <p style={{ color: '#6B5E4C', fontSize: '0.85rem', marginBottom: '8px' }}>
                Ajoutez jusqu'à 5 photos · <strong style={{ color: '#E8572A' }}>Au moins 1 photo obligatoire.</strong>
              </p>

              {photos.length === 0 && (
                <p style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  ⚠️ Veuillez ajouter au moins une photo avant de terminer.
                </p>
              )}

              <div style={styles.infoBox}>
                🔍 Votre annonce sera <strong>vérifiée par un administrateur</strong> avant sa mise en ligne.
              </div>

              <div style={styles.row}>
                {photos.length === 0 && (
                  <button
                    type="button"
                    style={styles.btnGris}
                    onClick={async () => {
                      if (annonceId) {
                        try { await api.delete(`/annonces/${annonceId}`) } catch {}
                      }
                      navigate('/')
                    }}
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="button"
                  style={{ ...styles.btnOrange, opacity: photos.length === 0 ? 0.5 : 1, cursor: photos.length === 0 ? 'not-allowed' : 'pointer' }}
                  onClick={() => { if (photos.length === 0) return; setSucces(true) }}
                >
                  {uploadEnCours ? 'Upload en cours…' : 'Terminer'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { backgroundColor: '#FAFAF8', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '48px 24px' },
  card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5DDD4', padding: '40px', width: '100%', maxWidth: '560px' },
  titre: { fontSize: '1.6rem', fontWeight: '800', color: '#1C1409', marginBottom: '28px' },
  etapesRow: { display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '0' },
  etapeItem: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1 },
  etapeBulle: {
    width: '28px', height: '28px', borderRadius: '50%',
    backgroundColor: '#E5DDD4', color: '#9B8E83',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', fontWeight: '700', flexShrink: 0,
  },
  etapeBulleActive: { backgroundColor: '#E8572A', color: '#fff' },
  etapeLigne: { flex: 1, height: '2px', backgroundColor: '#E5DDD4' },
  etapeLigneActive: { backgroundColor: '#E8572A' },
  etapeLabel: { color: '#6B5E4C', fontSize: '0.85rem', marginBottom: '24px', fontWeight: '600' },
  group: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' },
  input: { width: '100%', padding: '12px', border: '1px solid #E5DDD4', borderRadius: '8px', fontSize: '0.95rem', color: '#1C1409', boxSizing: 'border-box', outline: 'none' },
  row: { display: 'flex', gap: '16px' },
  typeChips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  chip: { padding: '8px 18px', borderRadius: '99px', border: '1px solid #E5DDD4', backgroundColor: '#fff', color: '#6B5E4C', cursor: 'pointer', fontSize: '0.9rem' },
  chipActif: { backgroundColor: '#E8572A', color: '#fff', borderColor: '#E8572A' },
  checkboxRow: { display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#374151', fontWeight: '600' },
  infoBox: { backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px', fontSize: '0.88rem', color: '#166534', marginBottom: '20px' },
  recapCard: { border: '1px solid #E5DDD4', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  recapRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3EDE6', fontSize: '0.9rem', color: '#6B5E4C' },
  btnOrange: { flex: 1, backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
  btnGris: { flex: 1, backgroundColor: '#fff', color: '#6B5E4C', border: '1px solid #E5DDD4', padding: '14px', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer' },
  erreur: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' },
  reqStar: { color: '#E8572A', fontWeight: '700' },
  photosGrid: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' },
  photoPreview: {
    width: '90px', height: '90px', borderRadius: '10px',
    overflow: 'hidden', border: '1px solid #E5DDD4',
  },
  photoAjouter: {
    width: '90px', height: '90px', borderRadius: '10px',
    border: '2px dashed #E5DDD4', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', backgroundColor: '#FAFAF8',
  },
}

export default PublierAnnonce