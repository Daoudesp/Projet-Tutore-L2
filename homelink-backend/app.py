from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db, jwt

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt.init_app(app)
CORS(app)

from routes.auth import auth
app.register_blueprint(auth)

@app.route('/')
def index():
    return {'message': 'API HomeLink fonctionne !'}

if __name__ == '__main__':
    app.run(debug=True)