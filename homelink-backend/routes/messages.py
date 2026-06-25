from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.message import Message
from models.utilisateur import Utilisateur
from models.annonce import Annonce

messages = Blueprint('messages', __name__)


@messages.route('/messages', methods=['POST'])
@jwt_required()
def envoyer_message():
    data = request.get_json()
    expediteur_id = int(get_jwt_identity())

    expediteur = db.session.get(Utilisateur, expediteur_id)
    if not expediteur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    if not data.get('contenu', '').strip():
        return jsonify({'message': 'Le message ne peut pas être vide'}), 400

    annonce_id = data.get('annonce_id')
    if not annonce_id:
        return jsonify({'message': 'annonce_id est obligatoire'}), 400

    annonce = db.session.get(Annonce, annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    proprietaire_id = annonce.bien.proprietaire_id

    # Bloquer auto-message
    if proprietaire_id == expediteur_id:
        return jsonify({'message': 'Vous ne pouvez pas envoyer un message pour votre propre annonce'}), 400

    # destinataire_id : fourni par le client (réponse proprietaire→locataire)
    # ou déduit automatiquement (premier message locataire→proprietaire)
    destinataire_id = data.get('destinataire_id')
    if not destinataire_id:
        # Premier contact : le destinataire est le propriétaire
        destinataire_id = proprietaire_id

    # Vérifier que le destinataire existe
    if not db.session.get(Utilisateur, destinataire_id):
        return jsonify({'message': 'Destinataire introuvable'}), 404

    message = Message(
        expediteur_id=expediteur_id,
        destinataire_id=destinataire_id,
        annonce_id=annonce_id,
        contenu=data['contenu'].strip()
    )
    db.session.add(message)
    db.session.commit()

    return jsonify({'message': 'Message envoyé avec succès'}), 201


@messages.route('/messages', methods=['GET'])
@jwt_required()
def get_messages():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)

    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    if utilisateur.role == 'proprietaire':
        from models.bien_immobilier import BienImmobilier
        liste = (Message.query
                 .join(Annonce)
                 .join(BienImmobilier)
                 .filter(BienImmobilier.proprietaire_id == utilisateur_id)
                 .filter(Message.expediteur_id != utilisateur_id)
                 .order_by(Message.date_envoi.desc())
                 .all())

        # Marquer tous comme lus
        for msg in liste:
            if not msg.lu:
                msg.lu = True
        db.session.commit()

        resultat = [{
            'id': msg.id,
            'contenu': msg.contenu,
            'date_envoi': msg.date_envoi.strftime('%d/%m/%Y %H:%M'),
            'lu': True,
            'annonce_id': msg.annonce_id,
            'annonce_titre': msg.annonce.titre if msg.annonce else '–',
            'expediteur_prenom': msg.expediteur.prenom if msg.expediteur else '?',
            'expediteur_nom': msg.expediteur.nom if msg.expediteur else '?',
            'expediteur_id': msg.expediteur_id,
            'expediteur_telephone': msg.expediteur.telephone or '' if msg.expediteur else '',
        } for msg in liste]

    else:
        envoyes = (Message.query
                   .filter_by(expediteur_id=utilisateur_id)
                   .order_by(Message.date_envoi.desc()).all())
        recus = (Message.query
                 .filter_by(destinataire_id=utilisateur_id)
                 .order_by(Message.date_envoi.desc()).all())

        # Marquer les messages reçus comme lus
        for msg in recus:
            if not msg.lu:
                msg.lu = True
        db.session.commit()

        resultat = []
        for msg in envoyes:
            resultat.append({
                'id': msg.id,
                'contenu': msg.contenu,
                'date_envoi': msg.date_envoi.strftime('%d/%m/%Y %H:%M'),
                'lu': msg.lu,
                'annonce_id': msg.annonce_id,
                'annonce_titre': msg.annonce.titre if msg.annonce else '–',
                'type': 'envoye',
            })
        for msg in recus:
            resultat.append({
                'id': msg.id,
                'contenu': msg.contenu,
                'date_envoi': msg.date_envoi.strftime('%d/%m/%Y %H:%M'),
                'lu': msg.lu,
                'annonce_id': msg.annonce_id,
                'annonce_titre': msg.annonce.titre if msg.annonce else '–',
                'expediteur_id': msg.expediteur_id,
                'expediteur_prenom': msg.expediteur.prenom if msg.expediteur else '?',
                'expediteur_nom': msg.expediteur.nom if msg.expediteur else '?',
                'type': 'recu',
            })

    return jsonify(resultat), 200


# Nombre de messages non lus (pour le badge navbar)
@messages.route('/messages/non-lus', methods=['GET'])
@jwt_required()
def count_non_lus():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify({'count': 0}), 200

    if utilisateur.role == 'proprietaire':
        from models.bien_immobilier import BienImmobilier
        count = (Message.query
                 .join(Annonce)
                 .join(BienImmobilier)
                 .filter(BienImmobilier.proprietaire_id == utilisateur_id)
                 .filter(Message.expediteur_id != utilisateur_id)
                 .filter(Message.lu == False)
                 .count())
    else:
        count = Message.query.filter_by(
            destinataire_id=utilisateur_id, lu=False
        ).count()

    return jsonify({'count': count}), 200
