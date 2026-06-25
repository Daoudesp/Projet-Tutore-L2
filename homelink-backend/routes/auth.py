import re
import secrets
import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_mail import Message as MailMessage
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db, mail
from models.utilisateur import Utilisateur

auth = Blueprint('auth', __name__)

ROLES_AUTORISES = ('locataire', 'proprietaire')


def valider_email(email):
    # Accepte tous les formats : gmail.com, esp.sn, yahoo.fr, student.esp.sn, etc.
    return re.match(r'^[\w\.\+\-]+@([\w\-]+\.)+[a-z]{2,}$', email, re.IGNORECASE)


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

    email_token = secrets.token_urlsafe(32)

    nouvel_utilisateur = Utilisateur(
        nom=data['nom'].strip(),
        prenom=data['prenom'].strip(),
        email=data['email'].lower().strip(),
        mot_de_passe=generate_password_hash(data['mot_de_passe']),
        telephone=data.get('telephone', '').strip() or None,
        role=data['role'],
        email_verifie=False,
        email_token=email_token
    )
    db.session.add(nouvel_utilisateur)
    db.session.commit()

    # Envoi email de confirmation
    mail_configure = os.getenv('MAIL_USERNAME')
    if mail_configure:
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        lien = f"{frontend_url}/verify-email?token={email_token}"
        try:
            msg_email = MailMessage(
                subject='HomeLink — Confirmez votre adresse email',
                recipients=[nouvel_utilisateur.email],
                html=f"""
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
                  <h2 style="color:#E8572A">🏠 HomeLink</h2>
                  <p>Bonjour <strong>{nouvel_utilisateur.prenom}</strong>,</p>
                  <p>Merci de vous être inscrit sur HomeLink !</p>
                  <p>Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
                  <a href="{lien}"
                     style="display:inline-block;margin:24px 0;padding:14px 28px;
                            background:#E8572A;color:#fff;text-decoration:none;
                            border-radius:8px;font-weight:700">
                    Confirmer mon email
                  </a>
                  <p style="color:#6B5E4C;font-size:0.85rem">
                    Si vous n'avez pas créé de compte, ignorez cet email.
                  </p>
                </div>
                """
            )
            mail.send(msg_email)
        except Exception as e:
            print(f"[MAIL ERROR inscription] {e}")

    return jsonify({'message': 'Compte créé ! Vérifiez votre email pour activer votre compte.'}), 201


@auth.route('/verify-email', methods=['GET'])
def verify_email():
    token = request.args.get('token', '').strip()

    if not token:
        return jsonify({'message': 'Token manquant'}), 400

    utilisateur = Utilisateur.query.filter_by(email_token=token).first()

    if not utilisateur:
        return jsonify({'message': 'Lien invalide ou déjà utilisé'}), 400

    utilisateur.email_verifie = True
    utilisateur.email_token = None
    db.session.commit()

    return jsonify({'message': 'Email confirmé avec succès ! Vous pouvez maintenant vous connecter.'}), 200


@auth.route('/connexion', methods=['POST'])
def connexion():
    data = request.get_json()

    if not data.get('email') or not data.get('mot_de_passe'):
        return jsonify({'message': 'Email et mot de passe obligatoires'}), 400

    utilisateur = Utilisateur.query.filter_by(email=data['email'].lower().strip()).first()

    if not utilisateur or not check_password_hash(utilisateur.mot_de_passe, data['mot_de_passe']):
        return jsonify({'message': 'Email ou mot de passe incorrect'}), 401

    if not utilisateur.email_verifie:
        return jsonify({'message': 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.'}), 403

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

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    lien = f"{frontend_url}/reset-password?token={token}"

    # Envoi de l'email
    mail_configure = os.getenv('MAIL_USERNAME')
    if mail_configure:
        try:
            msg_email = MailMessage(
                subject='HomeLink — Réinitialisation de votre mot de passe',
                recipients=[utilisateur.email],
                html=f"""
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
                  <h2 style="color:#E8572A">🏠 HomeLink</h2>
                  <p>Bonjour <strong>{utilisateur.prenom}</strong>,</p>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                  <p>Cliquez sur le bouton ci-dessous. Ce lien est valable <strong>30 minutes</strong>.</p>
                  <a href="{lien}"
                     style="display:inline-block;margin:24px 0;padding:14px 28px;
                            background:#E8572A;color:#fff;text-decoration:none;
                            border-radius:8px;font-weight:700">
                    Réinitialiser mon mot de passe
                  </a>
                  <p style="color:#6B5E4C;font-size:0.85rem">
                    Si vous n'avez pas fait cette demande, ignorez cet email.
                  </p>
                </div>
                """
            )
            mail.send(msg_email)
        except Exception as e:
            # Si l'email échoue, on log mais on ne bloque pas
            print(f"[MAIL ERROR] {e}")

    return jsonify({
        'message': 'Un lien de réinitialisation a été envoyé à votre adresse email (valable 30 minutes).'
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
