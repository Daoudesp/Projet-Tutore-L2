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
    liste = Annonce.query.options(opts).filter_by(statut='PUBLIEE').order_by(Annonce.date_publication.desc()).all()
    resultat = []
    for annonce in liste:
        if not annonce.bien or not annonce.bien.quartier:
            continue
        premiere_photo = Photo.query.filter_by(annonce_id=annonce.id).order_by(Photo.ordre).first()
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

    photos = Photo.query.filter_by(annonce_id=annonce.id).order_by(Photo.ordre).all()

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
    utilisateur_id = int(get_jwt_identity())

    u = db.session.get(Utilisateur, utilisateur_id)
    if not u or u.role != 'proprietaire':
        return jsonify({'message': 'Réservé aux propriétaires'}), 403

    if not data.get('titre', '').strip():
        return jsonify({'message': 'Le titre est obligatoire'}), 400
    try:
        prix = float(data.get('prix', 0))
        if prix <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({'message': 'Le loyer doit être un nombre supérieur à 0'}), 400
    if not data.get('quartier_id'):
        return jsonify({'message': 'Le quartier est obligatoire'}), 400
    if not data.get('type_logement'):
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
        prix=data['prix'],
        statut='EN_ATTENTE'
    )
    db.session.add(annonce)
    db.session.commit()

    return jsonify({'message': 'Annonce soumise, en attente de validation', 'annonce_id': annonce.id}), 201


# Changer le statut d'une annonce (propriétaire : LOUEE/PUBLIEE | admin : tous)
@annonces.route('/annonces/<int:id>/statut', methods=['PUT'])
@jwt_required()
def changer_statut(id):
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    annonce = db.session.get(Annonce, id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    data = request.get_json()
    nouveau_statut = data.get('statut', '').upper()

    if utilisateur.role == 'administrateur':
        # Admin peut tout changer
        if nouveau_statut not in STATUTS_VALIDES:
            return jsonify({'message': 'Statut invalide'}), 400
    elif utilisateur.role == 'proprietaire':
        # Propriétaire peut seulement : PUBLIEE → LOUEE ou LOUEE → PUBLIEE
        if annonce.bien.proprietaire_id != utilisateur_id:
            return jsonify({'message': 'Action non autorisée'}), 403
        if nouveau_statut not in ('LOUEE', 'PUBLIEE'):
            return jsonify({'message': 'Action non autorisée'}), 403
        if annonce.statut not in ('PUBLIEE', 'LOUEE'):
            return jsonify({'message': 'Seules les annonces publiées peuvent être modifiées'}), 400

        # Quand on marque LOUEE : enregistrer le locataire désigné
        if nouveau_statut == 'LOUEE':
            locataire_id = data.get('locataire_id')
            if not locataire_id:
                return jsonify({'message': 'Veuillez sélectionner le locataire qui a loué ce logement'}), 400
            locataire = db.session.get(Utilisateur, int(locataire_id))
            if not locataire or locataire.role != 'locataire':
                return jsonify({'message': 'Locataire introuvable'}), 400
            annonce.locataire_loue_id = int(locataire_id)
        # Quand on repasse PUBLIEE : on garde locataire_loue_id (pour l'avis)
    else:
        return jsonify({'message': 'Action non autorisée'}), 403

    annonce.statut = nouveau_statut
    db.session.commit()
    return jsonify({'message': f'Statut mis à jour : {nouveau_statut}'}), 200


# Locataires ayant messagé pour une annonce (pour choisir qui a loué)
@annonces.route('/annonces/<int:id>/locataires-messages', methods=['GET'])
@jwt_required()
def get_locataires_messages(id):
    utilisateur_id = int(get_jwt_identity())
    annonce = db.session.get(Annonce, id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404
    if annonce.bien.proprietaire_id != utilisateur_id:
        return jsonify({'message': 'Action non autorisée'}), 403

    messages = Message.query.filter_by(annonce_id=id).filter(
        Message.expediteur_id != utilisateur_id
    ).all()

    # Dédupliquer par locataire
    vus = set()
    locataires = []
    for m in messages:
        if m.expediteur_id not in vus and m.expediteur and m.expediteur.role == 'locataire':
            vus.add(m.expediteur_id)
            locataires.append({
                'id': m.expediteur_id,
                'prenom': m.expediteur.prenom,
                'nom': m.expediteur.nom,
                'email': m.expediteur.email,
            })

    return jsonify(locataires), 200


# Supprimer une annonce (propriétaire = ses annonces | admin = toutes)
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
    if 'meuble' in data:
        annonce.bien.meuble = data['meuble']

    annonce.statut = 'EN_ATTENTE'
    db.session.commit()
    return jsonify({'message': 'Annonce modifiée, en attente de validation'}), 200
