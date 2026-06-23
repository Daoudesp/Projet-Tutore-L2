from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.avis import Avis

avis = Blueprint('avis', __name__)

# Déposer un avis
@avis.route('/avis', methods=['POST'])
@jwt_required()
def deposer_avis():
    data = request.get_json()
    locataire_id = int(get_jwt_identity())

    nouvel_avis = Avis(
        locataire_id=locataire_id,
        bien_id=data['bien_id'],
        note=data['note'],
        commentaire=data.get('commentaire')
    )
    db.session.add(nouvel_avis)
    db.session.commit()

    return jsonify({'message': 'Avis déposé avec succès'}), 201


# Voir les avis d'un bien
@avis.route('/avis/<int:bien_id>', methods=['GET'])
def get_avis(bien_id):
    liste = Avis.query.filter_by(bien_id=bien_id).all()
    resultat = []
    for a in liste:
        resultat.append({
            'id': a.id,
            'note': a.note,
            'commentaire': a.commentaire,
            'date_avis': a.date_avis.strftime('%Y-%m-%d %H:%M'),
            'locataire_id': a.locataire_id
        })
    return jsonify(resultat), 200