from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.favori import Favori
from models.annonce import Annonce

favoris = Blueprint('favoris', __name__)

# Ajouter une annonce aux favoris
@favoris.route('/favoris/<int:annonce_id>', methods=['POST'])
@jwt_required()
def ajouter_favori(annonce_id):
    locataire_id = int(get_jwt_identity())

    # Vérifier si l'annonce existe
    annonce = Annonce.query.get(annonce_id)
    if not annonce:
        return jsonify({'message': 'Annonce introuvable'}), 404

    # Vérifier si déjà dans les favoris
    existant = Favori.query.filter_by(
        locataire_id=locataire_id,
        annonce_id=annonce_id
    ).first()
    if existant:
        return jsonify({'message': 'Annonce déjà dans les favoris'}), 400

    favori = Favori(locataire_id=locataire_id, annonce_id=annonce_id)
    db.session.add(favori)
    db.session.commit()

    return jsonify({'message': 'Annonce ajoutée aux favoris'}), 201


# Voir ses favoris
@favoris.route('/favoris', methods=['GET'])
@jwt_required()
def get_favoris():
    locataire_id = int(get_jwt_identity())
    liste = Favori.query.filter_by(locataire_id=locataire_id).all()

    resultat = []
    for favori in liste:
        resultat.append({
            'id': favori.id,
            'annonce_id': favori.annonce_id,
            'titre': favori.annonce.titre,
            'prix': float(favori.annonce.prix),
            'quartier': favori.annonce.bien.quartier.nom,
            'type_logement': favori.annonce.bien.type_logement,
            'date_ajout': favori.date_ajout.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify(resultat), 200


# Supprimer un favori
@favoris.route('/favoris/<int:annonce_id>', methods=['DELETE'])
@jwt_required()
def supprimer_favori(annonce_id):
    locataire_id = int(get_jwt_identity())

    favori = Favori.query.filter_by(
        locataire_id=locataire_id,
        annonce_id=annonce_id
    ).first()

    if not favori:
        return jsonify({'message': 'Favori introuvable'}), 404

    db.session.delete(favori)
    db.session.commit()

    return jsonify({'message': 'Favori supprimé'}), 200