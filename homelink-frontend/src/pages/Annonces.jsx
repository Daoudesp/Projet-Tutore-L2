import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

const QUARTIERS = ['Plateau', 'Point E', 'Mermoz', 'Médina', 'Ouakam', 'Sacré-Cœur', 'Yoff', 'Almadies', 'Ngor', 'Fann', 'HLM', 'Liberté', 'Grand Dakar']
const TYPES = ['Chambre', 'Studio', 'Appartement', 'Villa']

// Coordonnées GPS des quartiers de Dakar
const COORDS_QUARTIERS = {
  'Plateau':     [14.6928, -17.4467],
  'Point E':     [14.6892, -17.4620],
  'Mermoz':      [14.7083, -17.4794],
  'Médina':      [14.6889, -17.4528],
  'Ouakam':      [14.7183, -17.4928],
  'Sacré-Cœur':  [14.7028, -17.4683],
  'Yoff':        [14.7528, -17.4894],
  'Almadies':    [14.7428, -17.5117],
  'Ngor':        [14.7494, -17.5028],
  'Fann':        [14.6944, -17.4636],
  'HLM':         [14.7050, -17.4510],
  'Liberté':     [14.7083, -17.4583],
  'Grand Dakar': [14.7010, -17.4417],
}

const formatPrix = (prix) => {
  const n = Number(prix)
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return `${n}`
}

const createPrixIcon = (prix, actif = false) => L.divIcon({
  className: '',
  html: `<div style="
    background:${actif ? '#E8572A' : '#fff'};
    color:${actif ? '#fff' : '#1C1409'};
    border:2px solid #E8572A;
    padding:5px 12px;
    border-radius:20px;
    font-weight:700;
    font-size:0.8rem;
    white-space:nowrap;
    box-shadow:0 2px 8px rgba(0,0,0,0.18);
    cursor:pointer;
  ">${formatPrix(prix)}</div>`,
  iconAnchor: [32, 16],
  popupAnchor: [0, -20],
})

