from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt.init_app(app)
CORS(app)

# Importer tous les modèles pour que SQLAlchemy les connaisse
from models.utilisateur import Utilisateur
from models.quartier import Quartier
from models.bien_immobilier import BienImmobilier
from models.annonce import Annonce

from routes.auth import auth
from routes.annonces import annonces
app.register_blueprint(auth)
app.register_blueprint(annonces)

@app.route('/')
def index():
    return {'message': 'API HomeLink fonctionne !'}

if __name__ == '__main__':
    app.run(debug=True)