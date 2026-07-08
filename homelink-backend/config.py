# config.py est le fichier de configuration centrale de l'application.
# Son rôle est de dire à Flask comment se connecter à la base de données, 
# quelle clé utiliser pour le JWT, et tous les autres paramètres de l'application. 
# Au lieu de disperser ces réglages dans plusieurs fichiers, on les regroupe 
# tous ici dans une seule classe Config.
import os
from dotenv import load_dotenv

load_dotenv()

def _build_ssl_connect_args():
    ssl_ca = os.getenv('DB_SSL_CA', '').strip()
    if not ssl_ca:
        return {}
    return {
        'ssl_verify_cert': True,
        'ssl_verify_identity': True,
        'ssl_ca': ssl_ca,
    }

class Config:
    _db_host = os.getenv('DB_HOST')
    _db_port = os.getenv('DB_PORT', '4000')
    _db_user = os.getenv('DB_USER')
    _db_password = os.getenv('DB_PASSWORD')
    _db_name = os.getenv('DB_NAME')

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{_db_user}:{_db_password}"
        f"@{_db_host}:{_db_port}/{_db_name}"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': _build_ssl_connect_args(),
        'pool_recycle': 300,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = False  # Token sans expiration (développement)

    # Flask-Mail (Gmail SMTP)
    MAIL_SERVER = 'smtp-relay.brevo.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_SENDER', os.getenv('MAIL_USERNAME'))
    MAIL_TIMEOUT = 5