-- HomeLink — Schéma de base de données production
-- À importer dans sql7831769 via phpMyAdmin

SET FOREIGN_KEY_CHECKS = 0;

-- Utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(20),
  `role` ENUM('locataire', 'proprietaire', 'administrateur') NOT NULL,
  `date_inscription` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reset_token` VARCHAR(100),
  `reset_token_expire` TIMESTAMP NULL,
  `email_verifie` TINYINT(1) NOT NULL DEFAULT 0,
  `email_token` VARCHAR(100),
  `actif` TINYINT(1) NOT NULL DEFAULT 1
);

-- Quartiers
CREATE TABLE IF NOT EXISTS `quartiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `commune` VARCHAR(100),
  `description` TEXT
);

-- Biens immobiliers
CREATE TABLE IF NOT EXISTS `biens_immobiliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proprietaire_id` INT NOT NULL,
  `quartier_id` INT,
  `adresse` VARCHAR(255),
  `surface` DECIMAL(8,2),
  `nombre_pieces` INT,
  `nombre_salles_de_bain` INT,
  `etage` INT DEFAULT 0,
  `meuble` TINYINT(1) DEFAULT 0,
  `type_logement` VARCHAR(50),
  FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quartier_id`) REFERENCES `quartiers`(`id`) ON DELETE SET NULL
);

-- Annonces
CREATE TABLE IF NOT EXISTS `annonces` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bien_id` INT NOT NULL,
  `titre` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `prix` DECIMAL(10,2) NOT NULL,
  `date_publication` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `date_expiration` TIMESTAMP NULL,
  `statut` ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE') DEFAULT 'EN_ATTENTE',
  `locataire_loue_id` INT,
  FOREIGN KEY (`bien_id`) REFERENCES `biens_immobiliers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`locataire_loue_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL
);

-- Messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expediteur_id` INT NOT NULL,
  `destinataire_id` INT,
  `annonce_id` INT NOT NULL,
  `contenu` TEXT NOT NULL,
  `date_envoi` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `lu` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`expediteur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`destinataire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`annonce_id`) REFERENCES `annonces`(`id`) ON DELETE CASCADE
);

-- Avis
CREATE TABLE IF NOT EXISTS `avis` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `locataire_id` INT NOT NULL,
  `bien_id` INT NOT NULL,
  `note` INT NOT NULL,
  `commentaire` TEXT,
  `date_avis` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`locataire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bien_id`) REFERENCES `biens_immobiliers`(`id`) ON DELETE CASCADE
);

-- Photos
CREATE TABLE IF NOT EXISTS `photos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `annonce_id` INT NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `ordre` INT DEFAULT 0,
  FOREIGN KEY (`annonce_id`) REFERENCES `annonces`(`id`) ON DELETE CASCADE
);

-- Favoris
CREATE TABLE IF NOT EXISTS `favoris` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `locataire_id` INT NOT NULL,
  `annonce_id` INT NOT NULL,
  `date_ajout` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`locataire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`annonce_id`) REFERENCES `annonces`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_favori` (`locataire_id`, `annonce_id`)
);

SET FOREIGN_KEY_CHECKS = 1;
