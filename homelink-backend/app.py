from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt.init_app(app)
CORS(app)

# Modèles
from models.utilisateur import Utilisateur
from models.quartier import Quartier
from models.bien_immobilier import BienImmobilier
from models.annonce import Annonce
from models.message import Message
from models.avis import Avis

# Routes
from routes.auth import auth
from routes.annonces import annonces
from routes.quartiers import quartiers
from routes.messages import messages
from routes.avis import avis
from routes.admin import admin
from routes.profil import profil
from models.photo import Photo
from routes.photos import photos
app.register_blueprint(auth)
app.register_blueprint(annonces)
app.register_blueprint(quartiers)
app.register_blueprint(messages)
app.register_blueprint(avis)
app.register_blueprint(admin)
app.register_blueprint(profil)
app.register_blueprint(photos)

@app.route('/')
def index():
    return {'message': 'API HomeLink fonctionne !'}

if __name__ == '__main__':
    app.run(debug=True)