from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.avis import Avis
from models.annonce import Annonce
from models.utilisateur import Utilisateur
from models.bien_immobilier import BienImmobilier

avis = Blueprint('avis', __name__)


def avis_to_dict(a):
    return {
        'id': a.id,
        'note': a.note,
        'commentaire': a.commentaire,
        'date_avis': a.date_avis.strftime('%d/%m/%Y') if a.date_avis else '',
        'locataire_id': a.locataire_id,
        'locataire_prenom': a.locataire.prenom if a.locataire else '?',
        'locataire_nom': a.locataire.nom if a.locataire else '?',
    }


# Vérifier si le locataire connecté peut laisser un avis sur un bien
@avis.route('/avis/eligibilite/<int:bien_id>', methods=['GET'])
@jwt_required()
def verifier_eligibilite(bien_id):
    locataire_id = int(get_jwt_identity())
    u = db.session.get(Utilisateur, locataire_id)
    if not u or u.role != 'locataire':
        return jsonify({'peut': False, 'message': 'Réservé aux locataires'}), 200

    # Déjà laissé un avis ?
    existant = Avis.query.filter_by(locataire_id=locataire_id, bien_id=bien_id).first()
    if existant:
        return jsonify({'peut': False, 'message': 'Vous avez déjà laissé un avis'}), 200

    # Chercher une annonce de ce bien où ce locataire est désigné ET l'annonce est PUBLIEE
    annonce_eligible = Annonce.query.filter_by(
        bien_id=bien_id,
        locataire_loue_id=locataire_id,
        statut='PUBLIEE'
    ).first()

    if not annonce_eligible:
        return jsonify({
            'peut': False,
            'message': 'Vous pouvez laisser un avis uniquement après avoir quitté le logement'
        }), 200

    return jsonify({'peut': True}), 200


# Déposer un avis
@avis.route('/avis', methods=['POST'])
@jwt_required()
def deposer_avis():
    locataire_id = int(get_jwt_identity())
    u = db.session.get(Utilisateur, locataire_id)
    if not u or u.role != 'locataire':
        return jsonify({'message': 'Seuls les locataires peuvent déposer un avis'}), 403

    data = request.get_json()
    bien_id = data.get('bien_id')
    note = data.get('note')

    if not bien_id or not note:
        return jsonify({'message': 'bien_id et note sont obligatoires'}), 400
    if int(note) < 1 or int(note) > 5:
        return jsonify({'message': 'La note doit être entre 1 et 5'}), 400

    # Vérifier doublon
    existant = Avis.query.filter_by(locataire_id=locataire_id, bien_id=bien_id).first()
    if existant:
        return jsonify({'message': 'Vous avez déjà laissé un avis pour ce logement'}), 400

    # Vérifier éligibilité : doit être locataire_loue_id et annonce repassée PUBLIEE
    annonce_eligible = Annonce.query.filter_by(
        bien_id=bien_id,
        locataire_loue_id=locataire_id,
        statut='PUBLIEE'
    ).first()
    if not annonce_eligible:
        return jsonify({'message': 'Vous ne pouvez pas laisser un avis sur ce logement'}), 403

    nouvel_avis = Avis(
        locataire_id=locataire_id,
        bien_id=bien_id,
        note=int(note),
        commentaire=data.get('commentaire', '').strip() or None
    )
    db.session.add(nouvel_avis)
    db.session.commit()

    return jsonify({'message': 'Avis déposé avec succès', 'avis': avis_to_dict(nouvel_avis)}), 201


# Voir les avis d'un bien
@avis.route('/avis/<int:bien_id>', methods=['GET'])
def get_avis(bien_id):
    liste = Avis.query.filter_by(bien_id=bien_id).order_by(Avis.date_avis.desc()).all()
    return jsonify([avis_to_dict(a) for a in liste]), 200


# Admin — tous les avis
@avis.route('/admin/avis', methods=['GET'])
@jwt_required()
def get_all_avis():
    utilisateur_id = int(get_jwt_identity())
    u = Utilisateur.query.get(utilisateur_id)
    if not u or u.role != 'administrateur':
        return jsonify({'message': 'Accès refusé'}), 403

    liste = Avis.query.order_by(Avis.date_avis.desc()).all()
    resultat = []
    for a in liste:
        bien = BienImmobilier.query.get(a.bien_id)
        resultat.append({
            **avis_to_dict(a),
            'bien_adresse': bien.adresse if bien else '–',
            'bien_type': bien.type_logement if bien else '–',
        })
    return jsonify(resultat), 200
