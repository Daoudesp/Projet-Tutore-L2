from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models.utilisateur import Utilisateur

auth = Blueprint('auth', __name__)

@auth.route('/inscription', methods=['POST'])
def inscription():
    data = request.get_json()

    # Vérifier si l'email existe déjà
    if Utilisateur.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Cet email est déjà utilisé'}), 400

    # Chiffrer le mot de passe
    mot_de_passe_chiffre = generate_password_hash(data['mot_de_passe'])

    # Créer le nouvel utilisateur
    nouvel_utilisateur = Utilisateur(
        nom=data['nom'],
        prenom=data['prenom'],
        email=data['email'],
        mot_de_passe=mot_de_passe_chiffre,
        telephone=data.get('telephone'),
        role=data['role']
    )

    db.session.add(nouvel_utilisateur)
    db.session.commit()

    return jsonify({'message': 'Compte créé avec succès'}), 201


@auth.route('/connexion', methods=['POST'])
def connexion():
    data = request.get_json()

    # Chercher l'utilisateur par email
    utilisateur = Utilisateur.query.filter_by(email=data['email']).first()

    # Vérifier si l'utilisateur existe et si le mot de passe est correct
    if not utilisateur or not check_password_hash(utilisateur.mot_de_passe, data['mot_de_passe']):
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401

    # Générer le token JWT
    token = create_access_token(identity=str(utilisateur.id))

    return jsonify({
        'token': token,
        'utilisateur': {
            'id': utilisateur.id,
            'nom': utilisateur.nom,
            'prenom': utilisateur.prenom,
            'email': utilisateur.email,
            'telephone': utilisateur.telephone,
            'role': utilisateur.role
        }
    }), 200