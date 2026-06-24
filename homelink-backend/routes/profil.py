from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from extensions import db
from models.utilisateur import Utilisateur
from models.annonce import Annonce
from models.bien_immobilier import BienImmobilier

profil = Blueprint('profil', __name__)

# Voir son profil
@profil.route('/profil', methods=['GET'])
@jwt_required()
def get_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)

    return jsonify({
        'id': utilisateur.id,
        'nom': utilisateur.nom,
        'prenom': utilisateur.prenom,
        'email': utilisateur.email,
        'telephone': utilisateur.telephone,
        'role': utilisateur.role,
        'date_inscription': utilisateur.date_inscription.strftime('%Y-%m-%d')
    }), 200


# Modifier son profil
@profil.route('/profil', methods=['PUT'])
@jwt_required()
def modifier_profil():
    utilisateur_id = int(get_jwt_identity())
    utilisateur = Utilisateur.query.get(utilisateur_id)
    data = request.get_json()

    if 'nom' in data:
        utilisateur.nom = data['nom']
    if 'prenom' in data:
        utilisateur.prenom = data['prenom']
    if 'telephone' in data:
        utilisateur.telephone = data['telephone']
    if 'mot_de_passe' in data:
        utilisateur.mot_de_passe = generate_password_hash(data['mot_de_passe'])

    db.session.commit()

    return jsonify({'message': 'Profil mis à jour avec succès'}), 200


# Annonces du propriétaire connecté (tous statuts)
@profil.route('/profil/annonces', methods=['GET'])
@jwt_required()
def get_mes_annonces():
    utilisateur_id = int(get_jwt_identity())
    liste = (Annonce.query
             .join(BienImmobilier)
             .filter(BienImmobilier.proprietaire_id == utilisateur_id)
             .order_by(Annonce.date_publication.desc())
             .all())
    return jsonify([{
        'id': a.id,
        'titre': a.titre,
        'prix': float(a.prix),
        'statut': a.statut,
        'type_logement': a.bien.type_logement,
        'quartier': a.bien.quartier.nom,
    } for a in liste]), 200