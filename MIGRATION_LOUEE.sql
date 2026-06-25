-- ============================================================
-- Migration : Ajout du statut LOUEE dans la table annonces
-- À exécuter dans phpMyAdmin → Onglet SQL
-- ============================================================

ALTER TABLE annonces
  MODIFY COLUMN statut ENUM('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE')
  DEFAULT 'EN_ATTENTE';
