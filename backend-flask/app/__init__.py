# app/__init__.py
import os
from flask import Flask, jsonify, current_app 
from dotenv import load_dotenv

# Charger les variables d'environnement (.env) au démarrage
load_dotenv()

# Importer les instances d'extensions partagées (créées dans extensions.py)
from .extensions import mongo, cors
from .utils.audit_logger import log_action # Import for potential app-level logging if needed

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
    
    # Configuration pour l'upload des images de voitures
    # Le dossier 'uploads/cars' sera créé à l'intérieur du dossier 'static' de l'application.
    # Assurez-vous que le dossier 'static' existe à la racine de votre 'app'.
    # Si 'app.static_folder' est par exemple 'c:\Users\...\backend-flask\app\static',
    # alors UPLOAD_FOLDER_CARS sera 'c:\Users\...\backend-flask\app\static\uploads\cars'
    app.config['UPLOAD_FOLDER_CARS'] = os.path.join(app.static_folder, 'uploads', 'cars')
    app.config['ALLOWED_IMAGE_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Optionnel: Définir la durée de vie des sessions 'permanentes'
    # from datetime import timedelta
    # app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=8) # Exemple: 8 heures

    # --- Initialisation des Extensions ---
    # Lier les instances d'extensions à cette application spécifique
    mongo.init_app(app) # Initialise Flask-PyMongo
    # Active CORS pour les routes API, y compris les identifiants pour les sessions
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True) 

    # Créer le dossier d'upload s'il n'existe pas déjà au démarrage de l'app
    if not os.path.exists(app.config['UPLOAD_FOLDER_CARS']):
        try:
            os.makedirs(app.config['UPLOAD_FOLDER_CARS'])
            app.logger.info(f"Successfully created upload folder: {app.config['UPLOAD_FOLDER_CARS']}")
        except OSError as e:
            app.logger.error(f"Error creating upload folder {app.config['UPLOAD_FOLDER_CARS']}: {e}")
            # Envisager de logguer cette erreur critique via audit_logger si nécessaire
            # try:
            #     log_action(action='upload_folder_creation_failed', entity_type='system', status='critical', details={'error': str(e), 'path': app.config['UPLOAD_FOLDER_CARS']})
            # except Exception as log_e:
            #     app.logger.error(f"Failed to log upload_folder_creation_failed to audit log: {log_e}")
            # Selon la criticité, vous pourriez vouloir empêcher l'application de démarrer ou la laisser continuer avec des fonctionnalités d'upload désactivées.

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

    # Ensure audit_log_routes_bp is registered (it was already present)
    from .routes.audit_log_routes import audit_log_bp
    # The url_prefix='/api/audit-logs' is defined within audit_log_routes.py, so no need to set it here again.
    app.register_blueprint(audit_log_bp) 

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
            # Log this critical failure using audit_logger as a system event
            try:
                log_action(action='db_ping_failed', entity_type='system', status='failure', details={'error': str(e)})
            except Exception as log_e:
                app.logger.error(f"Failed to log db_ping_failed to audit log: {log_e}")
            return jsonify({"message": f"MongoDB connection failed: {e}"}), 500 # Erreur serveur


    # --- Gestionnaires d'Erreurs Globaux ---
    # Attrapent les erreurs HTTP spécifiques pour renvoyer une réponse JSON standardisée

    @app.errorhandler(404) # Erreur: Ressource non trouvée
    def not_found_error(error):
        """Gère les erreurs 404 (URL non trouvée)."""
        # Log 404 errors if desired, could be noisy
        # log_action(action='http_error_404', entity_type='system', status='info', details={'path': request.path, 'error': str(error)})
        return jsonify(message="The requested URL was not found on the server."), 404

    @app.errorhandler(500) # Erreur: Erreur interne du serveur
    def internal_error(error):
        """Gère les erreurs serveur génériques (non prévues)."""
        # Important: Logguer l'erreur complète pour le débogage côté serveur
        app.logger.error(f"Internal Server Error: {error}", exc_info=True)
        # Log internal server errors
        try:
            log_action(action='http_error_500', entity_type='system', status='failure', details={'error': str(error)})
        except Exception as log_e:
            app.logger.error(f"Failed to log http_error_500 to audit log: {log_e}")
        # Renvoyer un message générique au client
        return jsonify(message="An internal server error occurred."), 500

    @app.errorhandler(405) # Erreur: Méthode non autorisée (ex: GET sur une route POST)
    def method_not_allowed(error):
        """Gère les erreurs 405 (Méthode HTTP non supportée pour cette URL)."""
        # Log 405 errors if desired
        # log_action(action='http_error_405', entity_type='system', status='info', details={'path': request.path, 'method': request.method, 'error': str(error)})
        return jsonify(message="The method is not allowed for the requested URL."), 405

    # --- Retourner l'Application Configurée ---
    return app