from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.quartier import Quartier
from models.utilisateur import Utilisateur
from extensions import db

quartiers = Blueprint('quartiers', __name__)

def to_dict(q):
    return {
        'id': q.id,
        'nom': q.nom,
        'commune': q.commune,
        'description': q.description
    }

# Récupérer tous les quartiers
@quartiers.route('/quartiers', methods=['GET'])
def get_quartiers():
    liste = Quartier.query.order_by(Quartier.nom).all()
    return jsonify([to_dict(q) for q in liste]), 200

# Ajouter un quartier (admin uniquement)
@quartiers.route('/quartiers', methods=['POST'])
@jwt_required()
def ajouter_quartier():
    utilisateur_id = int(get_jwt_identity())
    u = Utilisateur.query.get(utilisateur_id)
    if not u or u.role != 'administrateur':
        return jsonify({'message': 'Accès réservé aux administrateurs'}), 403

    data = request.get_json()
    nom = data.get('nom', '').strip()
    if not nom:
        return jsonify({'message': 'Le nom du quartier est obligatoire'}), 400

    # Vérifier doublon
    existant = Quartier.query.filter(Quartier.nom.ilike(nom)).first()
    if existant:
        return jsonify({'message': f'Le quartier "{nom}" existe déjà'}), 400

    q = Quartier(
        nom=nom,
        commune=data.get('commune', '').strip() or None,
        description=data.get('description', '').strip() or None,
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({'message': 'Quartier ajouté', 'quartier': to_dict(q)}), 201
