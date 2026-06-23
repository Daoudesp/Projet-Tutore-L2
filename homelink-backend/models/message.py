from extensions import db

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    expediteur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonces.id'), nullable=False)
    contenu = db.Column(db.Text, nullable=False)
    date_envoi = db.Column(db.DateTime, server_default=db.func.now())
    lu = db.Column(db.Boolean, default=False)

    expediteur = db.relationship('Utilisateur', backref='messages')
    annonce = db.relationship('Annonce', backref='messages')