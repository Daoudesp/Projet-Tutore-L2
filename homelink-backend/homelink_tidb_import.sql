-- ============================================================
-- HomeLink — Schéma complet pour TiDB Cloud
-- Généré à partir des modèles (models/) et routes (routes/)
-- ESP Dakar · Génie Informatique 2025/2026
-- ============================================================
--
-- IMPORT :
--   1. TiDB Cloud → Clusters → homelink-db → SQL Editor
--   2. Coller et exécuter ce fichier
--   OU via la console : mysql -h HOST -P 4000 -u USER -p --ssl-ca=... < homelink_tidb_import.sql
--
-- ============================================================

CREATE DATABASE IF NOT EXISTS homelink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE homelink;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- utilisateurs
-- Routes : auth (inscription, connexion, reset, verify-email)
--          admin (liste, bloquer/débloquer actif)
--          profil (modification profil)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id`                   INT AUTO_INCREMENT PRIMARY KEY,
  `nom`                  VARCHAR(100)  NOT NULL,
  `prenom`               VARCHAR(100)  NOT NULL,
  `email`                VARCHAR(150)  NOT NULL UNIQUE,
  `mot_de_passe`         VARCHAR(255)  NOT NULL,
  `telephone`            VARCHAR(20)   DEFAULT NULL,
  `role`                 ENUM('locataire', 'proprietaire', 'administrateur') NOT NULL,
  `date_inscription`     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  `reset_token`          VARCHAR(100)  DEFAULT NULL,
  `reset_token_expire`   DATETIME      DEFAULT NULL,
  `email_verifie`        TINYINT(1)    NOT NULL DEFAULT 0,
  `email_token`          VARCHAR(100)  DEFAULT NULL,
  `actif`                TINYINT(1)    NOT NULL DEFAULT 1
);

-- ------------------------------------------------------------
-- quartiers
-- Routes : quartiers (liste, ajout admin)
--          annonces, profil (affichage quartier du bien)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `quartiers` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `nom`         VARCHAR(100) NOT NULL,
  `commune`     VARCHAR(100) DEFAULT NULL,
  `description` TEXT         DEFAULT NULL
);

-- ------------------------------------------------------------
-- biens_immobiliers
-- Routes : annonces (création/modification annonce + bien)
--          avis (bien évalué)
--          profil (mes annonces propriétaire)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `biens_immobiliers` (
  `id`                    INT AUTO_INCREMENT PRIMARY KEY,
  `proprietaire_id`       INT           NOT NULL,
  `quartier_id`           INT           NOT NULL,
  `adresse`               VARCHAR(255)  DEFAULT NULL,
  `ville`                 VARCHAR(100)  DEFAULT 'Dakar',
  `surface`               DECIMAL(8,2)  DEFAULT NULL,
  `nombre_pieces`         INT           DEFAULT NULL,
  `nombre_salles_de_bain` INT           DEFAULT NULL,
  `etage`                 INT           DEFAULT 0,
  `meuble`                TINYINT(1)    DEFAULT 0,
  `type_logement`         ENUM('CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA') NOT NULL,
  CONSTRAINT `fk_bien_proprietaire` FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bien_quartier`     FOREIGN KEY (`quartier_id`)     REFERENCES `quartiers`(`id`)
);

-- ------------------------------------------------------------
-- annonces
-- Routes : annonces (CRUD, validation admin, statuts)
--          admin (modération EN_ATTENTE → PUBLIEE / SUSPENDUE)
--          messages (contexte annonce)
--          favoris, photos
-- Statuts : EN_ATTENTE, PUBLIEE, SUSPENDUE, LOUEE, EXPIREE
-- locataire_loue_id : locataire désigné quand statut = LOUEE (avis)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `annonces` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `bien_id`            INT            NOT NULL,
  `titre`              VARCHAR(255)   NOT NULL,
  `description`        TEXT           DEFAULT NULL,
  `prix`               DECIMAL(10,2)  NOT NULL,
  `date_publication`   DATETIME       DEFAULT CURRENT_TIMESTAMP,
  `statut`             ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE') DEFAULT 'EN_ATTENTE',
  `locataire_loue_id`  INT            DEFAULT NULL,
  CONSTRAINT `fk_annonce_bien`      FOREIGN KEY (`bien_id`)           REFERENCES `biens_immobiliers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_annonce_locataire` FOREIGN KEY (`locataire_loue_id`) REFERENCES `utilisateurs`(`id`)      ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- photos
-- Routes : photos (upload Cloudinary, suppression)
--          annonces, favoris, admin (affichage première photo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `photos` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `annonce_id` INT           NOT NULL,
  `url`        VARCHAR(500)  NOT NULL,
  CONSTRAINT `fk_photo_annonce` FOREIGN KEY (`annonce_id`) REFERENCES `annonces`(`id`) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- messages
-- Routes : messages (envoi, fil de discussion, lu/non lu)
--          annonces (suppression messages liés)
-- destinataire_id nullable : certains messages système sans destinataire fixe
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `expediteur_id`    INT  NOT NULL,
  `destinataire_id`  INT  DEFAULT NULL,
  `annonce_id`       INT  NOT NULL,
  `contenu`          TEXT NOT NULL,
  `date_envoi`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lu`               TINYINT(1) DEFAULT 0,
  CONSTRAINT `fk_msg_expediteur`   FOREIGN KEY (`expediteur_id`)   REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_destinataire` FOREIGN KEY (`destinataire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_annonce`        FOREIGN KEY (`annonce_id`)      REFERENCES `annonces`(`id`)     ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- avis
-- Routes : avis (dépôt, modification, liste par bien, admin)
-- Un locataire = 1 avis max par bien (contrainte unique)
-- Éligibilité : locataire_loue_id + annonce repassée en PUBLIEE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `avis` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `locataire_id` INT  NOT NULL,
  `bien_id`      INT  NOT NULL,
  `note`         INT  NOT NULL,
  `commentaire`  TEXT DEFAULT NULL,
  `date_avis`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_avis` (`locataire_id`, `bien_id`),
  CONSTRAINT `fk_avis_locataire` FOREIGN KEY (`locataire_id`) REFERENCES `utilisateurs`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_avis_bien`      FOREIGN KEY (`bien_id`)      REFERENCES `biens_immobiliers`(`id`) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- favoris
-- Routes : favoris (ajouter, retirer, liste locataire)
-- Un locataire ne peut favoriser 2 fois la même annonce
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favoris` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `locataire_id` INT NOT NULL,
  `annonce_id`   INT NOT NULL,
  `date_ajout`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_favori_locataire_annonce` (`locataire_id`, `annonce_id`),
  CONSTRAINT `fk_favori_locataire` FOREIGN KEY (`locataire_id`) REFERENCES `utilisateurs`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favori_annonce`   FOREIGN KEY (`annonce_id`)   REFERENCES `annonces`(`id`)     ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

INSERT IGNORE INTO `quartiers` (`nom`, `commune`, `description`) VALUES
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

-- Compte administrateur par défaut
-- Email        : daoudacisse@esp.sn
-- Mot de passe : Admin1234
INSERT IGNORE INTO `utilisateurs` (`nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `role`, `email_verifie`, `actif`)
VALUES (
  'Admin',
  'HomeLink',
  'daoudacisse@esp.sn',
  'scrypt:32768:8:1$SKoYVumV81NsLnys$5fb4a0fe052c0b353b76be75f7468e2ed87941362ce35cc9dee2e737c1ad31bfd569fc83856b335e5851f540d0a07cfda96258556a794089797e8402f1435e86',
  '770000000',
  'administrateur',
  1,
  1
);
