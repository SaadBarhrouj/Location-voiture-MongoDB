# app/__init__.py
import os
from flask import Flask, jsonify, current_app 
from dotenv import load_dotenv

# Charger les variables d'environnement (.env) au démarrage
load_dotenv()

# Importer les instances d'extensions partagées (créées dans extensions.py)
from .extensions import mongo, cors

# --- Application Factory ---
# Motif de conception pour créer l'application Flask de manière organisée
def create_app():
    """Crée et configure une instance de l'application Flask."""

    # Initialiser l'application Flask
    app = Flask(__name__)

    # --- Configuration ---
    # Charger la configuration depuis les variables d'environnement
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') # Essentiel pour les sessions
    app.config['MONGO_URI'] = os.environ.get('MONGO_URI')  # Pour la connexion à MongoDB
    # Optionnel: Définir la durée de vie des sessions 'permanentes'
    # from datetime import timedelta
    # app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8) # Exemple: 8 heures

    # --- Initialisation des Extensions ---
    # Lier les instances d'extensions à cette application spécifique
    mongo.init_app(app) # Initialise Flask-PyMongo
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True) # Active CORS pour les routes API

    # --- Enregistrement des Blueprints (Modules de Routes) ---
    # Importer et lier chaque module de routes à l'application avec un préfixe d'URL

    # Routes pour les Voitures -> /api/cars/*
    from .routes.cars import cars_bp
    app.register_blueprint(cars_bp, url_prefix='/api/cars')

    # Routes pour l'Authentification -> /api/auth/*
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # Routes pour les Clients -> /api/clients/*
    from .routes.clients import clients_bp
    app.register_blueprint(clients_bp, url_prefix='/api/clients')

    # Routes pour les Managers -> /api/managers/*
    from .routes.managers import managers_bp
    app.register_blueprint(managers_bp, url_prefix='/api/managers')

    # Routes pour les Réservations -> /api/reservations/*
    from .routes.reservations import reservations_bp
    app.register_blueprint(reservations_bp, url_prefix='/api/reservations')


    # --- Routes de Test (Utiles pour le développement) ---

    # Endpoint pour vérifier si l'API est en ligne
    @app.route('/api/ping')
    def ping():
        """Route simple pour vérifier si le serveur répond."""
        return jsonify({"message": "pong! LocaCar Manager API is alive!"})

    # Endpoint pour vérifier la connexion à la base de données MongoDB
    @app.route('/api/db_ping')
    def db_ping():
        """Tente une commande simple sur MongoDB pour vérifier la connexion."""
        try:
            mongo.db.command('ping') # Commande MongoDB 'ping'
            return jsonify({"message": "MongoDB connection successful!"})
        except Exception as e:
            app.logger.error(f"Database connection error: {e}") # Log l'erreur
            return jsonify({"message": f"MongoDB connection failed: {e}"}), 500 # Erreur serveur


    # --- Gestionnaires d'Erreurs Globaux ---
    # Attrapent les erreurs HTTP spécifiques pour renvoyer une réponse JSON standardisée

    @app.errorhandler(404) # Erreur: Ressource non trouvée
    def not_found_error(error):
        """Gère les erreurs 404 (URL non trouvée)."""
        return jsonify(message="The requested URL was not found on the server."), 404

    @app.errorhandler(500) # Erreur: Erreur interne du serveur
    def internal_error(error):
        """Gère les erreurs serveur génériques (non prévues)."""
        # Important: Logguer l'erreur complète pour le débogage côté serveur
        app.logger.error(f"Internal Server Error: {error}", exc_info=True)
        # Renvoyer un message générique au client
        return jsonify(message="An internal server error occurred."), 500

    @app.errorhandler(405) # Erreur: Méthode non autorisée (ex: GET sur une route POST)
    def method_not_allowed(error):
        """Gère les erreurs 405 (Méthode HTTP non supportée pour cette URL)."""
        return jsonify(message="The method is not allowed for the requested URL."), 405

    # --- Retourner l'Application Configurée ---
    return app