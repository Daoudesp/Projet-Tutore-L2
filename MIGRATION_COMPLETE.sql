-- ============================================================
-- MIGRATION COMPLÈTE HomeLink
-- À exécuter sur une base existante pour la mettre à jour
-- sans perdre les données
-- ============================================================

USE homelink;

-- ============================================================
-- 1. TABLE utilisateurs — ajout des colonnes manquantes
-- ============================================================
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS email_verifie      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_token        VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token        VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expire DATETIME     DEFAULT NULL;

-- Les comptes existants sont considérés comme déjà vérifiés
UPDATE utilisateurs SET email_verifie = TRUE WHERE email_verifie = FALSE;

-- ============================================================
-- 2. TABLE quartiers — suppression de prix_moyen_loyer
-- ============================================================
ALTER TABLE quartiers
  DROP COLUMN IF EXISTS prix_moyen_loyer;

-- ============================================================
-- 3. TABLE annonces — ajout de LOUEE dans l'enum + locataire_loue_id
-- ============================================================
ALTER TABLE annonces
  MODIFY COLUMN statut ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE')
  DEFAULT 'EN_ATTENTE';

ALTER TABLE annonces
  ADD COLUMN IF NOT EXISTS locataire_loue_id INT DEFAULT NULL,
  ADD CONSTRAINT fk_locataire_loue
    FOREIGN KEY (locataire_loue_id) REFERENCES utilisateurs(id) ON DELETE SET NULL;

-- ============================================================
-- 4. TABLE messages — ajout de destinataire_id
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS destinataire_id INT DEFAULT NULL,
  ADD CONSTRAINT fk_msg_destinataire
    FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id);

-- ============================================================
-- 5. TABLE avis — contrainte unicité locataire/bien
-- ============================================================
ALTER IGNORE TABLE avis
  ADD UNIQUE KEY unique_avis (locataire_id, bien_id);

-- ============================================================
-- 6. TABLE favoris — création si elle n'existe pas
-- ============================================================
CREATE TABLE IF NOT EXISTS favoris (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    locataire_id INT NOT NULL,
    annonce_id   INT NOT NULL,
    date_ajout   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favori (locataire_id, annonce_id),
    FOREIGN KEY (locataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (annonce_id)   REFERENCES annonces(id)    ON DELETE CASCADE
);

-- ============================================================
-- 7. Quartiers manquants (si pas encore insérés)
-- ============================================================
INSERT IGNORE INTO quartiers (nom, commune, description) VALUES
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
