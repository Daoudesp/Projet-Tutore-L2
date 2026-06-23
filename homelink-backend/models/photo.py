from extensions import db

class Photo(db.Model):
    __tablename__ = 'photos'

    id = db.Column(db.Integer, primary_key=True)
    annonce_id = db.Column(db.Integer, db.ForeignKey('annonces.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    ordre = db.Column(db.Integer, default=0)

    annonce = db.relationship('Annonce', backref='photos')