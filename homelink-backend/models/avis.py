from extensions import db

class Avis(db.Model):
    __tablename__ = 'avis'

    id = db.Column(db.Integer, primary_key=True)
    locataire_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    bien_id = db.Column(db.Integer, db.ForeignKey('biens_immobiliers.id'), nullable=False)
    note = db.Column(db.Integer, nullable=False)
    commentaire = db.Column(db.Text)
    date_avis = db.Column(db.DateTime, server_default=db.func.now())

    locataire = db.relationship('Utilisateur', backref='avis')
    bien = db.relationship('BienImmobilier', backref='avis')