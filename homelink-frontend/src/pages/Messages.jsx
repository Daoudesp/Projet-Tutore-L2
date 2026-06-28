import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Messages() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [convActive, setConvActive] = useState(null) // { annonce_id, other_user_id, ... }
  const [thread, setThread] = useState([])
  const [reponse, setReponse] = useState('')
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi] = useState(false)
  const endRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    chargerConversations()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const chargerConversations = async () => {
    try {
      const res = await api.get('/conversations')
      setConversations(res.data)
      // Ouvrir la première conversation automatiquement
      if (res.data.length > 0) ouvrirConversation(res.data[0])
    } catch {
      setConversations([])
    } finally {
      setChargement(false)
    }
  }

  const ouvrirConversation = async (conv) => {
    setConvActive(conv)
    setThread([])
    setReponse('')
    try {
      const res = await api.get(`/thread?annonce_id=${conv.annonce_id}&other_user_id=${conv.other_user_id}`)
      setThread(res.data)
      // Mettre à jour le badge non_lus dans la liste
      setConversations(prev => prev.map(c =>
        c.annonce_id === conv.annonce_id && c.other_user_id === conv.other_user_id
          ? { ...c, non_lus: 0 } : c
      ))
    } catch { setThread([]) }
  }

  const handleEnvoyer = async (e) => {
    e.preventDefault()
    if (!reponse.trim() || !convActive) return
    setEnvoi(true)
    try {
      await api.post('/messages', {
        annonce_id: convActive.annonce_id,
        contenu: reponse,
        destinataire_id: convActive.other_user_id,
      })
      const newMsg = {
        id: Date.now(),
        contenu: reponse,
        is_mine: true,
        date_envoi: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
      }
      setThread(prev => [...prev, newMsg])
      setReponse('')
    } catch {
      alert("Erreur lors de l'envoi")
    } finally {
      setEnvoi(false)
    }
  }

  const totalNonLus = conversations.reduce((s, c) => s + (c.non_lus || 0), 0)

  if (chargement) return <div style={{ padding: '80px', textAlign: 'center', color: '#6B5E4C' }}>Chargement…</div>

  return (
    <div style={styles.page}>

      {/* PANNEAU GAUCHE — liste conversations */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitre}>
            Conversations
            {totalNonLus > 0 && <span style={styles.badge}>{totalNonLus}</span>}
          </h2>
        </div>

        {conversations.length === 0 ? (
          <div style={{ padding: '32px 20px', color: '#9B8E83', fontSize: '0.9rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💬</div>
            Aucune conversation
          </div>
        ) : (
          <div style={styles.convListe}>
            {conversations.map((conv, i) => {
              const actif = convActive?.annonce_id === conv.annonce_id && convActive?.other_user_id === conv.other_user_id
              return (
                <button
                  key={i}
                  style={{ ...styles.convItem, ...(actif ? styles.convItemActif : {}) }}
                  onClick={() => ouvrirConversation(conv)}
                >
                  <div style={styles.avatarConv}>
                    {conv.other_user_prenom[0]}{conv.other_user_nom[0]}
                  </div>
                  <div style={styles.convInfo}>
                    <div style={styles.convNomRow}>
                      <span style={{ fontWeight: '700', color: '#1C1409', fontSize: '0.92rem' }}>
                        {conv.other_user_prenom} {conv.other_user_nom}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9B8E83', whiteSpace: 'nowrap' }}>
                        {conv.last_date.split(' ')[0]}
                      </span>
                    </div>
                    <p style={{ color: '#6B5E4C', fontSize: '0.8rem', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📋 {conv.annonce_titre}
                    </p>
                    <p style={{ color: '#9B8E83', fontSize: '0.8rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.non_lus > 0 && (
                    <span style={styles.badgeNonLu}>{conv.non_lus}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </aside>

      {/* PANNEAU DROIT — fil de discussion */}
      <main style={styles.main}>
        {!convActive ? (
          <div style={styles.vide}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
            <p style={{ color: '#6B5E4C' }}>Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            {/* Header du thread */}
            <div style={styles.threadHeader}>
              <div style={styles.avatarConv}>
                {convActive.other_user_prenom[0]}{convActive.other_user_nom[0]}
              </div>
              <div>
                <p style={{ fontWeight: '700', color: '#1C1409', margin: 0 }}>
                  {convActive.other_user_prenom} {convActive.other_user_nom}
                </p>
                {convActive.other_user_telephone && (
                  <p style={{ color: '#6B5E4C', fontSize: '0.82rem', margin: '2px 0 0' }}>
                    📞 {convActive.other_user_telephone}
                  </p>
                )}
              </div>
              <button
                style={styles.btnAnnonce}
                onClick={() => navigate(`/annonces/${convActive.annonce_id}`)}
              >
                📋 {convActive.annonce_titre}
              </button>
            </div>

            {/* Messages */}
            <div style={styles.threadBody}>
              {thread.length === 0 ? (
                <p style={{ color: '#9B8E83', textAlign: 'center', padding: '40px 0' }}>Aucun message dans ce fil.</p>
              ) : (
                thread.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.is_mine ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                    <div style={{ ...styles.bubble, ...(msg.is_mine ? styles.bubbleMoi : styles.bubbleAutre) }}>
                      <p style={{ margin: 0, fontSize: '0.93rem', lineHeight: '1.5' }}>{msg.contenu}</p>
                      <span style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', color: msg.is_mine ? 'rgba(255,255,255,0.7)' : '#9B8E83' }}>
                        {msg.date_envoi}
                        {msg.is_mine && (
                          <span style={{ color: msg.lu ? '#93c5fd' : 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '700' }}>
                            {msg.lu ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* Zone de réponse */}
            <form style={styles.repondreBox} onSubmit={handleEnvoyer}>
              <textarea
                style={styles.repondreInput}
                placeholder="Votre message…"
                rows={2}
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnvoyer(e) } }}
              />
              <button type="submit" style={styles.btnEnvoyer} disabled={envoi || !reponse.trim()}>
                {envoi ? '…' : '↑ Envoyer'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

const styles = {
  page: { display: 'flex', height: 'calc(100vh - 64px)', backgroundColor: '#FAFAF8', overflow: 'hidden' },
  sidebar: { width: '320px', borderRight: '1px solid #E5DDD4', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '24px 20px 16px', borderBottom: '1px solid #E5DDD4' },
  sidebarTitre: { fontSize: '1.2rem', fontWeight: '800', color: '#1C1409', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  badge: { backgroundColor: '#E8572A', color: '#fff', fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '99px' },
  convListe: { flex: 1, overflowY: 'auto' },
  convItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px', width: '100%', border: 'none',
    borderBottom: '1px solid #F3EDE6', backgroundColor: 'transparent',
    cursor: 'pointer', textAlign: 'left',
  },
  convItemActif: { backgroundColor: '#F5F0E8', borderLeft: '3px solid #E8572A' },
  avatarConv: {
    width: '42px', height: '42px', borderRadius: '50%',
    backgroundColor: '#E8572A', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.9rem', flexShrink: 0,
  },
  convInfo: { flex: 1, minWidth: 0 },
  convNomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' },
  badgeNonLu: { backgroundColor: '#E8572A', color: '#fff', fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '99px', flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  vide: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  threadHeader: {
    padding: '16px 24px', borderBottom: '1px solid #E5DDD4',
    display: 'flex', alignItems: 'center', gap: '14px',
    backgroundColor: '#fff', flexShrink: 0,
  },
  btnAnnonce: {
    marginLeft: 'auto', backgroundColor: '#F5F0E8', color: '#E8572A',
    border: 'none', padding: '8px 14px', borderRadius: '8px',
    fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
  },
  threadBody: { flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column' },
  bubble: { maxWidth: '65%', padding: '12px 16px', borderRadius: '16px' },
  bubbleMoi: { backgroundColor: '#E8572A', color: '#fff', borderBottomRightRadius: '4px' },
  bubbleAutre: { backgroundColor: '#fff', color: '#1C1409', border: '1px solid #E5DDD4', borderBottomLeftRadius: '4px' },
  repondreBox: {
    padding: '16px 20px', borderTop: '1px solid #E5DDD4',
    backgroundColor: '#fff', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0,
  },
  repondreInput: {
    flex: 1, padding: '10px 14px', border: '1px solid #E5DDD4',
    borderRadius: '10px', fontSize: '0.93rem', fontFamily: 'inherit',
    resize: 'none', outline: 'none', color: '#1C1409',
  },
  btnEnvoyer: {
    backgroundColor: '#E8572A', color: '#fff', border: 'none',
    padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem',
    fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
    opacity: 1,
  },
}

export default Messages
