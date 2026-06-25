import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const MENU = [
  { label: 'Tableau de bord', key: 'dashboard', icon: '📊' },
  { label: 'Annonces', key: 'annonces', icon: '🏠' },
  { label: 'Utilisateurs', key: 'utilisateurs', icon: '👥' },
  { label: 'Avis', key: 'avis', icon: '⭐' },
  { label: 'Quartiers', key: 'quartiers', icon: '📍' },
]

function Admin() {
  const navigate = useNavigate()
  const [onglet, setOnglet] = useState('dashboard')
  const [annonces, setAnnonces] = useState([])
  const [utilisateurs, setUtilisateurs] = useState([])
  const [quartiers, setQuartiers] = useState([])
  const [stats, setStats] = useState({ en_attente: 0, publiees: 0, proprietaires: 0, locataires: 0 })
  const [newQuartier, setNewQuartier] = useState({ nom: '', commune: '', prix_moyen_loyer: '', description: '' })
  const [quartierSucces, setQuartierSucces] = useState('')
  const [quartierErreur, setQuartierErreur] = useState('')
  const [hovered, setHovered] = useState(null)
  const [tousAvis, setTousAvis] = useState([])
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || user.role !== 'administrateur') { navigate('/'); return }
    chargerTout()
  }, [])

  const chargerTout = () => {
    api.get('/admin/annonces').then(res => setAnnonces(res.data)).catch(() => {})
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {})
    api.get('/admin/utilisateurs').then(res => setUtilisateurs(res.data)).catch(() => {})
    api.get('/quartiers').then(res => setQuartiers(res.data)).catch(() => {})
    api.get('/admin/avis').then(res => setTousAvis(res.data)).catch(() => {})
  }

  const handleAjouterQuartier = async (e) => {
    e.preventDefault()
    setQuartierErreur('')
    setQuartierSucces('')
    if (!newQuartier.nom.trim()) { setQuartierErreur('Le nom est obligatoire'); return }
    try {
      await api.post('/quartiers', newQuartier)
      setQuartierSucces(`Quartier "${newQuartier.nom}" ajouté.`)
      setNewQuartier({ nom: '', commune: '', prix_moyen_loyer: '', description: '' })
      api.get('/quartiers').then(res => setQuartiers(res.data)).catch(() => {})
    } catch (err) {
      setQuartierErreur(err.response?.data?.message || 'Erreur lors de l\'ajout')
    }
  }

  const handleValider = async (id) => {
    try {
      await api.put(`/admin/annonces/${id}/valider`)
      chargerTout()
    } catch { alert('Erreur lors de la validation') }
  }

  const handleRejeter = async (id) => {
    try {
      await api.put(`/admin/annonces/${id}/rejeter`)
      chargerTout()
    } catch { alert('Erreur lors du rejet') }
  }

  const handleSupprimerAnnonce = async (id) => {
    if (!window.confirm('Supprimer cette annonce définitivement ?')) return
    try {
      await api.delete(`/annonces/${id}`)
      chargerTout()
    } catch { alert('Erreur lors de la suppression') }
  }

  return (
    <div style={styles.page} className="admin-layout">

      {/* SIDEBAR */}
      <aside style={styles.sidebar} className="admin-sidebar">
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>🏠 HomeLink</span>
          <span style={{ fontSize: '0.7rem', color: '#F5A68A', letterSpacing: '0.1em', marginTop: '2px' }}>
            ADMINISTRATION
          </span>
        </div>

        <nav style={styles.nav}>
          {MENU.map(m => (
            <button
              key={m.key}
              style={{
                ...styles.navItem,
                ...(onglet === m.key
                  ? styles.navItemActif
                  : hovered === m.key
                  ? styles.navItemHover
                  : {}),
              }}
              onClick={() => setOnglet(m.key)}
              onMouseEnter={() => setHovered(m.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span>{m.icon} {m.label}</span>
              {m.key === 'annonces' && annonces.length > 0 && (
                <span style={styles.badge}>{annonces.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarUser}>
          <div style={styles.avatarSm}>
            {(user.prenom || 'A')[0]}{(user.nom || 'A')[0]}
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: '600', margin: 0, fontSize: '0.9rem' }}>
              {user.prenom} {user.nom}
            </p>
            <p style={{ color: '#F5A68A', fontSize: '0.78rem', margin: 0 }}>Administrateur</p>
          </div>
        </div>
      </aside>

      {/* CONTENU */}
      <main style={styles.main} className="admin-content">

        {onglet === 'dashboard' && (
          <>
            <div style={styles.mainHeader}>
              <h1 style={styles.mainTitre}>Tableau de bord</h1>
              <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={styles.statsGrid}>
              {[
                { label: 'En attente', val: stats.en_attente, color: '#E8572A' },
                { label: 'Annonces publiées', val: stats.publiees, color: '#16A34A' },
                { label: 'Propriétaires', val: stats.proprietaires, color: '#1C1409' },
                { label: 'Locataires', val: stats.locataires, color: '#1C1409' },
              ].map((s, i) => (
                <div key={i} style={styles.statCard}>
                  <p style={{ color: '#6B5E4C', fontSize: '0.85rem', margin: '0 0 8px' }}>{s.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: '800', color: s.color, margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
            <div style={styles.tableSection}>
              <div style={styles.tableHeader}>
                <h2 style={styles.tableTitre}>Annonces en attente</h2>
                <button style={styles.lienOrange} onClick={() => setOnglet('annonces')}>Voir tout</button>
              </div>
              <AnnonceTable annonces={annonces.filter(a => a.statut === 'EN_ATTENTE').slice(0, 5)} onValider={handleValider} onRejeter={handleRejeter} onSupprimer={handleSupprimerAnnonce} />
            </div>
          </>
        )}

        {onglet === 'annonces' && (
          <>
            <div style={styles.mainHeader}>
              <h1 style={styles.mainTitre}>Toutes les annonces</h1>
              <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>
                {annonces.length} annonce(s) ·{' '}
                <span style={{ color: '#E8572A', fontWeight: '600' }}>
                  {annonces.filter(a => a.statut === 'EN_ATTENTE').length} en attente
                </span>
              </p>
            </div>
            <div style={styles.tableSection}>
              <AnnonceTable annonces={annonces} onValider={handleValider} onRejeter={handleRejeter} onSupprimer={handleSupprimerAnnonce} />
            </div>
          </>
        )}

        {onglet === 'utilisateurs' && (
          <>
            <div style={styles.mainHeader}>
              <h1 style={styles.mainTitre}>Utilisateurs</h1>
              <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>{utilisateurs.length} membres inscrits</p>
            </div>
            <div style={styles.tableSection}>
              {utilisateurs.length === 0 ? (
                <p style={{ color: '#6B5E4C' }}>Aucun utilisateur.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.theadRow}>
                        {['NOM', 'EMAIL', 'TÉLÉPHONE', 'RÔLE', 'INSCRIT LE'].map(col => (
                          <th key={col} style={styles.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {utilisateurs.map(u => (
                        <tr key={u.id} style={styles.tr}>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={styles.avatarTiny}>
                                {u.prenom[0]}{u.nom[0]}
                              </div>
                              <span style={{ fontWeight: '600', color: '#1C1409', fontSize: '0.9rem' }}>
                                {u.prenom} {u.nom}
                              </span>
                            </div>
                          </td>
                          <td style={styles.td}><span style={{ color: '#4A4035', fontSize: '0.9rem' }}>{u.email}</span></td>
                          <td style={styles.td}><span style={{ color: '#4A4035', fontSize: '0.9rem' }}>{u.telephone || '–'}</span></td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.roleBadge,
                              backgroundColor: u.role === 'administrateur' ? '#FDE8DF' : u.role === 'proprietaire' ? '#DCFCE7' : '#EFF6FF',
                              color: u.role === 'administrateur' ? '#E8572A' : u.role === 'proprietaire' ? '#166534' : '#1D4ED8',
                            }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={styles.td}><span style={{ color: '#9B8E83', fontSize: '0.85rem' }}>{u.date_inscription}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {onglet === 'avis' && (
          <>
            <div style={styles.mainHeader}>
              <h1 style={styles.mainTitre}>Avis</h1>
              <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>{tousAvis.length} avis publiés</p>
            </div>
            <div style={styles.tableSection}>
              {tousAvis.length === 0 ? (
                <p style={{ color: '#6B5E4C' }}>Aucun avis pour l'instant.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.theadRow}>
                        {['LOCATAIRE', 'LOGEMENT', 'NOTE', 'COMMENTAIRE', 'DATE'].map(col => (
                          <th key={col} style={styles.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tousAvis.map(a => (
                        <tr key={a.id} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={{ fontWeight: '600', color: '#1C1409', fontSize: '0.9rem' }}>
                              {a.locataire_prenom} {a.locataire_nom}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#4A4035', fontSize: '0.85rem' }}>
                              {a.bien_type} · {a.bien_adresse}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#E8572A', fontSize: '1rem' }}>
                              {'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#6B5E4C', fontSize: '0.85rem' }}>
                              {a.commentaire || <em>–</em>}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ color: '#9B8E83', fontSize: '0.82rem' }}>{a.date_avis}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {onglet === 'quartiers' && (
          <>
            <div style={styles.mainHeader}>
              <h1 style={styles.mainTitre}>Quartiers</h1>
              <p style={{ color: '#6B5E4C', fontSize: '0.9rem' }}>{quartiers.length} quartier(s) enregistré(s)</p>
            </div>

            {/* FORMULAIRE AJOUT */}
            <div style={{ ...styles.tableSection, marginBottom: '24px' }}>
              <h2 style={{ ...styles.tableTitre, marginBottom: '20px' }}>Ajouter un quartier</h2>
              {quartierSucces && <div style={styles.successMsg}>{quartierSucces}</div>}
              {quartierErreur && <div style={styles.erreurMsg}>{quartierErreur}</div>}
              <form onSubmit={handleAjouterQuartier}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={styles.formLabel}>Nom du quartier *</label>
                    <input
                      style={styles.formInput}
                      placeholder="ex: Plateau"
                      value={newQuartier.nom}
                      onChange={(e) => setNewQuartier({ ...newQuartier, nom: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Commune</label>
                    <input
                      style={styles.formInput}
                      placeholder="ex: Dakar Plateau"
                      value={newQuartier.commune}
                      onChange={(e) => setNewQuartier({ ...newQuartier, commune: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Prix moyen loyer (FCFA)</label>
                    <input
                      style={styles.formInput}
                      type="number"
                      placeholder="ex: 150000"
                      value={newQuartier.prix_moyen_loyer}
                      onChange={(e) => setNewQuartier({ ...newQuartier, prix_moyen_loyer: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={styles.formLabel}>Description</label>
                    <input
                      style={styles.formInput}
                      placeholder="Courte description"
                      value={newQuartier.description}
                      onChange={(e) => setNewQuartier({ ...newQuartier, description: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" style={styles.btnValider}>+ Ajouter le quartier</button>
              </form>
            </div>

            {/* LISTE */}
            <div style={styles.tableSection}>
              <h2 style={{ ...styles.tableTitre, marginBottom: '20px' }}>Liste des quartiers</h2>
              {quartiers.length === 0 ? (
                <p style={{ color: '#6B5E4C' }}>Aucun quartier enregistré.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.theadRow}>
                        {['NOM', 'COMMUNE', 'PRIX MOYEN', 'DESCRIPTION'].map(col => (
                          <th key={col} style={styles.th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {quartiers.map(q => (
                        <tr key={q.id} style={styles.tr}>
                          <td style={styles.td}><span style={{ fontWeight: '600', color: '#1C1409', fontSize: '0.9rem' }}>{q.nom}</span></td>
                          <td style={styles.td}><span style={{ color: '#4A4035', fontSize: '0.9rem' }}>{q.commune || '–'}</span></td>
                          <td style={styles.td}>
                            {q.prix_moyen_loyer
                              ? <span style={{ color: '#E8572A', fontWeight: '700' }}>{Number(q.prix_moyen_loyer).toLocaleString('fr-FR')} FCFA</span>
                              : <span style={{ color: '#9B8E83' }}>–</span>}
                          </td>
                          <td style={styles.td}><span style={{ color: '#6B5E4C', fontSize: '0.85rem' }}>{q.description || '–'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function AnnonceTable({ annonces, onValider, onRejeter, onSupprimer }) {
  if (annonces.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6B5E4C' }}>
        <p>Aucune annonce en attente.</p>
      </div>
    )
  }
  const statutStyle = {
    'EN_ATTENTE':  { bg: '#FEF9C3', color: '#854D0E', label: 'En attente' },
    'PUBLIEE':     { bg: '#DCFCE7', color: '#166534', label: 'Publiée' },
    'LOUEE':       { bg: '#DBEAFE', color: '#1E40AF', label: 'Louée' },
    'SUSPENDUE':   { bg: '#FEE2E2', color: '#991B1B', label: 'Suspendue' },
    'SUSPENDUE':   { bg: '#FEE2E2', color: '#991B1B', label: 'Rejetée' },
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.theadRow}>
            {['LOGEMENT', 'TYPE', 'QUARTIER', 'LOYER', 'STATUT', 'ACTION'].map(col => (
              <th key={col} style={styles.th}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {annonces.map(a => {
            const s = statutStyle[a.statut] || statutStyle['EN_ATTENTE']
            return (
              <tr key={a.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {a.photo
                      ? <img src={a.photo} alt={a.titre} style={styles.miniImg} />
                      : <div style={styles.miniImgPlaceholder} />
                    }
                    <p style={{ fontWeight: '600', color: '#1C1409', margin: 0, fontSize: '0.9rem' }}>{a.titre}</p>
                  </div>
                </td>
                <td style={styles.td}><span style={{ color: '#4A4035', fontSize: '0.9rem' }}>{a.type_logement || '–'}</span></td>
                <td style={styles.td}><span style={{ color: '#4A4035', fontSize: '0.9rem' }}>{a.quartier || '–'}</span></td>
                <td style={styles.td}><span style={{ color: '#E8572A', fontWeight: '700' }}>{Number(a.prix).toLocaleString('fr-FR')}</span></td>
                <td style={styles.td}>
                  <span style={{ backgroundColor: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '99px' }}>
                    {s.label}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {a.statut === 'EN_ATTENTE' && (
                      <>
                        <button style={styles.btnValider} onClick={() => onValider(a.id)}>Valider</button>
                        <button style={styles.btnRejeter} onClick={() => onRejeter(a.id)}>Rejeter</button>
                      </>
                    )}
                    {a.statut === 'PUBLIEE' && (
                      <button style={styles.btnRejeter} onClick={() => onRejeter(a.id)}>Suspendre</button>
                    )}
                    {(a.statut === 'SUSPENDUE' || a.statut === 'LOUEE') && (
                      <button style={styles.btnValider} onClick={() => onValider(a.id)}>Republier</button>
                    )}
                    <button style={styles.btnSupprimer} onClick={() => onSupprimer(a.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF8' },
  sidebar: {
    width: '240px', backgroundColor: '#1C1409', display: 'flex',
    flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
  },
  sidebarLogo: {
    padding: '28px 24px 20px', display: 'flex', flexDirection: 'column',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
  },
  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  navItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 14px', borderRadius: '8px', border: 'none',
    backgroundColor: 'rgba(255,255,255,0.06)', color: '#F2E4D6',
    fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', width: '100%',
    marginBottom: '3px', fontWeight: '500',
  },
  navItemHover: {
    backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFFFFF',
  },
  navItemActif: { backgroundColor: '#E8572A', color: '#fff', fontWeight: '700' },
  badge: {
    backgroundColor: '#E8572A', color: '#fff', borderRadius: '99px',
    padding: '2px 8px', fontSize: '0.72rem', fontWeight: '700',
  },
  sidebarUser: {
    padding: '20px', borderTop: '1px solid rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  avatarSm: {
    width: '36px', height: '36px', borderRadius: '50%',
    backgroundColor: '#E8572A', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.85rem', flexShrink: 0,
  },
  avatarTiny: {
    width: '30px', height: '30px', borderRadius: '50%',
    backgroundColor: '#E8DDD4', color: '#6B5E4C',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.75rem', flexShrink: 0,
  },
  main: { flex: 1, padding: '40px 48px', overflowY: 'auto' },
  mainHeader: { marginBottom: '32px' },
  mainTitre: { fontSize: '1.8rem', fontWeight: '800', color: '#1C1409', marginBottom: '4px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '40px' },
  statCard: { backgroundColor: '#fff', border: '1px solid #E5DDD4', borderRadius: '12px', padding: '20px 24px' },
  tableSection: { backgroundColor: '#fff', border: '1px solid #E5DDD4', borderRadius: '14px', padding: '24px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tableTitre: { fontSize: '1.1rem', fontWeight: '700', color: '#1C1409', margin: 0 },
  lienOrange: { background: 'none', border: 'none', color: '#E8572A', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { borderBottom: '1px solid #E5DDD4' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: '#9B8E83', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #F3EDE6' },
  td: { padding: '14px 16px' },
  miniImg: { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 },
  miniImgPlaceholder: { width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#E8DDD4', flexShrink: 0 },
  roleBadge: { fontSize: '0.75rem', fontWeight: '600', padding: '3px 10px', borderRadius: '99px' },
  btnValider: {
    backgroundColor: '#16A34A', color: '#fff', border: 'none',
    padding: '7px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
  },
  btnRejeter: {
    backgroundColor: '#fff', color: '#E8572A', border: '1px solid #E8572A',
    padding: '7px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
  },
  btnSupprimer: {
    backgroundColor: '#FFF5F5', color: '#dc2626', border: '1px solid #FECACA',
    padding: '7px 10px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
  },
  formLabel: { display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.85rem' },
  formInput: {
    width: '100%', padding: '10px 12px', border: '1px solid #E5DDD4',
    borderRadius: '8px', fontSize: '0.9rem', color: '#1C1409',
    boxSizing: 'border-box', outline: 'none',
  },
  successMsg: { backgroundColor: '#DCFCE7', color: '#166534', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '16px' },
  erreurMsg: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '16px' },
}

export default Admin
