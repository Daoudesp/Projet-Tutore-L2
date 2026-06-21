# HomeLink 🏠

> Dalal ak jàmm · Bienvenue

Plateforme web de digitalisation de la recherche de logements à Dakar. Elle met en relation directe propriétaires et locataires — sans courtier, avec des annonces vérifiées et des prix transparents.

---

## Équipe

| Nom | Rôle |
|-----|------|
| Daouda CISSE | Backend |
| Sokhna Aïchatou Amanatoulaye FALL | Frontend |
| Abdoulaye GUEYE | Intégration & Déploiement |

**Établissement :** Université Cheikh Anta Diop — École Supérieure Polytechnique de Dakar
**Département :** Génie Informatique
**Année :** 2025/2026

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React.js + HTML/CSS |
| Backend | Flask (Python) |
| Base de données | MySQL |
| Stockage photos | Cloudinary |
| Déploiement | Render + Railway |

---

## Fonctionnalités

- Recherche de logements par quartier, type, budget
- Consultation des annonces avec photos et détails
- Parcours par quartier avec prix moyens
- Publication d'annonces par les propriétaires
- Messagerie directe entre locataire et propriétaire
- Dépôt d'avis sur les biens
- Tableau de bord administrateur (validation, rejet, modération)

---

## Structure du projet

```
HomeLink/
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
│
├── backend/           # API Flask
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   └── __init__.py
│   ├── config.py
│   └── requirements.txt
│
└── README.md
```

---

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows : venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :

```
DB_HOST=localhost
DB_NAME=homelink
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
JWT_SECRET_KEY=votre_secret_key
```

---

## Acteurs du système

- **Visiteur** — peut s'inscrire, se connecter, rechercher et consulter des annonces
- **Locataire** — peut contacter un propriétaire, ajouter aux favoris, déposer un avis
- **Propriétaire** — peut publier, modifier et supprimer ses annonces
- **Administrateur** — peut valider/rejeter des annonces, modérer les avis, gérer les comptes

---

## Licence

Projet académique — ESP Dakar 2025/2026
