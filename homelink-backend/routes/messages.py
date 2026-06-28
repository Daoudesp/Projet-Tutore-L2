import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message as MailMessage
from extensions import db, mail
from models.message import Message
from models.utilisateur import Utilisateur
from models.annonce import Annonce
from utils.mail_async import send_async

messages = Blueprint('messages', __name__)


@messages.route('/messages', methods=['POST'])
@jwt_required()
def envoyer_message():
    data = request.get_json()
    expediteur_id = int(get_jwt_identity())

    expediteur = db.session.get(Utilisateur, expediteur_id)
    if not expediteur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404

    if expediteur.role == 'administrateur':
        return jsonify({'message': 'Les administrateurs ne peuvent pas envoyer de messages'}), 403

    if not data.get('contenu', '').strip():
        return jsonify({'message': 'Le message ne peut pas être vide'}), 400

    annonce_id = data.get('annonce_id')
    if not annonce_id:
        return jsonify({'message': 'annonce_id est obligatoire'}), 400

    annonce = db.session.get(Annonce, annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    proprietaire_id = annonce.bien.proprietaire_id

    # destinataire_id : fourni par le client (réponse proprietaire→locataire)
    # ou déduit automatiquement (premier message locataire→proprietaire)
    destinataire_id = data.get('destinataire_id')
    if not destinataire_id:
        # Premier contact : le destinataire est le propriétaire
        destinataire_id = proprietaire_id

    # Bloquer auto-message (vérifier sur le destinataire final)
    if int(destinataire_id) == expediteur_id:
        return jsonify({'message': 'Vous ne pouvez pas vous envoyer un message à vous-même'}), 400

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

    # Notification email au destinataire
    destinataire = db.session.get(Utilisateur, destinataire_id)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    if destinataire and os.getenv('MAIL_USERNAME'):
        msg_email = MailMessage(
            subject='HomeLink — Vous avez un nouveau message',
            recipients=[destinataire.email],
            html=f"""
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#E8572A">🏠 HomeLink</h2>
              <p>Bonjour <strong>{destinataire.prenom}</strong>,</p>
              <p><strong>{expediteur.prenom} {expediteur.nom}</strong> vous a envoyé un message
              concernant l'annonce <strong>« {annonce.titre} »</strong>.</p>
              <blockquote style="border-left:3px solid #E8572A;padding:10px 16px;color:#4A4035;margin:16px 0;background:#FAFAF8;border-radius:0 8px 8px 0">
                {data['contenu'].strip()[:200]}{'…' if len(data['contenu']) > 200 else ''}
              </blockquote>
              <a href="{frontend_url}/messages"
                 style="display:inline-block;margin:16px 0;padding:12px 24px;
                        background:#E8572A;color:#fff;text-decoration:none;
                        border-radius:8px;font-weight:700">
                Répondre →
              </a>
            </div>
            """
        )
        send_async(current_app._get_current_object(), msg_email)

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


# Liste des conversations (groupées par annonce + interlocuteur)
@messages.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = db.session.get(Utilisateur, utilisateur_id)
    if not utilisateur:
        return jsonify([]), 200

    if utilisateur.role == 'proprietaire':
        from models.bien_immobilier import BienImmobilier
        from sqlalchemy import func
        # Tous les messages reçus par ce proprio, groupés par (annonce, expediteur)
        msgs = (Message.query
                .join(Annonce)
                .join(BienImmobilier)
                .filter(BienImmobilier.proprietaire_id == utilisateur_id)
                .order_by(Message.date_envoi.desc())
                .all())

        vus = set()
        convs = []
        for m in msgs:
            key = (m.annonce_id, m.expediteur_id if m.expediteur_id != utilisateur_id else m.destinataire_id)
            if key in vus:
                continue
            vus.add(key)
            other_id = m.expediteur_id if m.expediteur_id != utilisateur_id else m.destinataire_id
            other = db.session.get(Utilisateur, other_id)
            non_lus = Message.query.filter_by(
                annonce_id=m.annonce_id,
                expediteur_id=other_id,
                destinataire_id=utilisateur_id,
                lu=False
            ).count()
            convs.append({
                'annonce_id': m.annonce_id,
                'annonce_titre': m.annonce.titre if m.annonce else '–',
                'other_user_id': other_id,
                'other_user_prenom': other.prenom if other else '?',
                'other_user_nom': other.nom if other else '?',
                'other_user_telephone': other.telephone or '' if other else '',
                'last_message': m.contenu[:80],
                'last_date': m.date_envoi.strftime('%d/%m/%Y %H:%M'),
                'non_lus': non_lus,
            })
        return jsonify(convs), 200

    else:
        # Locataire : toutes les annonces avec lesquelles il a échangé
        envoy = Message.query.filter_by(expediteur_id=utilisateur_id).all()
        recus = Message.query.filter_by(destinataire_id=utilisateur_id).all()
        tous = envoy + recus

        vus = set()
        convs = []
        for m in sorted(tous, key=lambda x: x.date_envoi, reverse=True):
            other_id = m.destinataire_id if m.expediteur_id == utilisateur_id else m.expediteur_id
            key = (m.annonce_id, other_id)
            if key in vus:
                continue
            vus.add(key)
            other = db.session.get(Utilisateur, other_id)
            non_lus = Message.query.filter_by(
                annonce_id=m.annonce_id,
                expediteur_id=other_id,
                destinataire_id=utilisateur_id,
                lu=False
            ).count()
            convs.append({
                'annonce_id': m.annonce_id,
                'annonce_titre': m.annonce.titre if m.annonce else '–',
                'other_user_id': other_id,
                'other_user_prenom': other.prenom if other else '?',
                'other_user_nom': other.nom if other else '?',
                'other_user_telephone': other.telephone or '' if other else '',
                'last_message': m.contenu[:80],
                'last_date': m.date_envoi.strftime('%d/%m/%Y %H:%M'),
                'non_lus': non_lus,
            })
        return jsonify(convs), 200


# Fil de discussion d'une conversation
@messages.route('/thread', methods=['GET'])
@jwt_required()
def get_thread():
    from flask import request as req
    utilisateur_id = int(get_jwt_identity())
    annonce_id = req.args.get('annonce_id', type=int)
    other_id = req.args.get('other_user_id', type=int)

    if not annonce_id or not other_id:
        return jsonify([]), 200

    fil = Message.query.filter(
        Message.annonce_id == annonce_id,
        db.or_(
            db.and_(Message.expediteur_id == utilisateur_id, Message.destinataire_id == other_id),
            db.and_(
                Message.expediteur_id == other_id,
                db.or_(
                    Message.destinataire_id == utilisateur_id,
                    Message.destinataire_id.is_(None)
                )
            ),
        )
    ).order_by(Message.date_envoi.asc()).all()

    # Marquer les messages reçus comme lus
    for m in fil:
        if m.destinataire_id == utilisateur_id and not m.lu:
            m.lu = True
    db.session.commit()

    return jsonify([{
        'id': m.id,
        'contenu': m.contenu,
        'expediteur_id': m.expediteur_id,
        'date_envoi': m.date_envoi.strftime('%d/%m/%Y %H:%M'),
        'is_mine': m.expediteur_id == utilisateur_id,
        'lu': m.lu,
    } for m in fil]), 200


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
