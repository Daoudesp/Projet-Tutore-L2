from extensions import db

class Quartier(db.Model):
    __tablename__ = 'quartiers'

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    commune = db.Column(db.String(100))
    description = db.Column(db.Text)