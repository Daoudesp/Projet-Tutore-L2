from app import app
from extensions import db
from models.utilisateur import Utilisateur
from werkzeug.security import generate_password_hash

with app.app_context():
    # Vérifier si l'admin existe déjà
    existant = Utilisateur.query.filter_by(email='admin@homelink.sn').first()
    if existant:
        print("⚠️  Un admin avec cet email existe déjà.")
    else:
        admin = Utilisateur(
            nom='Admin',
            prenom='HomeLink',
            email='admin@homelink.sn',
            mot_de_passe=generate_password_hash('Admin1234'),
            telephone='770000000',
            role='administrateur'
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin créé avec succès !")
        print("   Email    : admin@homelink.sn")
        print("   Mot de passe : Admin1234")
