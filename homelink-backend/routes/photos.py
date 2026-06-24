import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import cloudinary
import cloudinary.uploader
from extensions import db
from models.annonce import Annonce
from models.photo import Photo

photos = Blueprint('photos', __name__)

MIMES_AUTORISES = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}
TAILLE_MAX_OCTETS = 5 * 1024 * 1024  # 5 Mo
MAX_PHOTOS_PAR_ANNONCE = 5

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)


@photos.route('/photos/<int:annonce_id>', methods=['POST'])
@jwt_required()
def upload_photo(annonce_id):
    utilisateur_id = int(get_jwt_identity())

    annonce = db.session.get(Annonce, annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    nb_photos = Photo.query.filter_by(annonce_id=annonce_id).count()
    if nb_photos >= MAX_PHOTOS_PAR_ANNONCE:
        return jsonify({'message': f'Maximum {MAX_PHOTOS_PAR_ANNONCE} photos par annonce'}), 400

    if 'photo' not in request.files:
        return jsonify({'message': 'Aucune photo envoyée'}), 400

    fichier = request.files['photo']

    # Validation type MIME
    if fichier.content_type not in MIMES_AUTORISES:
        return jsonify({'message': 'Format non accepté. Utilisez JPG, PNG ou WebP'}), 400

    # Validation taille
    fichier.seek(0, 2)
    taille = fichier.tell()
    fichier.seek(0)
    if taille > TAILLE_MAX_OCTETS:
        return jsonify({'message': 'La photo ne doit pas dépasser 5 Mo'}), 400

    try:
        resultat = cloudinary.uploader.upload(
            fichier,
            folder='homelink/annonces',
            resource_type='image',
        )
    except Exception as e:
        return jsonify({'message': f'Erreur upload Cloudinary : {str(e)}'}), 500

    photo = Photo(
        annonce_id=annonce_id,
        url=resultat['secure_url'],
        ordre=nb_photos
    )
    db.session.add(photo)
    db.session.commit()

    return jsonify({'message': 'Photo uploadée avec succès', 'url': resultat['secure_url']}), 201


@photos.route('/photos/<int:annonce_id>', methods=['GET'])
def get_photos(annonce_id):
    liste = Photo.query.filter_by(annonce_id=annonce_id).order_by(Photo.ordre).all()
    return jsonify([{'id': p.id, 'url': p.url, 'ordre': p.ordre} for p in liste]), 200
