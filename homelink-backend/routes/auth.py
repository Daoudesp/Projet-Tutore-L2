import re
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models.utilisateur import Utilisateur

auth = Blueprint('auth', __name__)

ROLES_AUTORISES = ('locataire', 'proprietaire')


def valider_email(email):
    return re.match(r'^[\w\.\+\-]+@[\w\-]+\.[a-z]{2,}$', email, re.IGNORECASE)


@auth.route('/inscription', methods=['POST'])
def inscription():
    data = request.get_json()

    for champ in ('nom', 'prenom', 'email', 'mot_de_passe', 'role'):
        if not data.get(champ, '').strip():
            return jsonify({'message': f'Le champ "{champ}" est obligatoire'}), 400

    if not valider_email(data['email']):
        return jsonify({'message': 'Adresse email invalide'}), 400

    if len(data['mot_de_passe']) < 6:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    if data['role'] not in ROLES_AUTORISES:
        return jsonify({'message': 'Rôle invalide'}), 400

    if Utilisateur.query.filter_by(email=data['email'].lower().strip()).first():
        return jsonify({'message': 'Cet email est déjà utilisé'}), 400

    nouvel_utilisateur = Utilisateur(
        nom=data['nom'].strip(),
        prenom=data['prenom'].strip(),
        email=data['email'].lower().strip(),
        mot_de_passe=generate_password_hash(data['mot_de_passe']),
        telephone=data.get('telephone', '').strip() or None,
        role=data['role']
    )
    db.session.add(nouvel_utilisateur)
    db.session.commit()
    return jsonify({'message': 'Compte créé avec succès'}), 201


@auth.route('/connexion', methods=['POST'])
def connexion():
    data = request.get_json()

    if not data.get('email') or not data.get('mot_de_passe'):
        return jsonify({'message': 'Email et mot de passe obligatoires'}), 400

    utilisateur = Utilisateur.query.filter_by(email=data['email'].lower().strip()).first()

    if not utilisateur or not check_password_hash(utilisateur.mot_de_passe, data['mot_de_passe']):
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401

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


# ── MOT DE PASSE OUBLIÉ ──────────────────────────────────────────────────────

@auth.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'message': 'Email obligatoire'}), 400

    utilisateur = Utilisateur.query.filter_by(email=email).first()

    # Toujours répondre 200 pour ne pas exposer si l'email existe
    if not utilisateur:
        return jsonify({
            'message': 'Si cet email existe, un lien de réinitialisation a été généré.',
            'demo_token': None
        }), 200

    token = secrets.token_urlsafe(32)
    utilisateur.reset_token = token
    utilisateur.reset_token_expire = datetime.utcnow() + timedelta(minutes=30)
    db.session.commit()

    # En production : envoyer par email
    # Pour la démonstration : retourner le token dans la réponse
    return jsonify({
        'message': 'Lien de réinitialisation généré (valable 30 minutes).',
        'demo_token': token  # ⚠️ À remplacer par un envoi d'email en production
    }), 200


@auth.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token', '').strip()
    nouveau_mdp = data.get('mot_de_passe', '')

    if not token or not nouveau_mdp:
        return jsonify({'message': 'Token et nouveau mot de passe obligatoires'}), 400

    if len(nouveau_mdp) < 6:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    utilisateur = Utilisateur.query.filter_by(reset_token=token).first()

    if not utilisateur:
        return jsonify({'message': 'Lien invalide ou déjà utilisé'}), 400

    if utilisateur.reset_token_expire < datetime.utcnow():
        utilisateur.reset_token = None
        utilisateur.reset_token_expire = None
        db.session.commit()
        return jsonify({'message': 'Lien expiré. Veuillez faire une nouvelle demande.'}), 400

    utilisateur.mot_de_passe = generate_password_hash(nouveau_mdp)
    utilisateur.reset_token = None
    utilisateur.reset_token_expire = None
    db.session.commit()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200
