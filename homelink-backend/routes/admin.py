from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.annonce import Annonce
from models.utilisateur import Utilisateur

admin = Blueprint('admin', __name__)

# Voir toutes les annonces en attente
@admin.route('/admin/annonces', methods=['GET'])
@jwt_required()
def get_annonces_en_attente():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    if utilisateur.role != 'administrateur':
        return jsonify({'message': 'Accès refusé'}), 403

    liste = Annonce.query.filter_by(statut='EN_ATTENTE').all()
    resultat = []
    for annonce in liste:
        resultat.append({
            'id': annonce.id,
            'titre': annonce.titre,
            'prix': float(annonce.prix),
            'statut': annonce.statut,
            'type_logement': annonce.bien.type_logement,
            'quartier': annonce.bien.quartier.nom
        })
    return jsonify(resultat), 200


# Valider une annonce
@admin.route('/admin/annonces/<int:id>/valider', methods=['PUT'])
@jwt_required()
def valider_annonce(id):
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    if utilisateur.role != 'administrateur':
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
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    if utilisateur.role != 'administrateur':
        return jsonify({'message': 'Accès refusé'}), 403

    annonce = Annonce.query.get(id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    annonce.statut = 'SUSPENDUE'
    db.session.commit()

    return jsonify({'message': 'Annonce rejetée'}), 200