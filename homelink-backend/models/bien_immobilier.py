from extensions import db

class BienImmobilier(db.Model):
    __tablename__ = 'biens_immobiliers'

    id = db.Column(db.Integer, primary_key=True)
    proprietaire_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    quartier_id = db.Column(db.Integer, db.ForeignKey('quartiers.id'), nullable=False)
    adresse = db.Column(db.String(255))
    ville = db.Column(db.String(100), default='Dakar')
    surface = db.Column(db.Numeric(8, 2))
    nombre_pieces = db.Column(db.Integer)
    nombre_salles_de_bain = db.Column(db.Integer)
    etage = db.Column(db.Integer, default=0)
    meuble = db.Column(db.Boolean, default=False)
    type_logement = db.Column(db.Enum('CHAMBRE', 'STUDIO', 'APPARTEMENT', 'VILLA'), nullable=False)

    quartier = db.relationship('Quartier', backref='biens')
    proprietaire = db.relationship('Utilisateur', backref='biens')