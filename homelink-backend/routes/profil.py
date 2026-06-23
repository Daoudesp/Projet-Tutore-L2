from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from extensions import db
from models.utilisateur import Utilisateur

profil = Blueprint('profil', __name__)

# Voir son profil
@profil.route('/profil', methods=['GET'])
@jwt_required()
def get_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    return jsonify({
        'id': utilisateur.id,
        'nom': utilisateur.nom,
        'prenom': utilisateur.prenom,
        'email': utilisateur.email,
        'telephone': utilisateur.telephone,
        'role': utilisateur.role,
        'date_inscription': utilisateur.date_inscription.strftime('%Y-%m-%d')
    }), 200


# Modifier son profil
@profil.route('/profil', methods=['PUT'])
@jwt_required()
def modifier_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)
    data = request.get_json()

    if 'nom' in data:
        utilisateur.nom = data['nom']
    if 'prenom' in data:
        utilisateur.prenom = data['prenom']
    if 'telephone' in data:
        utilisateur.telephone = data['telephone']
    if 'mot_de_passe' in data:
        utilisateur.mot_de_passe = generate_password_hash(data['mot_de_passe'])

    db.session.commit()

    return jsonify({'message': 'Profil mis à jour avec succès'}), 200