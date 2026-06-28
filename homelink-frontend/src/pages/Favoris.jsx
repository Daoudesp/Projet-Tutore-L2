import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Favoris() {
  const navigate = useNavigate()
  const [favoris, setFavoris] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || user.role !== 'locataire') { navigate('/'); return }
    chargerFavoris()
  }, [])

  const chargerFavoris = () => {
    api.get('/favoris')
      .then(res => setFavoris(res.data))
      .catch(() => setFavoris([]))
      .finally(() => setChargement(false))
  }

  const handleSupprimer = async (annonce_id) => {
    try {
      await api.delete(`/favoris/${annonce_id}`)
      setFavoris(favoris.filter(f => f.annonce_id !== annonce_id))
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh', padding: '48px 24px' }} className="favoris-page">
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.titre}>Mes favoris</h1>
          <p style={styles.sousTitre}>
            {favoris.length} annonce{favoris.length > 1 ? 's' : ''} sauvegardée{favoris.length > 1 ? 's' : ''}
          </p>
        </div>

        {chargement ? (
          <p style={{ color: '#6B5E4C' }}>Chargement…</p>
        ) : favoris.length === 0 ? (
          <div style={styles.vide}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>❤️</div>
            <p style={{ color: '#6B5E4C', marginBottom: '20px' }}>
              Vous n'avez pas encore de favoris.
            </p>
            <button style={styles.btnOrange} onClick={() => navigate('/annonces')}>
              Parcourir les annonces
            </button>
          </div>
        ) : (
          <div style={styles.grid} className="favoris-grid">
            {favoris.map(f => (
              <div key={f.id} style={styles.card}>
                <div
                  style={styles.cardImg}
                  onClick={() => navigate(`/annonces/${f.annonce_id}`)}
                >
                  {f.photo
                    ? <img src={f.photo} alt={f.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={styles.cardImgPlaceholder} />
                  }
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardTop}>
                    <span style={styles.badge}>{f.type_logement}</span>
                    <button
                      style={styles.btnSupprimer}
                      onClick={() => handleSupprimer(f.annonce_id)}
                      title="Retirer des favoris"
                    >
                      ❤️
                    </button>
                  </div>
                  <p
                    style={styles.cardTitre}
                    onClick={() => navigate(`/annonces/${f.annonce_id}`)}
                  >
                    {f.titre}
                  </p>
                  <p style={styles.cardLieu}>📍 {f.quartier}</p>
                  <p style={styles.cardPrix}>
                    {Number(f.prix).toLocaleString('fr-FR')}
                    <span style={{ fontSize: '0.8rem', fontWeight: '400', color: '#6B5E4C' }}> FCFA/mois</span>
                  </p>
                  <p style={styles.dateAjout}>Ajouté le {f.date_ajout}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  titre: { fontSize: '1.8rem', fontWeight: '800', color: '#1C1409', marginBottom: '4px' },
  sousTitre: { color: '#6B5E4C', fontSize: '0.9rem' },
  vide: { textAlign: 'center', padding: '80px 0' },
  btnOrange: {
    backgroundColor: '#E8572A', color: '#fff', border: 'none',
    padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '14px',
    overflow: 'hidden', border: '1px solid #E5DDD4',
  },
  cardImg: {
    height: '180px', cursor: 'pointer',
    overflow: 'hidden', position: 'relative',
  },
  cardImgPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#E8DDD4',
    backgroundImage: 'repeating-linear-gradient(45deg, #D4C5B8 0, #D4C5B8 1px, transparent 0, transparent 50%)',
    backgroundSize: '18px 18px',
  },
  cardBody: { padding: '16px' },
  cardTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '10px',
  },
  badge: {
    backgroundColor: '#FDE8DF', color: '#E8572A',
    fontSize: '0.73rem', fontWeight: '600',
    padding: '3px 10px', borderRadius: '99px',
  },
  btnSupprimer: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '1.1rem', padding: '0', lineHeight: 1,
  },
  cardTitre: {
    fontWeight: '600', color: '#1C1409',
    fontSize: '0.95rem', margin: '0 0 6px', cursor: 'pointer',
  },
  cardLieu: { color: '#6B5E4C', fontSize: '0.83rem', margin: '0 0 8px' },
  cardPrix: { color: '#E8572A', fontWeight: '700', fontSize: '1.05rem', margin: '0 0 6px' },
  dateAjout: { color: '#9B8E83', fontSize: '0.78rem', margin: 0 },
}

export default Favoris
