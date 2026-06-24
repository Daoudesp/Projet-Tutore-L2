import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function Messages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [reponses, setReponses] = useState({}) // { msg_id: texte_reponse }
  const [reponsesEnvoyees, setReponsesEnvoyees] = useState({}) // { msg_id: true }
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    charger()
  }, [])

  const charger = () => {
    api.get('/messages')
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]))
      .finally(() => setChargement(false))
  }

  const handleRepondre = async (msg) => {
    const contenu = reponses[msg.id]
    if (!contenu?.trim()) return
    try {
      await api.post('/messages', {
        annonce_id: msg.annonce_id,
        contenu,
        destinataire_id: msg.expediteur_id,
      })
      setReponsesEnvoyees({ ...reponsesEnvoyees, [msg.id]: true })
      setReponses({ ...reponses, [msg.id]: '' })
    } catch {
      alert("Erreur lors de l'envoi de la réponse")
    }
  }

  const estProprietaire = user.role === 'proprietaire'

  return (
    <div style={{ backgroundColor: '#FAFAF8', minHeight: '100vh', padding: '48px 24px' }}>
      <div style={styles.container}>

        <div style={styles.header}>
          <h1 style={styles.titre}>
            {estProprietaire ? 'Messages reçus' : 'Mes messages'}
          </h1>
          <p style={styles.sousTitre}>{messages.length} message{messages.length > 1 ? 's' : ''}</p>
        </div>

        {chargement ? (
          <p style={{ color: '#6B5E4C' }}>Chargement…</p>
        ) : messages.length === 0 ? (
          <div style={styles.vide}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>💬</div>
            <p style={{ color: '#6B5E4C', marginBottom: '20px' }}>
              {estProprietaire ? 'Aucun message reçu.' : "Aucun message pour l'instant."}
            </p>
            {!estProprietaire && (
              <button style={styles.btnOrange} onClick={() => navigate('/annonces')}>
                Parcourir les annonces
              </button>
            )}
          </div>
        ) : (
          <div style={styles.liste}>
            {messages.map(msg => (
              <div key={msg.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.cardInfo}>
                    {msg.type === 'recu' ? (
                      <>
                        <div style={styles.avatar}>
                          {(msg.expediteur_prenom || '?')[0]}{(msg.expediteur_nom || '?')[0]}
                        </div>
                        <div>
                          <p style={styles.nom}>{msg.expediteur_prenom} {msg.expediteur_nom}</p>
                          <p style={styles.telephone}>Réponse du propriétaire</p>
                        </div>
                      </>
                    ) : estProprietaire ? (
                      <>
                        <div style={styles.avatar}>
                          {(msg.expediteur_prenom || '?')[0]}{(msg.expediteur_nom || '?')[0]}
                        </div>
                        <div>
                          <p style={styles.nom}>{msg.expediteur_prenom} {msg.expediteur_nom}</p>
                          {msg.expediteur_telephone && (
                            <p style={styles.telephone}>📞 {msg.expediteur_telephone}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={styles.avatar}>💬</div>
                        <p style={styles.nom}>Message envoyé</p>
                      </div>
                    )}
                  </div>
                  <span style={styles.date}>{msg.date_envoi}</span>
                </div>

                <div style={styles.annonceLien} onClick={() => navigate(`/annonces/${msg.annonce_id}`)}>
                  📋 {msg.annonce_titre}
                </div>

                <p style={styles.contenu}>{msg.contenu}</p>

                {/* Répondre — uniquement pour le propriétaire */}
                {estProprietaire && !reponsesEnvoyees[msg.id] && (
                  <div style={styles.repondreSection}>
                    <textarea
                      style={styles.repondreInput}
                      placeholder="Votre réponse…"
                      rows={3}
                      value={reponses[msg.id] || ''}
                      onChange={(e) => setReponses({ ...reponses, [msg.id]: e.target.value })}
                    />
                    <button
                      style={styles.btnRepondre}
                      onClick={() => handleRepondre(msg)}
                    >
                      ↩ Répondre
                    </button>
                  </div>
                )}
                {reponsesEnvoyees[msg.id] && (
                  <p style={styles.reponduLabel}>✅ Réponse envoyée</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  header: { marginBottom: '32px' },
  titre: { fontSize: '1.8rem', fontWeight: '800', color: '#1C1409', marginBottom: '4px' },
  sousTitre: { color: '#6B5E4C', fontSize: '0.9rem' },
  vide: { textAlign: 'center', padding: '80px 0' },
  btnOrange: {
    backgroundColor: '#E8572A', color: '#fff', border: 'none',
    padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem',
    fontWeight: '600', cursor: 'pointer',
  },
  liste: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    backgroundColor: '#fff', border: '1px solid #E5DDD4',
    borderRadius: '14px', padding: '20px',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '12px',
  },
  cardInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    backgroundColor: '#E8572A', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.9rem', flexShrink: 0,
  },
  nom: { fontWeight: '700', color: '#1C1409', margin: 0, fontSize: '0.95rem' },
  telephone: { color: '#6B5E4C', fontSize: '0.83rem', margin: '3px 0 0' },
  date: { color: '#9B8E83', fontSize: '0.82rem', whiteSpace: 'nowrap' },
  annonceLien: {
    backgroundColor: '#F5F0E8', color: '#E8572A',
    padding: '8px 14px', borderRadius: '8px',
    fontSize: '0.85rem', fontWeight: '600',
    cursor: 'pointer', marginBottom: '12px',
    display: 'inline-block',
  },
  contenu: {
    color: '#4A4035', fontSize: '0.95rem', lineHeight: '1.6', margin: 0,
    borderTop: '1px solid #F3EDE6', paddingTop: '12px',
  },
  repondreSection: { marginTop: '14px', borderTop: '1px solid #F3EDE6', paddingTop: '14px' },
  repondreInput: {
    width: '100%', padding: '10px', border: '1px solid #E5DDD4',
    borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit',
    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
    marginBottom: '8px', display: 'block', color: '#1C1409',
  },
  btnRepondre: {
    backgroundColor: '#1C1409', color: '#fff', border: 'none',
    padding: '9px 20px', borderRadius: '8px', fontSize: '0.88rem',
    fontWeight: '600', cursor: 'pointer',
  },
  reponduLabel: { color: '#16A34A', fontSize: '0.85rem', marginTop: '10px', fontWeight: '600' },
}

export default Messages