function Annonces() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [annonces, setAnnonces] = useState([])
  const [chargement, setChargement] = useState(true)
  const [tri, setTri] = useState('pertinence')
  const [vue, setVue] = useState('liste') // 'liste' | 'carte'
  const [page, setPage] = useState(1)
  const PAR_PAGE = 9

  const quartier = searchParams.get('quartier') || ''
  const type = searchParams.get('type') || ''
  const budget = searchParams.get('budget') || ''
  const prixMin = searchParams.get('prixMin') || ''

  // État local du formulaire (pré-rempli depuis l'URL)
  const [formQuartier, setFormQuartier] = useState(quartier)
  const [formType, setFormType] = useState(type)
  const [formBudget, setFormBudget] = useState(budget)
  const [formPrixMin, setFormPrixMin] = useState(prixMin)

  const handleRecherche = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (formQuartier) params.append('quartier', formQuartier)
    if (formType) params.append('type', formType)
    if (formPrixMin) params.append('prixMin', formPrixMin)
    if (formBudget) params.append('budget', formBudget)
    setPage(1)
    navigate(`/annonces?${params.toString()}`)
  }

  const handleReset = () => {
    setFormQuartier(''); setFormType(''); setFormBudget(''); setFormPrixMin('')
    setPage(1)
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
      if (prixMin) {
        resultats = resultats.filter(a => Number(a.prix) >= Number(prixMin))
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
  }, [quartier, type, budget, prixMin])

  const filtresActifs = [
    quartier && { label: quartier, key: 'quartier' },
    type && { label: type, key: 'type' },
    budget && { label: `< ${Number(budget).toLocaleString('fr-FR')} FCFA`, key: 'budget' },
  ].filter(Boolean)

  const annoncesTriees = [...annonces].sort((a, b) => {
    if (tri === 'prix_asc') return a.prix - b.prix
    if (tri === 'prix_desc') return b.prix - a.prix
    return 0
  })
  const totalPages = Math.ceil(annoncesTriees.length / PAR_PAGE)
  const annoncesPage = annoncesTriees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)

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
            <label style={styles.searchLabel}>PRIX MIN (FCFA)</label>
            <input
              style={styles.searchInput}
              type="number"
              placeholder="ex: 50 000"
              value={formPrixMin}
              onChange={(e) => setFormPrixMin(e.target.value)}
            />
          </div>
          <div style={styles.searchDivider} />
          <div style={styles.searchField}>
            <label style={styles.searchLabel}>PRIX MAX (FCFA)</label>
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            style={styles.triSelect}
            value={tri}
            onChange={(e) => setTri(e.target.value)}
          >
            <option value="pertinence">Tri · Pertinence</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
          <div style={styles.vueToggle}>
            <button
              style={{ ...styles.vueBtn, ...(vue === 'liste' ? styles.vueBtnActif : {}) }}
              onClick={() => setVue('liste')}
            >☰ Liste</button>
            <button
              style={{ ...styles.vueBtn, ...(vue === 'carte' ? styles.vueBtnActif : {}) }}
              onClick={() => setVue('carte')}
            >🗺 Carte</button>
          </div>
        </div>
      </div>

      <div style={vue === 'carte' ? styles.containerCarte : styles.container}>
        {chargement ? (
          <p style={{ color: '#6B5E4C', padding: '32px 48px' }}>Chargement des annonces…</p>
        ) : annonces.length === 0 ? (
          <div style={styles.vide}>
            <p>Aucune annonce trouvée.</p>
            <button style={styles.btnOrange} onClick={() => navigate('/annonces')}>
              Voir toutes les annonces
            </button>
          </div>
        ) : vue === 'liste' ? (
          <>
            <div style={styles.grid} className="annonces-grid">
              {annoncesPage.map(a => (
                <div key={a.id} style={styles.card} onClick={() => navigate(`/annonces/${a.id}`)}>
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
                      <p style={styles.cardPrix}>{Number(a.prix).toLocaleString('fr-FR')}</p>
                    </div>
                    <p style={styles.cardLieu}>
                      {a.quartier || '–'}{a.surface ? ` · ${a.surface}m²` : ''}
                      {a.meuble ? ' · Meublé' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
                  onClick={() => { if (page > 1) { setPage(p => p - 1); window.scrollTo(0, 0) } }}
                  disabled={page === 1}
                >← Précédent</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    style={{ ...styles.pageBtn, ...(page === n ? styles.pageBtnActif : {}) }}
                    onClick={() => { setPage(n); window.scrollTo(0, 0) }}
                  >{n}</button>
                ))}
                <button
                  style={{ ...styles.pageBtn, ...(page === totalPages ? styles.pageBtnDisabled : {}) }}
                  onClick={() => { if (page < totalPages) { setPage(p => p + 1); window.scrollTo(0, 0) } }}
                  disabled={page === totalPages}
                >Suivant →</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* CARTE */}
            <MapContainer
              center={[14.7167, -17.4677]}
              zoom={13}
              style={{ height: '55vh', width: '100%', borderRadius: '12px 12px 0 0' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {annonces.map((a, i) => {
                const coords = COORDS_QUARTIERS[a.quartier]
                if (!coords) return null
                const lat = coords[0] + (i % 5) * 0.0008
                const lng = coords[1] + (i % 3) * 0.0008
                return (
                  <Marker key={a.id} position={[lat, lng]} icon={createPrixIcon(a.prix)}>
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        {a.photo && (
                          <img src={a.photo} alt={a.titre}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                          />
                        )}
                        <p style={{ fontWeight: '700', margin: '0 0 4px', fontSize: '0.9rem' }}>{a.titre}</p>
                        <p style={{ color: '#E8572A', fontWeight: '700', margin: '0 0 4px' }}>
                          {Number(a.prix).toLocaleString('fr-FR')} FCFA/mois
                        </p>
                        <p style={{ color: '#6B5E4C', fontSize: '0.8rem', margin: '0 0 10px' }}>
                          {a.quartier}{a.surface ? ` · ${a.surface}m²` : ''}{a.meuble ? ' · Meublé' : ''}
                        </p>
                        <button
                          onClick={() => navigate(`/annonces/${a.id}`)}
                          style={{ width: '100%', backgroundColor: '#E8572A', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Voir l'annonce →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>

            {/* LISTE SOUS LA CARTE */}
            <div style={{ backgroundColor: '#fff', borderRadius: '0 0 12px 12px', border: '1px solid #E5DDD4', borderTop: 'none' }}>
              <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid #F3EDE6' }}>
                <p style={{ fontWeight: '700', color: '#1C1409', margin: 0, fontSize: '1rem' }}>
                  {annonces.length} logement{annonces.length > 1 ? 's' : ''} trouvé{annonces.length > 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px 0' }}>
                {annonces.map(a => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/annonces/${a.id}`)}
                    style={styles.carteListItem}
                  >
                    <div style={styles.carteListImg}>
                      {a.photo
                        ? <img src={a.photo} alt={a.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', backgroundColor: '#E8DDD4', backgroundImage: 'repeating-linear-gradient(45deg,#D4C5B8 0,#D4C5B8 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: '#1C1409', margin: '0 0 2px', fontSize: '0.9rem' }}>{a.titre}</p>
                      <p style={{ color: '#6B5E4C', fontSize: '0.8rem', margin: '0 0 4px' }}>
                        {a.quartier}{a.surface ? ` · ${a.surface}m²` : ''}{a.meuble ? ' · Meublé' : ''}
                      </p>
                      <span style={{ backgroundColor: '#DCFCE7', color: '#166534', fontSize: '0.7rem', fontWeight: '600', padding: '2px 8px', borderRadius: '99px', marginRight: '8px' }}>Disponible</span>
                    </div>
                    <p style={{ color: '#E8572A', fontWeight: '700', fontSize: '1rem', margin: 0, whiteSpace: 'nowrap' }}>
                      {Number(a.prix).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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
  containerCarte: { maxWidth: '1200px', margin: '0 auto', padding: '0 48px 60px' },
  carteListItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: '1px solid #F3EDE6', cursor: 'pointer', transition: 'background 0.15s' },
  carteListImg: { width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 },
  vueToggle: { display: 'flex', border: '1px solid #E5DDD4', borderRadius: '8px', overflow: 'hidden' },
  vueBtn: { padding: '8px 16px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '0.88rem', color: '#6B5E4C', fontWeight: '500' },
  vueBtnActif: { backgroundColor: '#E8572A', color: '#fff', fontWeight: '700' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '32px 0 8px' },
  pageBtn: { padding: '8px 14px', border: '1px solid #E5DDD4', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.9rem', color: '#1C1409', fontWeight: '500' },
  pageBtnActif: { backgroundColor: '#E8572A', color: '#fff', borderColor: '#E8572A', fontWeight: '700' },
  pageBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
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