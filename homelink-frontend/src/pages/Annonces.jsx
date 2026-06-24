import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

const QUARTIERS = ['Plateau', 'Point E', 'Mermoz', 'Médina', 'Ouakam', 'Sacré-Cœur', 'Yoff', 'Almadies', 'Ngor', 'Fann', 'HLM', 'Liberté', 'Grand Dakar']
const TYPES = ['Chambre', 'Studio', 'Appartement', 'Villa']

function Annonces() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [annonces, setAnnonces] = useState([])
  const [chargement, setChargement] = useState(true)
  const [tri, setTri] = useState('pertinence')

  const quartier = searchParams.get('quartier') || ''
  const type = searchParams.get('type') || ''
  const budget = searchParams.get('budget') || ''

  // État local du formulaire (pré-rempli depuis l'URL)
  const [formQuartier, setFormQuartier] = useState(quartier)
  const [formType, setFormType] = useState(type)
  const [formBudget, setFormBudget] = useState(budget)

  const handleRecherche = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (formQuartier) params.append('quartier', formQuartier)
    if (formType) params.append('type', formType)
    if (formBudget) params.append('budget', formBudget)
    navigate(`/annonces?${params.toString()}`)
  }

  const handleReset = () => {
    setFormQuartier(''); setFormType(''); setFormBudget('')
    navigate('/annonces')
  }

  useEffect(() => {
    setChargement(true)
    api.get('/annonces').then(res => {
      let resultats = res.data
      if (quartier) {
        resultats = resultats.filter(a =>
          a.quartier?.toLowerCase() === quartier.toLowerCase()
        )
      }
      if (type) {
        resultats = resultats.filter(a =>
          a.type_logement?.toLowerCase() === type.toLowerCase()
        )
      }
      if (budget) {
        resultats = resultats.filter(a => Number(a.prix) <= Number(budget))
      }
      setAnnonces(resultats)
      setTri('pertinence') // reset tri quand filtres changent
    }).catch(() => {
      setAnnonces([])
    }).finally(() => {
      setChargement(false)
    })
  }, [quartier, type, budget])

  const filtresActifs = [
    quartier && { label: quartier, key: 'quartier' },
    type && { label: type, key: 'type' },
    budget && { label: `< ${Number(budget).toLocaleString('fr-FR')} FCFA`, key: 'budget' },
  ].filter(Boolean)

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh' }}>

      {/* BARRE DE RECHERCHE */}
      <div style={styles.searchBar} className="annonces-filtres">
        <form style={styles.searchForm} onSubmit={handleRecherche}>
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>QUARTIER</label>
            <select style={styles.searchInput} value={formQuartier} onChange={(e) => setFormQuartier(e.target.value)}>
              <option value="">Tous les quartiers</option>
              {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div style={styles.searchDivider} />
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>TYPE</label>
            <select style={styles.searchInput} value={formType} onChange={(e) => setFormType(e.target.value)}>
              <option value="">Tous les types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={styles.searchDivider} />
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>BUDGET MAX (FCFA)</label>
            <input
              style={styles.searchInput}
              type="number"
              placeholder="ex: 150 000"
              value={formBudget}
              onChange={(e) => setFormBudget(e.target.value)}
            />
          </div>
          <button type="submit" style={styles.searchBtn}>🔍 Rechercher</button>
          {(formQuartier || formType || formBudget) && (
            <button type="button" style={styles.resetBtn} onClick={handleReset}>✕</button>
          )}
        </form>
      </div>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.titre}>
            {chargement
              ? 'Chargement…'
              : `${annonces.length} logement${annonces.length > 1 ? 's' : ''} trouvé${annonces.length > 1 ? 's' : ''}`}
          </h1>
          {filtresActifs.length > 0 && (
            <div style={styles.chips}>
              {filtresActifs.map(f => (
                <span key={f.key} style={styles.chip}>{f.label}</span>
              ))}
            </div>
          )}
        </div>
        <select
          style={styles.triSelect}
          value={tri}
          onChange={(e) => setTri(e.target.value)}
        >
          <option value="pertinence">Tri · Pertinence</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
      </div>

      <div style={styles.container}>
        {chargement ? (
          <p style={{ color: '#6B5E4C' }}>Chargement des annonces…</p>
        ) : annonces.length === 0 ? (
          <div style={styles.vide}>
            <p>Aucune annonce trouvée.</p>
            <button style={styles.btnOrange} onClick={() => navigate('/annonces')}>
              Voir toutes les annonces
            </button>
          </div>
        ) : (
          <div style={styles.grid} className="annonces-grid">
            {[...annonces]
              .sort((a, b) => {
                if (tri === 'prix_asc') return a.prix - b.prix
                if (tri === 'prix_desc') return b.prix - a.prix
                return 0
              })
              .map(a => (
              <div
                key={a.id}
                style={styles.card}
                onClick={() => navigate(`/annonces/${a.id}`)}
              >
                <div style={styles.cardImg}>
                  {a.photo
                    ? <img src={a.photo} alt={a.titre} style={styles.cardPhoto} />
                    : <div style={styles.cardImgPlaceholder} />
                  }
                  <div style={styles.cardBadges}>
                    <span style={styles.badgeDisponible}>Disponible</span>
                    <span style={styles.badgeVerifie}>✔ Vérifié</span>
                  </div>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <p style={styles.cardTitre}>{a.titre}</p>
                    <p style={styles.cardPrix}>
                      {Number(a.prix).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <p style={styles.cardLieu}>
                    {a.quartier || '–'}{a.surface ? ` · ${a.surface}m²` : ''}
                    {a.meuble ? ' · Meublé' : ''}
                  </p>
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
  searchBar: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #E5DDD4',
    padding: '20px 48px',
  },
  searchForm: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    backgroundColor: '#F5F0E8',
    borderRadius: '12px',
    border: '1px solid #E5DDD4',
    overflow: 'hidden',
  },
  searchField: {
    flex: 1,
    padding: '10px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  searchLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    color: '#6B5E4C',
    letterSpacing: '0.08em',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    fontSize: '0.9rem',
    color: '#1C1409',
    outline: 'none',
    width: '100%',
    padding: 0,
  },
  searchDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: '#E5DDD4',
    flexShrink: 0,
  },
  searchBtn: {
    backgroundColor: '#E8572A',
    color: '#fff',
    border: 'none',
    padding: '0 28px',
    height: '60px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0,
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: '#6B5E4C',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '0 14px',
    height: '60px',
  },
  header: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 48px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '12px' },
  titre: { fontSize: '1.5rem', fontWeight: '700', color: '#1C1409', margin: 0 },
  chips: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#FDE8DF',
    color: '#E8572A',
    padding: '5px 14px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  triSelect: {
    border: '1px solid #E5DDD4', borderRadius: '8px',
    padding: '8px 14px', fontSize: '0.88rem', color: '#6B5E4C',
    backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 48px 60px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid #E5DDD4',
    cursor: 'pointer',
  },
  cardImg: {
    height: '200px',
    position: 'relative',
    overflow: 'hidden',
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  cardImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8DDD4',
    backgroundImage: 'repeating-linear-gradient(45deg, #D4C5B8 0, #D4C5B8 1px, transparent 0, transparent 50%)',
    backgroundSize: '18px 18px',
  },
  cardBadges: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'flex',
    gap: '8px',
  },
  badgeDisponible: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: '0.73rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '99px',
  },
  badgeVerifie: {
    backgroundColor: '#FDE8DF',
    color: '#E8572A',
    fontSize: '0.73rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '99px',
  },
  cardBody: { padding: '16px' },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '6px',
  },
  cardTitre: { fontWeight: '600', color: '#1C1409', fontSize: '0.95rem', margin: 0 },
  cardPrix: { color: '#E8572A', fontWeight: '700', fontSize: '1rem', margin: 0, whiteSpace: 'nowrap' },
  cardLieu: { color: '#6B5E4C', fontSize: '0.83rem', margin: 0 },
  vide: { textAlign: 'center', padding: '80px 0', color: '#6B5E4C' },
  btnOrange: {
    backgroundColor: '#E8572A',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
}

export default Annonces