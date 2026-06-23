from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.message import Message

messages = Blueprint('messages', __name__)

# Envoyer un message
@messages.route('/messages', methods=['POST'])
@jwt_required()
def envoyer_message():
    data = request.get_json()
    expediteur_id = int(get_jwt_identity())

    message = Message(
        expediteur_id=expediteur_id,
        annonce_id=data['annonce_id'],
        contenu=data['contenu']
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Message envoyé avec succès'}), 201


# Voir ses messages reçus
@messages.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    utilisateur_id = int(get_jwt_identity())

    liste = Message.query.filter_by(expediteur_id=utilisateur_id).all()
    resultat = []
    for msg in liste:
        resultat.append({
            'id': msg.id,
            'contenu': msg.contenu,
            'date_envoi': msg.date_envoi.strftime('%Y-%m-%d %H:%M'),
            'lu': msg.lu,
            'annonce_id': msg.annonce_id
        })
    return jsonify(resultat), 200