# config.py est le fichier de configuration centrale de l'application.
# Son rôle est de dire à Flask comment se connecter à la base de données, 
# quelle clé utiliser pour le JWT, et tous les autres paramètres de l'application. 
# Au lieu de disperser ces réglages dans plusieurs fichiers, on les regroupe 
# tous ici dans une seule classe Config.
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = False  # Token sans expiration (développement)

    # Flask-Mail (Gmail SMTP)
    MAIL_SERVER = 'smtp-relay.brevo.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME')
    MAIL_TIMEOUT = 5