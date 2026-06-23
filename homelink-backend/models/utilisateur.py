from extensions import db

class Utilisateur(db.Model):
    __tablename__ = 'utilisateurs'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    mot_de_passe = db.Column(db.String(255), nullable=False)
    telephone = db.Column(db.String(20))
    role = db.Column(db.Enum('locataire', 'proprietaire', 'administrateur'), nullable=False)
    date_inscription = db.Column(db.DateTime, server_default=db.func.now())