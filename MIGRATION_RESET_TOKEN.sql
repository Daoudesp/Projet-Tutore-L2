-- ============================================================
-- Migration : Ajout des colonnes reset_token sur utilisateurs
-- À exécuter dans phpMyAdmin → Onglet SQL
-- ============================================================

ALTER TABLE utilisateurs
  ADD COLUMN reset_token VARCHAR(100) DEFAULT NULL,
  ADD COLUMN reset_token_expire DATETIME DEFAULT NULL;
