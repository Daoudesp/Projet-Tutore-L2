from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.annonce import Annonce
from models.bien_immobilier import BienImmobilier
from models.photo import Photo

annonces = Blueprint('annonces', __name__)


# Récupérer toutes les annonces publiées
@annonces.route('/annonces', methods=['GET'])
def get_annonces():
    liste = Annonce.query.filter_by(statut='PUBLIEE').all()
    resultat = []
    for annonce in liste:
        premiere_photo = Photo.query.filter_by(annonce_id=annonce.id).order_by(Photo.ordre).first()
        resultat.append({
            'id': annonce.id,
            'titre': annonce.titre,
            'description': annonce.description,
            'prix': float(annonce.prix),
            'statut': annonce.statut,
            'type_logement': annonce.bien.type_logement,
            'quartier': annonce.bien.quartier.nom,
            'photo': premiere_photo.url if premiere_photo else None,
        })
    return jsonify(resultat), 200


# Récupérer le détail d'une annonce
@annonces.route('/annonces/<int:id>', methods=['GET'])
def get_annonce(id):
    annonce = Annonce.query.get(id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    photos = Photo.query.filter_by(annonce_id=annonce.id).order_by(Photo.ordre).all()

    return jsonify({
        'id': annonce.id,
        'titre': annonce.titre,
        'description': annonce.description,
        'prix': float(annonce.prix),
        'statut': annonce.statut,
        'type_logement': annonce.bien.type_logement,
        'quartier': annonce.bien.quartier.nom,
        'adresse': annonce.bien.adresse,
        'surface': float(annonce.bien.surface) if annonce.bien.surface else None,
        'nombre_pieces': annonce.bien.nombre_pieces,
        'etage': annonce.bien.etage,
        'meuble': annonce.bien.meuble,
        'proprietaire_prenom': annonce.bien.proprietaire.prenom,
        'proprietaire_nom': annonce.bien.proprietaire.nom,
        'photos': [p.url for p in photos],
    }), 200


# Publier une annonce (propriétaire connecté)
@annonces.route('/annonces', methods=['POST'])
@jwt_required()
def publier_annonce():
    data = request.get_json()
    utilisateur_id = int(get_jwt_identity())

    bien = BienImmobilier(
        proprietaire_id=utilisateur_id,
        quartier_id=data['quartier_id'],
        adresse=data.get('adresse'),
        surface=data.get('surface'),
        nombre_pieces=data.get('nombre_pieces'),
        nombre_salles_de_bain=data.get('nombre_salles_de_bain'),
        etage=data.get('etage', 0),
        meuble=data.get('meuble', False),
        type_logement=data['type_logement']
    )
    db.session.add(bien)
    db.session.flush()

    annonce = Annonce(
        bien_id=bien.id,
        titre=data['titre'],
        description=data.get('description'),
        prix=data['prix'],
        statut='EN_ATTENTE'
    )
    db.session.add(annonce)
    db.session.commit()

    return jsonify({'message': 'Annonce soumise, en attente de validation', 'annonce_id': annonce.id}), 201


# Supprimer une annonce (propriétaire connecté)
@annonces.route('/annonces/<int:id>', methods=['DELETE'])
@jwt_required()
def supprimer_annonce(id):
    utilisateur_id = int(get_jwt_identity())
    annonce = Annonce.query.get(id)

    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    db.session.delete(annonce)
    db.session.commit()

    return jsonify({'message': 'Annonce supprimée'}), 200


# Modifier une annonce
@annonces.route('/annonces/<int:id>', methods=['PUT'])
@jwt_required()
def modifier_annonce(id):
    utilisateur_id = int(get_jwt_identity())
    annonce = Annonce.query.get(id)

    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    data = request.get_json()

    if 'titre' in data:
        annonce.titre = data['titre']
    if 'description' in data:
        annonce.description = data['description']
    if 'prix' in data:
        annonce.prix = data['prix']
    if 'type_logement' in data:
        annonce.bien.type_logement = data['type_logement']
    if 'adresse' in data:
        annonce.bien.adresse = data['adresse']
    if 'surface' in data:
        annonce.bien.surface = data['surface']
    if 'meuble' in data:
        annonce.bien.meuble = data['meuble']

    annonce.statut = 'EN_ATTENTE'
    db.session.commit()

    return jsonify({'message': 'Annonce modifiée, en attente de validation'}), 200
