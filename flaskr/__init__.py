from flask import Flask
from datetime import timedelta
from dotenv import load_dotenv
import os

from extensions import jwt, cors
from routes.auth import auth_bp

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config['JWT_SECRET_KEY']            = os.getenv('JWT_SECRET_KEY', 'fallback-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']  = timedelta(hours=2)

    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp)
    return app