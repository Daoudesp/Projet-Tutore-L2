from extensions import db

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    expediteur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    destinataire_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=True)
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonces.id'), nullable=False)
    contenu = db.Column(db.Text, nullable=False)
    date_envoi = db.Column(db.DateTime, server_default=db.func.now())
    lu = db.Column(db.Boolean, default=False)

    expediteur = db.relationship('Utilisateur', foreign_keys=[expediteur_id], backref='messages_envoyes')
    destinataire = db.relationship('Utilisateur', foreign_keys=[destinataire_id], backref='messages_recus')
    annonce = db.relationship('Annonce', backref='messages')
