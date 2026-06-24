import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const QUARTIERS = ['Point E', 'Mermoz', 'Médina', 'Ouakam', 'Sacré-Cœur', 'Yoff', 'Almadies', 'Ngor', 'Fann']
const TYPES = ['Chambre', 'Studio', 'Appartement', 'Villa']

function Home() {
  const navigate = useNavigate()
  const [quartier, setQuartier] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')
  const [annonces, setAnnonces] = useState([])

  useEffect(() => {
    api.get('/annonces').then(res => {
      setAnnonces(res.data.slice(0, 4))
    }).catch(() => {})
  }, [])

  const handleRecherche = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (quartier) params.append('quartier', quartier)
    if (type) params.append('type', type)
    if (budget) params.append('budget', budget)
    navigate(`/annonces?${params.toString()}`)
  }

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh' }}>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroLeft}>
          <span style={styles.tag}>Dalal ak jàmm · Bienvenue à Dakar</span>
          <h1 style={styles.heroTitre}>
            Trouvez votre logement à Dakar,{' '}
            <span style={{ color: '#E8572A' }}>sans courtier.</span>
          </h1>
          <p style={styles.heroSousTitre}>
            Des annonces vérifiées, des prix transparents, et un contact direct
            avec les propriétaires — quartier par quartier.
          </p>

          <form style={styles.searchForm} onSubmit={handleRecherche}>
            <div style={styles.searchField}>
              <label style={styles.searchLabel}>QUARTIER</label>
              <select style={styles.searchInput} value={quartier} onChange={(e) => setQuartier(e.target.value)}>
                <option value="">Tous</option>
                {QUARTIERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div style={styles.searchDivider} />
            <div style={styles.searchField}>
              <label style={styles.searchLabel}>TYPE</label>
              <select style={styles.searchInput} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous</option>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.searchDivider} />
            <div style={styles.searchField}>
              <label style={styles.searchLabel}>BUDGET MAX</label>
              <input
                style={styles.searchInput}
                type="number"
                placeholder="150 000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <button type="submit" style={styles.searchBtn}>🔍 Rechercher</button>
          </form>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <strong style={styles.statNum}>2 400+</strong>
              <span style={styles.statLib}>logements</span>
            </div>
            <div style={styles.stat}>
              <strong style={styles.statNum}>38</strong>
              <span style={styles.statLib}>quartiers</span>
            </div>
            <div style={styles.stat}>
              <strong style={styles.statNum}>100%</strong>
              <span style={styles.statLib}>vérifiées</span>
            </div>
          </div>
        </div>

        {/* HERO GRID — photos des 4 premières annonces */}
        <div style={styles.heroRight}>
          <div style={styles.heroGrid}>
            {[0, 1, 2, 3].map(i => {
              const a = annonces[i]
              return a?.photo ? (
                <img
                  key={i}
                  src={a.photo}
                  alt={a.titre}
                  style={styles.heroImg}
                  onClick={() => navigate(`/annonces/${a.id}`)}
                />
              ) : (
                <div key={i} style={styles.heroImgPlaceholder} />
              )
            })}
          </div>
        </div>
      </section>

      {/* ANNONCES EN VEDETTE */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitre}>Annonces en vedette</h2>
          <Link to="/annonces" style={styles.voirTout}>Voir toutes les annonces →</Link>
        </div>
        <div style={styles.cardsGrid}>
          {annonces.length === 0
            ? [1, 2, 3, 4].map(i => (
                <div key={i} style={styles.card}>
                  <div style={styles.cardImgPlaceholder} />
                  <div style={styles.cardBody}>
                    <span style={styles.badge}>Disponible</span>
                    <p style={styles.cardTitre}>Chargement…</p>
                  </div>
                </div>
              ))
            : annonces.map(a => (
                <div key={a.id} style={styles.card} onClick={() => navigate(`/annonces/${a.id}`)}>
                  <div style={styles.cardImgWrapper}>
                    {a.photo
                      ? <img src={a.photo} alt={a.titre} style={styles.cardPhoto} />
                      : <div style={styles.cardImgPlaceholder} />
                    }
                  </div>
                  <div style={styles.cardBody}>
                    <span style={styles.badge}>Disponible</span>
                    <p style={styles.cardTitre}>{a.titre}</p>
                    <p style={styles.cardLieu}>
                      {a.quartier || '–'}{a.surface ? ` · ${a.surface}m²` : ' · –m²'}
                    </p>
                    <p style={styles.cardPrix}>
                      {Number(a.prix).toLocaleString('fr-FR')}{' '}
                      <span style={{ fontSize: '0.8rem', fontWeight: '400' }}>FCFA/mois</span>
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  )
}

const styles = {
  hero: {
    maxWidth: '1200px', margin: '0 auto',
    padding: '60px 48px',
    display: 'flex', gap: '48px', alignItems: 'center',
  },
  heroLeft: { flex: '1.2' },
  heroRight: { flex: '1' },
  tag: {
    display: 'inline-block', backgroundColor: '#FDE8DF', color: '#E8572A',
    padding: '6px 16px', borderRadius: '99px', fontSize: '0.85rem',
    fontWeight: '600', marginBottom: '20px',
  },
  heroTitre: {
    fontSize: '2.8rem', fontWeight: '800', color: '#1C1409',
    lineHeight: '1.2', marginBottom: '16px',
  },
  heroSousTitre: {
    color: '#6B5E4C', fontSize: '1rem', lineHeight: '1.7',
    marginBottom: '32px', maxWidth: '480px',
  },
  searchForm: {
    display: 'flex', alignItems: 'center', backgroundColor: '#fff',
    border: '1px solid #E5DDD4', borderRadius: '12px',
    padding: '8px', gap: '4px', marginBottom: '32px', flexWrap: 'wrap',
  },
  searchField: { flex: '1', minWidth: '120px', padding: '8px 12px' },
  searchLabel: {
    display: 'block', fontSize: '0.68rem', fontWeight: '700',
    color: '#9B8E83', letterSpacing: '0.08em', marginBottom: '4px',
  },
  searchInput: {
    width: '100%', border: 'none', outline: 'none',
    fontSize: '0.95rem', color: '#1C1409', background: 'transparent', padding: '0',
  },
  searchDivider: { width: '1px', height: '36px', backgroundColor: '#E5DDD4', flexShrink: 0 },
  searchBtn: {
    backgroundColor: '#E8572A', color: '#fff', border: 'none',
    padding: '14px 24px', borderRadius: '8px', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  stats: { display: 'flex', gap: '40px' },
  stat: { display: 'flex', flexDirection: 'column', gap: '2px' },
  statNum: { fontSize: '1.5rem', fontWeight: '800', color: '#1C1409' },
  statLib: { fontSize: '0.85rem', color: '#6B5E4C' },
  heroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  heroImg: {
    height: '170px', width: '100%', borderRadius: '12px',
    objectFit: 'cover', display: 'block', cursor: 'pointer',
  },
  heroImgPlaceholder: {
    height: '170px', borderRadius: '12px',
    backgroundColor: '#E8DDD4',
    backgroundImage: 'repeating-linear-gradient(45deg, #D4C5B8 0, #D4C5B8 1px, transparent 0, transparent 50%)',
    backgroundSize: '18px 18px',
  },
  section: { maxWidth: '1200px', margin: '0 auto', padding: '0 48px 60px' },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
  },
  sectionTitre: { fontSize: '1.5rem', fontWeight: '700', color: '#1C1409' },
  voirTout: { color: '#E8572A', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  card: {
    backgroundColor: '#fff', borderRadius: '12px',
    overflow: 'hidden', border: '1px solid #E5DDD4', cursor: 'pointer',
  },
  cardImgWrapper: { height: '150px', overflow: 'hidden' },
  cardPhoto: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardImgPlaceholder: {
    height: '150px',
    backgroundColor: '#E8DDD4',
    backgroundImage: 'repeating-linear-gradient(45deg, #D4C5B8 0, #D4C5B8 1px, transparent 0, transparent 50%)',
    backgroundSize: '18px 18px',
  },
  cardBody: { padding: '14px' },
  badge: {
    backgroundColor: '#DCFCE7', color: '#166534',
    fontSize: '0.73rem', fontWeight: '600',
    padding: '3px 10px', borderRadius: '99px',
  },
  cardTitre: {
    fontWeight: '600', color: '#1C1409',
    marginTop: '10px', marginBottom: '4px', fontSize: '0.95rem',
  },
  cardLieu: { color: '#6B5E4C', fontSize: '0.83rem', marginBottom: '8px' },
  cardPrix: { color: '#E8572A', fontWeight: '700', fontSize: '1.05rem', margin: 0 },
}

export default Home
