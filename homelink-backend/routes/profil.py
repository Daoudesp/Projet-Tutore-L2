import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from extensions import db
from models.utilisateur import Utilisateur
from models.annonce import Annonce
from models.bien_immobilier import BienImmobilier

profil = Blueprint('profil', __name__)


def valider_telephone(tel):
    if not tel:
        return True
    clean = re.sub(r'[\s\-]', '', tel)
    return bool(re.match(r'^(7[0-9]{8}|33[0-9]{7})$', clean))


@profil.route('/profil', methods=['GET'])
@jwt_required()
def get_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    return jsonify({
        'id': utilisateur.id,
        'nom': utilisateur.nom,
        'prenom': utilisateur.prenom,
        'email': utilisateur.email,
        'telephone': utilisateur.telephone,
        'role': utilisateur.role,
        'date_inscription': utilisateur.date_inscription.strftime('%Y-%m-%d') if utilisateur.date_inscription else None,
    }), 200


@profil.route('/profil', methods=['PUT'])
@jwt_required()
def modifier_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    data = request.get_json()

    if 'nom' in data:
        if not data['nom'].strip():
            return jsonify({'message': 'Le nom ne peut pas être vide'}), 400
        utilisateur.nom = data['nom'].strip()

    if 'prenom' in data:
        if not data['prenom'].strip():
            return jsonify({'message': 'Le prénom ne peut pas être vide'}), 400
        utilisateur.prenom = data['prenom'].strip()

    if 'telephone' in data:
        tel = data['telephone'].strip()
        if tel and not valider_telephone(tel):
            return jsonify({'message': 'Numéro de téléphone invalide (ex: 77 123 45 67)'}), 400
        utilisateur.telephone = tel or None

    if 'mot_de_passe' in data:
        if len(data['mot_de_passe']) < 6:
            return jsonify({'message': 'Le mot de passe doit contenir au moins 6 caractères'}), 400
        utilisateur.mot_de_passe = generate_password_hash(data['mot_de_passe'])

    db.session.commit()
    return jsonify({'message': 'Profil mis à jour avec succès'}), 200


@profil.route('/profil', methods=['DELETE'])
@jwt_required()
def supprimer_compte():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    if utilisateur.role == 'administrateur':
        return jsonify({'message': 'Un administrateur ne peut pas supprimer son compte via cette interface'}), 403

    db.session.delete(utilisateur)
    db.session.commit()
    return jsonify({'message': 'Compte supprimé avec succès'}), 200


@profil.route('/profil/annonces', methods=['GET'])
@jwt_required()
def get_mes_annonces():
    utilisateur_id = int(get_jwt_identity())
    liste = (Annonce.query
             .join(BienImmobilier)
             .filter(BienImmobilier.proprietaire_id == utilisateur_id)
             .order_by(Annonce.date_publication.desc())
             .all())
    return jsonify([{
        'id': a.id,
        'titre': a.titre,
        'prix': float(a.prix),
        'statut': a.statut,
        'type_logement': a.bien.type_logement if a.bien else '–',
        'quartier': a.bien.quartier.nom if a.bien and a.bien.quartier else '–',
    } for a in liste]), 200
