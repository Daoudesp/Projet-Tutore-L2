from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.annonce import Annonce
from models.utilisateur import Utilisateur

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
    } for u in liste]), 200


# Voir toutes les annonces en attente
@admin.route('/admin/annonces', methods=['GET'])
@jwt_required()
def get_annonces_en_attente():
    uid = int(get_jwt_identity())
    if not check_admin(uid):
        return jsonify({'message': 'Accès refusé'}), 403

    liste = Annonce.query.filter_by(statut='EN_ATTENTE').all()
    return jsonify([{
        'id': a.id,
        'titre': a.titre,
        'prix': float(a.prix),
        'statut': a.statut,
        'type_logement': a.bien.type_logement,
        'quartier': a.bien.quartier.nom,
    } for a in liste]), 200


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
