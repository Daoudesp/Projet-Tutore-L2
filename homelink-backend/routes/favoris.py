from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.favori import Favori
from models.annonce import Annonce
from models.photo import Photo
from models.utilisateur import Utilisateur

favoris = Blueprint('favoris', __name__)


@favoris.route('/favoris/<int:annonce_id>', methods=['POST'])
@jwt_required()
def ajouter_favori(annonce_id):
    locataire_id = int(get_jwt_identity())

    # Seuls les locataires peuvent avoir des favoris
    u = db.session.get(Utilisateur, locataire_id)
    if not u or u.role != 'locataire':
        return jsonify({'message': 'Seuls les locataires peuvent ajouter des favoris'}), 403

    annonce = db.session.get(Annonce, annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.statut != 'PUBLIEE':
        return jsonify({'message': 'Cette annonce n\'est pas disponible'}), 400

    if Favori.query.filter_by(locataire_id=locataire_id, annonce_id=annonce_id).first():
        return jsonify({'message': 'Annonce déjà dans les favoris'}), 400

    favori = Favori(locataire_id=locataire_id, annonce_id=annonce_id)
    db.session.add(favori)
    db.session.commit()

    return jsonify({'message': 'Annonce ajoutée aux favoris'}), 201


@favoris.route('/favoris', methods=['GET'])
@jwt_required()
def get_favoris():
    locataire_id = int(get_jwt_identity())
    liste = Favori.query.filter_by(locataire_id=locataire_id).all()

    resultat = []
    for favori in liste:
        if not favori.annonce:
            continue
        premiere_photo = Photo.query.filter_by(annonce_id=favori.annonce_id).order_by(Photo.ordre).first()
        resultat.append({
            'id': favori.id,
            'annonce_id': favori.annonce_id,
            'titre': favori.annonce.titre,
            'prix': float(favori.annonce.prix),
            'quartier': favori.annonce.bien.quartier.nom if favori.annonce.bien and favori.annonce.bien.quartier else '–',
            'type_logement': favori.annonce.bien.type_logement if favori.annonce.bien else '–',
            'date_ajout': favori.date_ajout.strftime('%d/%m/%Y %H:%M'),
            'photo': premiere_photo.url if premiere_photo else None,
        })
    return jsonify(resultat), 200


@favoris.route('/favoris/<int:annonce_id>', methods=['DELETE'])
@jwt_required()
def supprimer_favori(annonce_id):
    locataire_id = int(get_jwt_identity())

    favori = Favori.query.filter_by(locataire_id=locataire_id, annonce_id=annonce_id).first()
    if not favori:
        return jsonify({'message': 'Favori introuvable'}), 404

    db.session.delete(favori)
    db.session.commit()

    return jsonify({'message': 'Favori supprimé'}), 200
