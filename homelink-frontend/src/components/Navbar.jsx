import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [nonLus, setNonLus] = useState(0)
  const [menuOuvert, setMenuOuvert] = useState(false)

  useEffect(() => {
    if (!token) return
    const fetchNonLus = () => {
      api.get('/messages/non-lus')
        .then(res => setNonLus(res.data.count || 0))
        .catch(() => {})
    }
    fetchNonLus()
    const interval = setInterval(fetchNonLus, 30000)
    return () => clearInterval(interval)
  }, [token])

  const handleDeconnexion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const fermerMenu = () => setMenuOuvert(false)

  const lienMessages = (label) => (
    <Link to="/messages" style={styles.link} onClick={fermerMenu}>
      <span style={{ position: 'relative' }}>
        {label}
        {nonLus > 0 && (
          <span style={styles.badge}>{nonLus > 9 ? '9+' : nonLus}</span>
        )}
      </span>
    </Link>
  )

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>🏠 HomeLink</Link>

      {/* Menu Desktop */}
      <div style={styles.links} className="nav-desktop">
        <Link to="/" style={styles.link}>Accueil</Link>
        <Link to="/annonces" style={styles.link}>Rechercher</Link>

        {token ? (
          <>
            {user.role === 'proprietaire' && (
              <>
                {lienMessages('Messages')}
                <Link to="/publier" style={styles.link}>Publier une annonce</Link>
              </>
            )}
            {user.role === 'locataire' && (
              <>
                <Link to="/favoris" style={styles.link}>Mes favoris</Link>
                {lienMessages('Mes messages')}
              </>
            )}
            {user.role === 'administrateur' && (
              <Link to="/admin" style={styles.link}>Admin</Link>
            )}
            <Link to="/profil" style={styles.link}>Mon profil</Link>
            <button onClick={handleDeconnexion} style={styles.btnOutline}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Connexion</Link>
            <Link to="/register" style={styles.link}>Publier une annonce</Link>
          </>
        )}
      </div>

      {/* Bouton hamburger mobile */}
      <button
        className="nav-hamburger"
        style={styles.hamburger}
        onClick={() => setMenuOuvert(!menuOuvert)}
        aria-label="Menu"
      >
        <span style={styles.burgerLine}></span>
        <span style={styles.burgerLine}></span>
        <span style={styles.burgerLine}></span>
        {nonLus > 0 && <span style={styles.badgeMobile}>{nonLus > 9 ? '9+' : nonLus}</span>}
      </button>

      {/* Menu mobile déroulant */}
      {menuOuvert && (
        <div style={styles.mobileMenu} className="nav-mobile">
          <Link to="/" style={styles.mobileLink} onClick={fermerMenu}>Accueil</Link>
          <Link to="/annonces" style={styles.mobileLink} onClick={fermerMenu}>Rechercher</Link>

          {token ? (
            <>
              {user.role === 'proprietaire' && (
                <>
                  <Link to="/messages" style={styles.mobileLink} onClick={fermerMenu}>
                    Messages {nonLus > 0 && <span style={styles.badgeInline}>{nonLus}</span>}
                  </Link>
                  <Link to="/publier" style={styles.mobileLinkPrimary} onClick={fermerMenu}>
                    Publier une annonce
                  </Link>
                </>
              )}
              {user.role === 'locataire' && (
                <>
                  <Link to="/favoris" style={styles.mobileLink} onClick={fermerMenu}>Mes favoris</Link>
                  <Link to="/messages" style={styles.mobileLink} onClick={fermerMenu}>
                    Mes messages {nonLus > 0 && <span style={styles.badgeInline}>{nonLus}</span>}
                  </Link>
                </>
              )}
              {user.role === 'administrateur' && (
                <Link to="/admin" style={styles.mobileLink} onClick={fermerMenu}>Admin</Link>
              )}
              <Link to="/profil" style={styles.mobileLink} onClick={fermerMenu}>Mon profil</Link>
              <button onClick={() => { fermerMenu(); handleDeconnexion() }} style={styles.mobileBtnDeco}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.mobileLink} onClick={fermerMenu}>Connexion</Link>
              <Link to="/register" style={styles.mobileLinkPrimary} onClick={fermerMenu}>S'inscrire</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 48px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    position: 'relative',
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#E8572A',
    textDecoration: 'none',
    flexShrink: 0,
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
  },
  link: {
    textDecoration: 'none',
    color: '#1C1409',
    fontSize: '0.95rem',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-14px',
    backgroundColor: '#E8572A',
    color: '#fff',
    borderRadius: '99px',
    fontSize: '0.65rem',
    fontWeight: '700',
    padding: '2px 5px',
    lineHeight: 1,
    minWidth: '16px',
    textAlign: 'center',
  },
  badgeMobile: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#E8572A',
    color: '#fff',
    borderRadius: '99px',
    fontSize: '0.6rem',
    fontWeight: '700',
    padding: '2px 4px',
    lineHeight: 1,
  },
  badgeInline: {
    display: 'inline-block',
    backgroundColor: '#E8572A',
    color: '#fff',
    borderRadius: '99px',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    marginLeft: '6px',
  },
  btnOutline: {
    border: '1px solid #E8572A',
    color: '#E8572A',
    padding: '8px 20px',
    borderRadius: '8px',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  btnPrimary: {
    backgroundColor: '#E8572A',
    color: '#ffffff',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    position: 'relative',
  },
  burgerLine: {
    display: 'block',
    width: '24px',
    height: '2px',
    backgroundColor: '#1C1409',
    borderRadius: '2px',
  },
  mobileMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    padding: '16px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    zIndex: 99,
  },
  mobileLink: {
    textDecoration: 'none',
    color: '#1C1409',
    fontSize: '1rem',
    padding: '14px 0',
    borderBottom: '1px solid #F3EDE6',
    display: 'flex',
    alignItems: 'center',
  },
  mobileLinkPrimary: {
    textDecoration: 'none',
    color: '#E8572A',
    fontSize: '1rem',
    fontWeight: '700',
    padding: '14px 0',
    borderBottom: '1px solid #F3EDE6',
    display: 'block',
  },
  mobileBtnDeco: {
    background: 'none',
    border: '1px solid #E8572A',
    color: '#E8572A',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px',
    width: '100%',
  },
}

export default Navbar
