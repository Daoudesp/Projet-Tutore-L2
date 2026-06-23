from extensions import db

class Annonce(db.Model):
    __tablename__ = 'annonces'

    id = db.Column(db.Integer, primary_key=True)
    bien_id = db.Column(db.Integer, db.ForeignKey('biens_immobiliers.id'), nullable=False)
    titre = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    prix = db.Column(db.Numeric(10, 2), nullable=False)
    date_publication = db.Column(db.DateTime, server_default=db.func.now())
    date_expiration = db.Column(db.DateTime)
    statut = db.Column(db.Enum('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'EXPIREE'), default='EN_ATTENTE')

    bien = db.relationship('BienImmobilier', backref='annonces')