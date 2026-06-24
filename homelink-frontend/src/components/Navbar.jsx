import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleDeconnexion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>🏠 HomeLink</Link>

      <div style={styles.links}>
        <Link to="/annonces" style={styles.link}>Rechercher</Link>

        {token ? (
          <>
            {user.role === 'proprietaire' && (
              <>
                <Link to="/messages" style={styles.link}>Messages</Link>
                <Link to="/publier" style={styles.btnPrimary}>Publier une annonce</Link>
              </>
            )}
            {user.role === 'locataire' && (
              <>
                <Link to="/favoris" style={styles.link}>Mes favoris</Link>
                <Link to="/messages" style={styles.link}>Mes messages</Link>
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
            <Link to="/register" style={styles.btnPrimary}>Publier une annonce</Link>
          </>
        )}
      </div>
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
  },
  logo: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#E8572A',
    textDecoration: 'none',
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
  },
  btnOutline: {
    border: '1px solid #E8572A',
    color: '#E8572A',
    padding: '8px 20px',
    borderRadius: '8px',
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
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
}

export default Navbar
