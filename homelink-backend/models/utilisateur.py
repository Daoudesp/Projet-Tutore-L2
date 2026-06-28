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
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expire = db.Column(db.DateTime, nullable=True)
    email_verifie = db.Column(db.Boolean, default=False, nullable=False)
    email_token = db.Column(db.String(100), nullable=True)
    actif = db.Column(db.Boolean, default=True, nullable=False)
