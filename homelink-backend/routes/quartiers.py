from flask import Blueprint, jsonify
from models.quartier import Quartier

quartiers = Blueprint('quartiers', __name__)

# Récupérer tous les quartiers
@quartiers.route('/quartiers', methods=['GET'])
def get_quartiers():
    liste = Quartier.query.all()
    resultat = []
    for quartier in liste:
        resultat.append({
            'id': quartier.id,
            'nom': quartier.nom,
            'commune': quartier.commune,
            'prix_moyen_loyer': float(quartier.prix_moyen_loyer) if quartier.prix_moyen_loyer else None,
            'description': quartier.description
        })
    return jsonify(resultat), 200