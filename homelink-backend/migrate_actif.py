"""
Script de migration : ajoute la colonne `actif` à la table utilisateurs.
Exécuter UNE SEULE FOIS : python migrate_actif.py
"""
from app import app
from extensions import db
from sqlalchemy import text

with app.app_context():
    try:
        db.session.execute(text(
            "ALTER TABLE utilisateurs ADD COLUMN actif TINYINT(1) NOT NULL DEFAULT 1"
        ))
        db.session.commit()
        print("✅ Colonne 'actif' ajoutée avec succès.")
    except Exception as e:
        if "Duplicate column name" in str(e) or "already exists" in str(e).lower():
            print("ℹ️  Colonne 'actif' déjà présente, rien à faire.")
        else:
            print(f"❌ Erreur : {e}")
