# app.py est le point d'entrée de l'application Flask. 
# C'est le fichier principal qui démarre le serveur. Il crée l'application Flask, 
# la connecte à la base de données, 
# enregistre les routes et lance le serveur.
# C'est le premier fichier que Python exécute quand tu lances le backend.
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

@app.route('/')
def index():
    return {'message': 'API HomeLink fonctionne !'}

if __name__ == '__main__':
    app.run(debug=True)