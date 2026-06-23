from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import cloudinary
import cloudinary.uploader
from extensions import db
from models.annonce import Annonce
from models.photo import Photo
import os

photos = Blueprint('photos', __name__)

# Configurer Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Uploader une photo pour une annonce
@photos.route('/annonces/<int:annonce_id>/photos', methods=['POST'])
@jwt_required()
def upload_photo(annonce_id):
    utilisateur_id = int(get_jwt_identity())

    # Vérifier que l'annonce existe et appartient au propriétaire
    annonce = Annonce.query.get(annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    # Récupérer le fichier envoyé
    if 'photo' not in request.files:
        return jsonify({'message': 'Aucune photo envoyée'}), 400

    fichier = request.files['photo']

    # Envoyer la photo vers Cloudinary
    resultat = cloudinary.uploader.upload(
        fichier,
        folder='homelink/annonces'
    )

    # Sauvegarder l'URL dans MySQL
    photo = Photo(
        annonce_id=annonce_id,
        url=resultat['secure_url'],
        ordre=0
    )
    db.session.add(photo)
    db.session.commit()

    return jsonify({
        'message': 'Photo uploadée avec succès',
        'url': resultat['secure_url']
    }), 201


# Voir les photos d'une annonce
@photos.route('/annonces/<int:annonce_id>/photos', methods=['GET'])
def get_photos(annonce_id):
    liste = Photo.query.filter_by(annonce_id=annonce_id).all()
    resultat = []
    for photo in liste:
        resultat.append({
            'id': photo.id,
            'url': photo.url,
            'ordre': photo.ordre
        })
    return jsonify(resultat), 200