import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function DetailAnnonce() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [annonce, setAnnonce] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [message, setMessage] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [favori, setFavori] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const token = localStorage.getItem('token')
  const userLocal = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    api.get(`/annonces/${id}`)
      .then(res => setAnnonce(res.data))
      .catch(() => navigate('/annonces'))
      .finally(() => setChargement(false))
  }, [id])

  const handleContact = async (e) => {
    e.preventDefault()
    if (!token) { navigate('/login'); return }
    try {
      await api.post('/messages', { annonce_id: Number(id), contenu: message })
      setEnvoye(true)
      setMessage('')
    } catch {
      alert("Erreur lors de l'envoi")
    }
  }

  const handleFavori = async () => {
    if (!token) { navigate('/login'); return }
    try {
      await api.post(`/favoris/${id}`)
      setFavori(true)
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.includes('déjà')) {
        setFavori(true) // déjà dans les favoris, on met juste le bouton actif
      } else {
        alert("Erreur lors de l'ajout aux favoris")
      }
    }
  }

  if (chargement) return <div style={styles.loading}>Chargement…</div>
  if (!annonce) return null

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh' }}>

      {/* HERO IMAGE */}
      {annonce.photos && annonce.photos.length > 0 ? (
        <div style={{ position: 'relative' }}>
          <div style={{
            ...styles.imgHero,
            backgroundImage: `url(${annonce.photos[photoIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }} />
          {annonce.photos.length > 1 && (
            <div style={styles.photoNav}>
              {annonce.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  style={{
                    ...styles.photoDot,
                    ...(i === photoIndex ? styles.photoDotActif : {})
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.imgHero} />
      )}

      <div style={styles.container}>
        <div style={styles.layout}>

          {/* COLONNE GAUCHE */}
          <div style={styles.left}>
            <div style={styles.badges}>
              <span style={styles.badgeVert}>Disponible</span>
              <span style={styles.badgeOrange}>✔ Vérifié</span>
            </div>

            <h1 style={styles.titre}>{annonce.titre}</h1>
            <p style={styles.adresse}>
              📍 {annonce.adresse || ''}{annonce.quartier ? `, ${annonce.quartier}` : ''} · Dakar
            </p>
            <p style={styles.prix}>
              {Number(annonce.prix).toLocaleString('fr-FR')}
              <span style={styles.prixLib}> FCFA / mois</span>
            </p>

            {/* CARACTÉRISTIQUES */}
            <div style={styles.statsRow}>
              {[
                { val: annonce.nombre_pieces || '–', lib: 'pièce(s)' },
                { val: annonce.surface ? `${annonce.surface}m²` : '–', lib: 'surface' },
                { val: annonce.etage != null ? `${annonce.etage}e` : '–', lib: 'étage' },
                { val: annonce.meuble ? 'Oui' : 'Non', lib: 'meublé' },
              ].map((s, i) => (
                <div key={i} style={{ ...styles.statBox, borderRight: i < 3 ? '1px solid #E5DDD4' : 'none' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#1C1409' }}>{s.val}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#6B5E4C' }}>{s.lib}</span>
                </div>
              ))}
            </div>

            {/* PROPRIÉTAIRE */}
            {annonce.proprietaire_prenom && (
              <div style={styles.proprioCard}>
                <div style={styles.avatar}>
                  {(annonce.proprietaire_prenom || 'P')[0]}
                  {(annonce.proprietaire_nom || 'P')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', color: '#1C1409', margin: 0 }}>
                    {annonce.proprietaire_prenom} {annonce.proprietaire_nom}
                  </p>
                  <p style={{ color: '#6B5E4C', fontSize: '0.85rem', margin: '4px 0 0' }}>
                    Répond vite
                  </p>
                </div>
                <span style={styles.badgeOrange}>Propriétaire</span>
              </div>
            )}

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1C1409', marginBottom: '10px' }}>
              Description
            </h3>
            <p style={{ color: '#4A4035', lineHeight: '1.7', fontSize: '0.95rem' }}>
              {annonce.description || 'Aucune description fournie.'}
            </p>
          </div>

          {/* COLONNE DROITE — CONTACT */}
          <div style={styles.right}>
            <div style={styles.contactCard}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1C1409', marginBottom: '20px' }}>
                Contacter le propriétaire
              </h3>

              {!token ? (
                <>
                  <p style={{ color: '#6B5E4C', marginBottom: '16px', fontSize: '0.9rem' }}>
                    Connectez-vous pour envoyer un message.
                  </p>
                  <button style={styles.btnOrange} onClick={() => navigate('/login')}>
                    Se connecter
                  </button>
                </>
              ) : envoye ? (
                <div style={styles.successBox}>
                  ✅ Message envoyé ! Le propriétaire vous répondra bientôt.
                </div>
              ) : (
                <form onSubmit={handleContact}>
                  <textarea
                    style={styles.textarea}
                    placeholder="Bonjour, je suis intéressé(e) par votre annonce…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                  />
                  <button type="submit" style={styles.btnOrange}>
                    💬 Envoyer le message
                  </button>
                </form>
              )}

              <button
                style={favori ? styles.btnFavoriActif : styles.btnFavori}
                onClick={handleFavori}
              >
                {favori ? '❤️ Ajouté aux favoris' : '🤍 Ajouter aux favoris'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const styles = {
  loading: { padding: '80px', textAlign: 'center', color: '#6B5E4C' },
  imgHero: {
    width: '100%', height: '360px',
    backgroundColor: '#E8DDD4',
    backgroundImage: 'repeating-linear-gradient(45deg, #D4C5B8 0, #D4C5B8 1px, transparent 0, transparent 50%)',
    backgroundSize: '20px 20px',
  },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 48px 60px' },
  layout: { display: 'flex', gap: '48px', alignItems: 'flex-start' },
  left: { flex: '1.5' },
  right: { flex: '1', position: 'sticky', top: '90px' },
  badges: { display: 'flex', gap: '8px', marginBottom: '16px' },
  badgeVert: {
    backgroundColor: '#DCFCE7', color: '#166534',
    fontSize: '0.78rem', fontWeight: '600', padding: '4px 12px', borderRadius: '99px',
  },
  badgeOrange: {
    backgroundColor: '#FDE8DF', color: '#E8572A',
    fontSize: '0.78rem', fontWeight: '600', padding: '4px 12px', borderRadius: '99px',
  },
  titre: { fontSize: '1.8rem', fontWeight: '800', color: '#1C1409', marginBottom: '8px' },
  adresse: { color: '#6B5E4C', marginBottom: '12px', fontSize: '0.95rem' },
  prix: { fontSize: '2rem', fontWeight: '800', color: '#E8572A', marginBottom: '24px' },
  prixLib: { fontSize: '0.9rem', fontWeight: '400', color: '#6B5E4C' },
  statsRow: {
    display: 'flex', border: '1px solid #E5DDD4',
    borderRadius: '12px', overflow: 'hidden', marginBottom: '28px',
  },
  statBox: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '16px 12px', gap: '4px',
  },
  proprioCard: {
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '20px', border: '1px solid #E5DDD4',
    borderRadius: '12px', marginBottom: '28px', backgroundColor: '#fff',
  },
  avatar: {
    width: '48px', height: '48px', borderRadius: '50%',
    backgroundColor: '#E8572A', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '1rem', flexShrink: 0,
  },
  contactCard: {
    backgroundColor: '#fff', border: '1px solid #E5DDD4',
    borderRadius: '16px', padding: '28px',
  },
  textarea: {
    width: '100%', padding: '12px', border: '1px solid #E5DDD4',
    borderRadius: '8px', fontSize: '0.95rem', color: '#1C1409',
    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', marginBottom: '12px', display: 'block',
  },
  btnOrange: {
    width: '100%', backgroundColor: '#E8572A', color: '#fff',
    border: 'none', padding: '14px', borderRadius: '10px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginBottom: '12px',
    display: 'block',
  },
  btnFavori: {
    width: '100%', backgroundColor: '#fff', color: '#6B5E4C',
    border: '1px solid #E5DDD4', padding: '12px', borderRadius: '10px',
    fontSize: '0.9rem', cursor: 'pointer',
  },
  btnFavoriActif: {
    width: '100%', backgroundColor: '#FDE8DF', color: '#E8572A',
    border: '1px solid #E8572A', padding: '12px', borderRadius: '10px',
    fontSize: '0.9rem', cursor: 'pointer',
  },
  successBox: {
    backgroundColor: '#DCFCE7', color: '#166534',
    padding: '16px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '12px',
  },
  photoNav: {
    position: 'absolute', bottom: '16px', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: '8px',
  },
  photoDot: {
    width: '10px', height: '10px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    border: 'none', cursor: 'pointer', padding: 0,
  },
  photoDotActif: {
    backgroundColor: '#fff',
  },
}

export default DetailAnnonce