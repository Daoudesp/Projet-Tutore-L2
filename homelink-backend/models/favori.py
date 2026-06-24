from extensions import db

class Favori(db.Model):
    __tablename__ = 'favoris'
    __table_args__ = (
        db.UniqueConstraint('locataire_id', 'annonce_id', name='uq_favori_locataire_annonce'),
    )

    id = db.Column(db.Integer, primary_key=True)
    locataire_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonces.id'), nullable=False)
    date_ajout = db.Column(db.DateTime, server_default=db.func.now())

    locataire = db.relationship('Utilisateur', backref='favoris')
    annonce = db.relationship('Annonce', backref='favoris')
