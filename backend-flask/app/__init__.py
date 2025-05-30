# app/__init__.py
import os
from flask import Flask, jsonify, current_app, request # Added request for error handlers
from dotenv import load_dotenv
from datetime import timedelta # Added for session lifetime

# Charger les variables d'environnement (.env) au démarrage
load_dotenv()

# Importer les instances d'extensions partagées (créées dans extensions.py)
from .extensions import mongo, cors, bcrypt # Assuming bcrypt is in extensions
from .utils.audit_logger import log_action # Import for potential app-level logging if needed
# from .config import Config # Assuming you might have a Config object, or use os.environ directly

# --- Application Factory ---
# Motif de conception pour créer l'application Flask de manière organisée
def create_app():
    """Crée et configure une instance de l'application Flask."""

    # Initialiser l'application Flask
    app = Flask(__name__)

    # --- Configuration ---
    # Charger la configuration depuis les variables d'environnement ou un objet Config
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key') # Essentiel pour les sessions
    app.config['MONGO_URI'] = os.environ.get('MONGO_URI')  # Pour la connexion à MongoDB
    
    # Configuration pour l'upload des images de voitures
    app.config['UPLOAD_FOLDER_CARS'] = os.path.join(app.static_folder, 'uploads', 'cars')
    app.config['ALLOWED_IMAGE_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit for uploads

    # Configuration de la session
    app.config['SESSION_COOKIE_SAMESITE'] = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
    app.config['SESSION_COOKIE_SECURE'] = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=int(os.environ.get('SESSION_LIFETIME_DAYS', 7)))


    # --- Initialisation des Extensions ---
    mongo.init_app(app) 
    bcrypt.init_app(app) # Initialize bcrypt
    cors.init_app(app, resources={r"/api/*": {"origins": os.environ.get('CORS_ORIGINS', '*')}}, supports_credentials=True) 

    # Créer le dossier d'upload s'il n'existe pas déjà
    if not os.path.exists(app.config['UPLOAD_FOLDER_CARS']):
        try:
            os.makedirs(app.config['UPLOAD_FOLDER_CARS'])
            app.logger.info(f"Successfully created upload folder: {app.config['UPLOAD_FOLDER_CARS']}")
        except OSError as e:
            app.logger.error(f"Error creating upload folder {app.config['UPLOAD_FOLDER_CARS']}: {e}")
            try:
                log_action(action='upload_folder_creation_failed', entity_type='system', status='critical', details={'error': str(e), 'path': app.config['UPLOAD_FOLDER_CARS']})
            except Exception as log_e:
                app.logger.error(f"Failed to log upload_folder_creation_failed to audit log: {log_e}")


    # --- Enregistrement des Blueprints (Modules de Routes) ---
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from .routes.cars import cars_bp
    app.register_blueprint(cars_bp, url_prefix='/api/cars')

    from .routes.clients import clients_bp
    app.register_blueprint(clients_bp, url_prefix='/api/clients')

    from .routes.managers import managers_bp
    app.register_blueprint(managers_bp, url_prefix='/api/managers')

    from .routes.reservations import reservations_bp
    app.register_blueprint(reservations_bp, url_prefix='/api/reservations')

    from .routes.audit_log_routes import audit_log_bp
    app.register_blueprint(audit_log_bp) # Prefix is defined in the blueprint file

    from .routes.admin_routes import admin_bp 
    app.register_blueprint(admin_bp) # Prefix is defined in admin_routes.py
    
    from .routes.manager_dashboard_routes import manager_dashboard_bp # Import manager dashboard blueprint
    app.register_blueprint(manager_dashboard_bp) # Register manager dashboard blueprint (prefix is defined in its file)


    # --- Routes de Test (Utiles pour le développement) ---
    @app.route('/api/ping')
    def ping():
        """Route simple pour vérifier si le serveur répond."""
        return jsonify({"message": "pong! LocaCar Manager API is alive!"})

    @app.route('/api/db_ping')
    def db_ping():
        """Tente une commande simple sur MongoDB pour vérifier la connexion."""
        try:
            mongo.db.command('ping') 
            return jsonify({"message": "MongoDB connection successful!"})
        except Exception as e:
            app.logger.error(f"Database connection error: {e}") 
            try:
                log_action(action='db_ping_failed', entity_type='system', status='failure', details={'error': str(e)})
            except Exception as log_e:
                app.logger.error(f"Failed to log db_ping_failed to audit log: {log_e}")
            return jsonify({"message": f"MongoDB connection failed: {e}"}), 500


    # --- Gestionnaires d'Erreurs Globaux ---
    @app.errorhandler(404) 
    def not_found_error(error):
        """Gère les erreurs 404 (URL non trouvée)."""
        # log_action(action='http_error_404', entity_type='system', status='info', details={'path': request.path, 'error': str(error)})
        return jsonify(message="The requested URL was not found on the server."), 404

    @app.errorhandler(500) 
    def internal_error(error):
        """Gère les erreurs serveur génériques (non prévues)."""
        app.logger.error(f"Internal Server Error: {error}", exc_info=True)
        try:
            log_action(action='http_error_500', entity_type='system', status='failure', details={'path': request.path, 'error': str(error)})
        except Exception as log_e:
            app.logger.error(f"Failed to log http_error_500 to audit log: {log_e}")
        return jsonify(message="An internal server error occurred."), 500

    @app.errorhandler(405) 
    def method_not_allowed(error):
        """Gère les erreurs 405 (Méthode HTTP non supportée pour cette URL)."""
        # log_action(action='http_error_405', entity_type='system', status='info', details={'path': request.path, 'method': request.method, 'error': str(error)})
        return jsonify(message="The method is not allowed for the requested URL."), 405
    
    @app.errorhandler(400)
    def bad_request_error(error):
        """Handles 400 Bad Request errors."""
        # The error object might contain a description attribute from Flask/Werkzeug
        message = error.description if hasattr(error, 'description') else "The browser (or proxy) sent a request that this server could not understand."
        app.logger.warning(f"Bad Request: {message} - Path: {request.path} - Error: {str(error)}")
        try:
            log_action(action='http_error_400', entity_type='system', status='warning', details={'path': request.path, 'error': str(error), 'message': message})
        except Exception as log_e:
            app.logger.error(f"Failed to log http_error_400 to audit log: {log_e}")
        return jsonify(message=message), 400

    # --- Retourner l'Application Configurée ---
    return app