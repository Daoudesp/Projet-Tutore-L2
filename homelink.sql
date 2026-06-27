-- ============================================================
-- Base de données HomeLink
-- ESP Dakar · Génie Informatique 2025/2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS homelink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homelink;

-- ============================================================
-- TABLE : utilisateurs
-- Gère les trois rôles : locataire, proprietaire, administrateur
-- ============================================================
CREATE TABLE utilisateurs (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nom                 VARCHAR(100)  NOT NULL,
    prenom              VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255)  NOT NULL,
    telephone           VARCHAR(20),
    role                ENUM('locataire', 'proprietaire', 'administrateur') NOT NULL,
    date_inscription    DATETIME      DEFAULT CURRENT_TIMESTAMP,
    -- Vérification email
    email_verifie       BOOLEAN       NOT NULL DEFAULT FALSE,
    email_token         VARCHAR(100)  DEFAULT NULL,
    -- Réinitialisation mot de passe
    reset_token         VARCHAR(100)  DEFAULT NULL,
    reset_token_expire  DATETIME      DEFAULT NULL
);

-- ============================================================
-- TABLE : quartiers
-- ============================================================
CREATE TABLE quartiers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    commune     VARCHAR(100),
    description TEXT
);

-- ============================================================
-- TABLE : biens_immobiliers
-- ============================================================
CREATE TABLE biens_immobiliers (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    proprietaire_id       INT NOT NULL,
    quartier_id           INT NOT NULL,
    adresse               VARCHAR(255),
    ville                 VARCHAR(100) DEFAULT 'Dakar',
    surface               DECIMAL(8,2),
    nombre_pieces         INT,
    nombre_salles_de_bain INT,
    etage                 INT          DEFAULT 0,
    meuble                BOOLEAN      DEFAULT FALSE,
    type_logement         ENUM('CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA') NOT NULL,
    FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (quartier_id)     REFERENCES quartiers(id)
);

-- ============================================================
-- TABLE : annonces
-- locataire_loue_id : locataire désigné par le propriétaire
--   lors du passage en statut LOUEE — permet le dépôt d'avis
--   uniquement après libération du logement (retour en PUBLIEE)
-- ============================================================
CREATE TABLE annonces (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    bien_id             INT           NOT NULL,
    titre               VARCHAR(255)  NOT NULL,
    description         TEXT,
    prix                DECIMAL(10,2) NOT NULL,
    date_publication    DATETIME      DEFAULT CURRENT_TIMESTAMP,
    date_expiration     DATETIME,
    statut              ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE')
                        DEFAULT 'EN_ATTENTE',
    locataire_loue_id   INT           DEFAULT NULL,
    FOREIGN KEY (bien_id)           REFERENCES biens_immobiliers(id) ON DELETE CASCADE,
    FOREIGN KEY (locataire_loue_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE : photos
-- ============================================================
CREATE TABLE photos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    annonce_id  INT           NOT NULL,
    url         VARCHAR(500)  NOT NULL,
    ordre       INT           DEFAULT 0,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE : messages
-- Messagerie directe entre locataire et propriétaire,
-- rattachée à une annonce pour le contexte
-- ============================================================
CREATE TABLE messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    expediteur_id   INT  NOT NULL,
    destinataire_id INT  NOT NULL,
    annonce_id      INT  NOT NULL,
    contenu         TEXT NOT NULL,
    date_envoi      DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu              BOOLEAN  DEFAULT FALSE,
    FOREIGN KEY (expediteur_id)   REFERENCES utilisateurs(id),
    FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (annonce_id)      REFERENCES annonces(id)
);

-- ============================================================
-- TABLE : avis
-- Un locataire ne peut laisser un avis que s'il est désigné
-- comme locataire_loue_id ET que l'annonce est repassée
-- en PUBLIEE (logement libéré)
-- ============================================================
CREATE TABLE avis (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    locataire_id INT NOT NULL,
    bien_id      INT NOT NULL,
    note         INT CHECK (note BETWEEN 1 AND 5),
    commentaire  TEXT,
    date_avis    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_avis (locataire_id, bien_id),
    FOREIGN KEY (locataire_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (bien_id)      REFERENCES biens_immobiliers(id)
);

-- ============================================================
-- TABLE : favoris
-- ============================================================
CREATE TABLE favoris (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    locataire_id INT NOT NULL,
    annonce_id   INT NOT NULL,
    date_ajout   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favori (locataire_id, annonce_id),
    FOREIGN KEY (locataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (annonce_id)   REFERENCES annonces(id)    ON DELETE CASCADE
);

-- ============================================================
-- DONNÉES INITIALES : quartiers de Dakar
-- ============================================================
INSERT INTO quartiers (nom, commune, description) VALUES
('Plateau',     'Dakar Plateau', 'Centre des affaires de Dakar'),
('Point E',     'Dakar',         'Quartier résidentiel prisé, proche de l''UCAD'),
('Mermoz',      'Dakar',         'Quartier résidentiel calme et verdoyant'),
('Médina',      'Dakar',         'Quartier populaire et central'),
('Ouakam',      'Dakar',         'Quartier côtier avec vue sur l''Atlantique'),
('Sacré-Cœur',  'Dakar',         'Quartier résidentiel moderne'),
('Yoff',        'Dakar',         'Quartier côtier au nord de Dakar'),
('Almadies',    'Dakar',         'Zone résidentielle haut standing'),
('Ngor',        'Dakar',         'Village côtier pittoresque'),
('Fann',        'Dakar',         'Quartier universitaire et diplomatique'),
('HLM',         'Dakar',         'Quartier populaire bien desservi'),
('Liberté',     'Dakar',         'Quartier résidentiel dynamique'),
('Grand Dakar', 'Dakar',         'Quartier populaire étendu');

-- ============================================================
-- COMPTE ADMINISTRATEUR PAR DÉFAUT
-- Email       : admin@homelink.sn
-- Mot de passe: Admin1234
-- Pour générer le hash, exécuter dans le dossier backend :
--   python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('Admin1234'))"
-- puis remplacer HASH_ICI par le résultat
-- ============================================================
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, email_verifie)
VALUES ('Admin', 'HomeLink', 'admin@homelink.sn',
        'HASH_ICI',
        'administrateur', TRUE);
