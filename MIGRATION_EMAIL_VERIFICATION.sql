-- ============================================================
-- Migration : Vérification email à l'inscription
-- À exécuter dans phpMyAdmin → Onglet SQL
-- ============================================================

ALTER TABLE utilisateurs
  ADD COLUMN email_verifie BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN email_token VARCHAR(100) DEFAULT NULL;

-- IMPORTANT : Les comptes existants sont automatiquement activés
-- pour ne pas bloquer les utilisateurs déjà inscrits
UPDATE utilisateurs SET email_verifie = TRUE WHERE email_verifie = FALSE;
