from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.annonce import Annonce
from models.bien_immobilier import BienImmobilier
from models.photo import Photo
from models.utilisateur import Utilisateur
from models.message import Message
from models.quartier import Quartier
from sqlalchemy.orm import joinedload

annonces = Blueprint('annonces', __name__)

STATUTS_VALIDES = ('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE', 'LOUEE', 'EXPIREE')


# Récupérer toutes les annonces publiées
@annonces.route('/annonces', methods=['GET'])
def get_annonces():
    opts = joinedload(Annonce.bien).joinedload(BienImmobilier.quartier)

    liste = (
        Annonce.query
        .options(opts)
        .filter_by(statut='PUBLIEE')
        .order_by(Annonce.date_publication.desc())
        .all()
    )

    resultat = []

    for annonce in liste:
        if not annonce.bien or not annonce.bien.quartier:
            continue

        premiere_photo = (
            Photo.query
            .filter_by(annonce_id=annonce.id)
            .order_by(Photo.id)
            .first()
        )

        resultat.append({
            'id': annonce.id,
            'titre': annonce.titre,
            'description': annonce.description,
            'prix': float(annonce.prix),
            'statut': annonce.statut,
            'type_logement': annonce.bien.type_logement,
            'quartier': annonce.bien.quartier.nom,
            'surface': float(annonce.bien.surface) if annonce.bien.surface else None,
            'meuble': annonce.bien.meuble,
            'photo': premiere_photo.url if premiere_photo else None,
        })

    return jsonify(resultat), 200


# Récupérer le détail d'une annonce
@annonces.route('/annonces/<int:id>', methods=['GET'])
def get_annonce(id):
    annonce = db.session.get(Annonce, id)

    if not annonce or not annonce.bien or not annonce.bien.quartier:
        return jsonify({'message': 'Annonce introuvable'}), 404

    photos = (
        Photo.query
        .filter_by(annonce_id=annonce.id)
        .order_by(Photo.id)
        .all()
    )

    return jsonify({
        'id': annonce.id,
        'titre': annonce.titre,
        'description': annonce.description,
        'prix': float(annonce.prix),
        'statut': annonce.statut,
        'type_logement': annonce.bien.type_logement,
        'quartier': annonce.bien.quartier.nom,
        'quartier_commune': annonce.bien.quartier.commune,
        'quartier_description': annonce.bien.quartier.description,
        'adresse': annonce.bien.adresse,
        'surface': float(annonce.bien.surface) if annonce.bien.surface else None,
        'nombre_pieces': annonce.bien.nombre_pieces,
        'nombre_salles_de_bain': annonce.bien.nombre_salles_de_bain,
        'etage': annonce.bien.etage,
        'meuble': annonce.bien.meuble,
        'bien_id': annonce.bien_id,
        'proprietaire_prenom': annonce.bien.proprietaire.prenom,
        'proprietaire_nom': annonce.bien.proprietaire.nom,
        'photos': [p.url for p in photos],
    }), 200


# Publier une annonce (propriétaire connecté)
@annonces.route('/annonces', methods=['POST'])
@jwt_required()
def publier_annonce():
    data = request.get_json()

    print("===== DATA RECUE =====")
    print(data)

    utilisateur_id = int(get_jwt_identity())

    u = db.session.get(Utilisateur, utilisateur_id)
    if not u or u.role != 'proprietaire':
        return jsonify({'message': 'Réservé aux propriétaires'}), 403

    if not data.get('titre', '').strip():
        print("ERREUR : titre manquant")
        return jsonify({'message': 'Le titre est obligatoire'}), 400

    try:
        prix = float(data.get('prix', 0))
        if prix <= 0:
            raise ValueError
    except (TypeError, ValueError):
        print("ERREUR : prix invalide")
        return jsonify({'message': 'Le loyer doit être un nombre supérieur à 0'}), 400

    if not data.get('quartier_id'):
        print("ERREUR : quartier_id manquant")
        return jsonify({'message': 'Le quartier est obligatoire'}), 400

    if not data.get('type_logement'):
        print("ERREUR : type_logement manquant")
        return jsonify({'message': 'Le type de logement est obligatoire'}), 400

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
        prix=prix,
        statut='EN_ATTENTE'
    )

    db.session.add(annonce)
    db.session.commit()

    return jsonify({
        'message': 'Annonce soumise, en attente de validation',
        'annonce_id': annonce.id
    }), 201


# Locataires ayant messagé pour une annonce
@annonces.route('/annonces/<int:id>/locataires-messages', methods=['GET'])
@jwt_required()
def get_locataires_messages(id):
    utilisateur_id = int(get_jwt_identity())

    annonce = db.session.get(Annonce, id)

    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    messages = (
        Message.query
        .filter_by(annonce_id=id)
        .filter(Message.expediteur_id != utilisateur_id)
        .all()
    )

    vus = set()
    locataires = []

    for m in messages:
        if (
            m.expediteur_id not in vus
            and m.expediteur
            and m.expediteur.role == 'locataire'
        ):
            vus.add(m.expediteur_id)

            locataires.append({
                'id': m.expediteur_id,
                'prenom': m.expediteur.prenom,
                'nom': m.expediteur.nom,
                'email': m.expediteur.email,
            })

    return jsonify(locataires), 200


# Supprimer une annonce
@annonces.route('/annonces/<int:id>', methods=['DELETE'])
@jwt_required()
def supprimer_annonce(id):
    utilisateur_id = int(get_jwt_identity())

    utilisateur = db.session.get(Utilisateur, utilisateur_id)

    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    annonce = db.session.get(Annonce, id)

    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    if utilisateur.role != 'administrateur':
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

    annonce = db.session.get(Annonce, id)

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

    if 'nombre_pieces' in data:
        annonce.bien.nombre_pieces = data['nombre_pieces']

    if 'nombre_salles_de_bain' in data:
        annonce.bien.nombre_salles_de_bain = data['nombre_salles_de_bain']

    if 'etage' in data:
        annonce.bien.etage = data['etage']

    if 'meuble' in data:
        annonce.bien.meuble = data['meuble']

    annonce.statut = 'EN_ATTENTE'

    db.session.commit()

    return jsonify({
        'message': 'Annonce modifiée, en attente de validation'
    }), 200