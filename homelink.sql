-- Base de données HomeLink
-- Université Cheikh Anta Diop - ESP Dakar 2025/2026

CREATE DATABASE IF NOT EXISTS homelink;
USE homelink;

-- Table utilisateurs (parent de proprietaire, locataire, administrateur)
CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('locataire', 'proprietaire', 'administrateur') NOT NULL,
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table quartiers
CREATE TABLE quartiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    commune VARCHAR(100),
    prix_moyen_loyer DECIMAL(10,2),
    description TEXT
);

-- Table biens_immobiliers
CREATE TABLE biens_immobiliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proprietaire_id INT NOT NULL,
    quartier_id INT NOT NULL,
    adresse VARCHAR(255),
    ville VARCHAR(100) DEFAULT 'Dakar',
    surface DECIMAL(8,2),
    nombre_pieces INT,
    nombre_salles_de_bain INT,
    etage INT DEFAULT 0,
    meuble BOOLEAN DEFAULT FALSE,
    type_logement ENUM('CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA') NOT NULL,
    FOREIGN KEY (proprietaire_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (quartier_id) REFERENCES quartiers(id)
);

-- Table annonces
CREATE TABLE annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bien_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL,
    date_publication DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_expiration DATETIME,
    statut ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'EXPIREE') DEFAULT 'EN_ATTENTE',
    FOREIGN KEY (bien_id) REFERENCES biens_immobiliers(id)
);

-- Table photos
CREATE TABLE photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annonce_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    ordre INT DEFAULT 0,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id)
);

-- Table messages
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expediteur_id INT NOT NULL,
    annonce_id INT NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (annonce_id) REFERENCES annonces(id)
);

-- Table avis
CREATE TABLE avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    locataire_id INT NOT NULL,
    bien_id INT NOT NULL,
    note INT CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT,
    date_avis DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (locataire_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (bien_id) REFERENCES biens_immobiliers(id)
);