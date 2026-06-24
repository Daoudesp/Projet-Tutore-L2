from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.message import Message
from models.utilisateur import Utilisateur
from models.annonce import Annonce

messages = Blueprint('messages', __name__)


# Envoyer un message (ou une réponse)
@messages.route('/messages', methods=['POST'])
@jwt_required()
def envoyer_message():
    data = request.get_json()
    expediteur_id = int(get_jwt_identity())

    annonce = Annonce.query.get(data['annonce_id'])
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    # Bloquer l'envoi de message à soi-même
    if annonce.bien.proprietaire_id == expediteur_id:
        return jsonify({'message': 'Vous ne pouvez pas envoyer un message pour votre propre annonce'}), 400

    message = Message(
        expediteur_id=expediteur_id,
        destinataire_id=data.get('destinataire_id'),
        annonce_id=data['annonce_id'],
        contenu=data['contenu']
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Message envoyé avec succès'}), 201


# Voir ses messages
@messages.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    if utilisateur.role == 'proprietaire':
        # Messages reçus sur ses annonces (de locataires)
        from models.bien_immobilier import BienImmobilier
        liste = (Message.query
                 .join(Annonce)
                 .join(BienImmobilier)
                 .filter(BienImmobilier.proprietaire_id == utilisateur_id)
                 .filter(Message.expediteur_id != utilisateur_id)
                 .order_by(Message.date_envoi.desc())
                 .all())
        resultat = []
        for msg in liste:
            resultat.append({
                'id': msg.id,
                'contenu': msg.contenu,
                'date_envoi': msg.date_envoi.strftime('%Y-%m-%d %H:%M'),
                'lu': msg.lu,
                'annonce_id': msg.annonce_id,
                'annonce_titre': msg.annonce.titre,
                'expediteur_prenom': msg.expediteur.prenom,
                'expediteur_nom': msg.expediteur.nom,
                'expediteur_id': msg.expediteur_id,
                'expediteur_telephone': msg.expediteur.telephone or '',
            })
    else:
        # Messages envoyés + réponses reçues pour le locataire
        envoyes = (Message.query
                   .filter_by(expediteur_id=utilisateur_id)
                   .order_by(Message.date_envoi.desc())
                   .all())
        recus = (Message.query
                 .filter_by(destinataire_id=utilisateur_id)
                 .order_by(Message.date_envoi.desc())
                 .all())

        resultat = []
        for msg in envoyes:
            resultat.append({
                'id': msg.id,
                'contenu': msg.contenu,
                'date_envoi': msg.date_envoi.strftime('%Y-%m-%d %H:%M'),
                'lu': msg.lu,
                'annonce_id': msg.annonce_id,
                'annonce_titre': msg.annonce.titre,
                'type': 'envoye',
            })
        for msg in recus:
            resultat.append({
                'id': msg.id,
                'contenu': msg.contenu,
                'date_envoi': msg.date_envoi.strftime('%Y-%m-%d %H:%M'),
                'lu': msg.lu,
                'annonce_id': msg.annonce_id,
                'annonce_titre': msg.annonce.titre,
                'expediteur_prenom': msg.expediteur.prenom,
                'expediteur_nom': msg.expediteur.nom,
                'type': 'recu',
            })

    return jsonify(resultat), 200
