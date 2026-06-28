from flask import Blueprint, jsonify, request as flask_request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.annonce import Annonce
from models.utilisateur import Utilisateur
from models.photo import Photo
from models.avis import Avis
from sqlalchemy.orm import joinedload
from models.bien_immobilier import BienImmobilier

admin = Blueprint('admin', __name__)


def check_admin(utilisateur_id):
    u = Utilisateur.query.get(utilisateur_id)
    return u and u.role == 'administrateur'


# Stats du tableau de bord
@admin.route('/admin/stats', methods=['GET'])
@jwt_required()
def get_stats():
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    return jsonify({
        'en_attente': Annonce.query.filter_by(statut='EN_ATTENTE').count(),
        'publiees': Annonce.query.filter_by(statut='PUBLIEE').count(),
        'proprietaires': Utilisateur.query.filter_by(role='proprietaire').count(),
        'locataires': Utilisateur.query.filter_by(role='locataire').count(),
    }), 200


# Liste des utilisateurs
@admin.route('/admin/utilisateurs', methods=['GET'])
@jwt_required()
def get_utilisateurs():
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    liste = Utilisateur.query.order_by(Utilisateur.date_inscription.desc()).all()
    return jsonify([{
        'id': u.id,
        'nom': u.nom,
        'prenom': u.prenom,
        'email': u.email,
        'telephone': u.telephone or '',
        'role': u.role,
        'date_inscription': u.date_inscription.strftime('%Y-%m-%d'),
        'actif': u.actif,
    } for u in liste]), 200


# Voir toutes les annonces (avec filtre optionnel ?statut=EN_ATTENTE)
@admin.route('/admin/annonces', methods=['GET'])
@jwt_required()
def get_annonces_en_attente():
    from flask import request as req
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    statut_filtre = req.args.get('statut')
    STATUTS_VALIDES = ('EN_ATTENTE', 'PUBLIEE', 'SUSPENDUE')
    opts = joinedload(Annonce.bien).joinedload(BienImmobilier.quartier)
    if statut_filtre:
        if statut_filtre not in STATUTS_VALIDES:
            return jsonify({'message': 'Statut invalide'}), 400
        liste = Annonce.query.options(opts).filter_by(statut=statut_filtre).order_by(Annonce.date_publication.desc()).all()
    else:
        liste = Annonce.query.options(opts).order_by(Annonce.date_publication.desc()).all()

    def annonce_dict(a):
        if not a.bien:
            return None
        photo = Photo.query.filter_by(annonce_id=a.id).order_by(Photo.ordre).first()
        return {
            'id': a.id,
            'titre': a.titre,
            'prix': float(a.prix),
            'statut': a.statut,
            'type_logement': a.bien.type_logement,
            'quartier': a.bien.quartier.nom if a.bien.quartier else '–',
            'photo': photo.url if photo else None,
        }

    return jsonify([d for d in (annonce_dict(a) for a in liste) if d is not None]), 200


# Valider une annonce
@admin.route('/admin/annonces/<int:id>/valider', methods=['PUT'])
@jwt_required()
def valider_annonce(id):
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    annonce = Annonce.query.get(id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    annonce.statut = 'PUBLIEE'
    db.session.commit()
    return jsonify({'message': 'Annonce validée et publiée'}), 200


# Rejeter une annonce
@admin.route('/admin/annonces/<int:id>/rejeter', methods=['PUT'])
@jwt_required()
def rejeter_annonce(id):
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    annonce = Annonce.query.get(id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    annonce.statut = 'SUSPENDUE'
    db.session.commit()
    return jsonify({'message': 'Annonce rejetée'}), 200


# Bloquer / débloquer un utilisateur
@admin.route('/admin/utilisateurs/<int:id>/bloquer', methods=['PUT'])
@jwt_required()
def bloquer_utilisateur(id):
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    utilisateur = db.session.get(Utilisateur, id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404
    if utilisateur.role == 'administrateur':
        return jsonify({'message': 'Impossible de bloquer un administrateur'}), 400

    utilisateur.actif = not utilisateur.actif
    db.session.commit()
    statut = 'bloqué' if not utilisateur.actif else 'débloqué'
    return jsonify({'message': f'Compte {statut}', 'actif': utilisateur.actif}), 200


# Supprimer un compte utilisateur
@admin.route('/admin/utilisateurs/<int:id>', methods=['DELETE'])
@jwt_required()
def supprimer_utilisateur(id):
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    utilisateur = db.session.get(Utilisateur, id)
    if not utilisateur:
        return jsonify({'message': 'Utilisateur introuvable'}), 404
    if utilisateur.role == 'administrateur':
        return jsonify({'message': 'Impossible de supprimer un administrateur'}), 400

    db.session.delete(utilisateur)
    db.session.commit()
    return jsonify({'message': 'Compte supprimé'}), 200


# Supprimer un avis (modération)
@admin.route('/admin/avis/<int:id>', methods=['DELETE'])
@jwt_required()
def supprimer_avis(id):
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    a = db.session.get(Avis, id)
    if not a:
        return jsonify({'message': 'Avis introuvable'}), 404

    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Avis supprimé'}), 200
