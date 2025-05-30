from flask import Blueprint, request, jsonify, session, current_app
from ..extensions import mongo
from ..utils.helpers import check_password, hash_password, mongo_to_dict, bson_to_json
from ..utils.audit_logger import log_action 
from datetime import datetime

# Création du Blueprint pour l'authentification
auth_bp = Blueprint('auth', __name__)

# --- POST /login (Connecter un utilisateur) ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Vérifier si username/password sont fournis
    if not username or not password:
        return jsonify(message="Username and password required"), 400

    # Chercher l'utilisateur dans la collection 'users'
    user_doc = mongo.db.users.find_one({'username': username})

    # Vérifier si l'utilisateur existe et si le mot de passe correspond au hash stocké
    if user_doc and check_password(user_doc.get('password_hash'), password):
        # Vérifier si le compte est actif
        if not user_doc.get('isActive', True):
            return jsonify(message="Account is deactivated. Please contact administrator."), 403 

        # Si oui, créer la session utilisateur
        session.permanent = True 
        session['user_id'] = str(user_doc['_id'])
        session['username'] = user_doc['username']
        session['user_role'] = user_doc.get('role')
        session['user_fullName'] = user_doc.get('fullName')
        session['isActive'] = user_doc.get('isActive', True)

        log_action(action="LOGIN_SUCCESS", entity_type="USER", entity_id=str(user_doc['_id']), user_id=str(user_doc['_id']), user_username=username)

        # Préparer la réponse avec les infos utilisateur 
        user_response = {
            "id": str(user_doc['_id']),
            "username": user_doc['username'],
            "role": user_doc.get('role'),
            "fullName": user_doc.get('fullName'),
            "isActive": user_doc.get('isActive', True) 
        }
        # Renvoyer les infos et le statut 200 OK
        return jsonify({"user": user_response}), 200
    else:
        # Si utilisateur non trouvé ou mot de passe incorrect
        return jsonify(message="Invalid username or password"), 401

# --- POST /logout (Déconnecter un utilisateur) ---
@auth_bp.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    username = session.get('username')
    # Effacer toutes les données de la session actuelle
    session.clear()
    if user_id:
        log_action(action="LOGOUT", entity_type="USER", entity_id=user_id, user_id=user_id, user_username=username)
    # Renvoyer un message de succès
    return jsonify(message="Logged out successfully"), 200

# --- GET /status (Vérifier l'état de connexion) ---
@auth_bp.route('/status', methods=['GET'])
def status():
    # Vérifier si un user_id existe dans la session
    if 'user_id' in session:
        # Si oui, renvoyer les informations stockées dans la session
        user_response = {
            "id": session['user_id'],
            "username": session['username'],
            "role": session.get('user_role'),
            "fullName": session.get('user_fullName'),
            "isActive": session.get('isActive')
        }
        return jsonify({"user": user_response}), 200
    else:
        # Si non, renvoyer null pour indiquer qu'aucun utilisateur n'est connecté
        return jsonify(user=None), 200

# --- POST /create_test_user (Créer un utilisateur - DÉVELOPPEMENT SEULEMENT !) ---
@auth_bp.route('/create_test_user', methods=['POST'])
def create_test_user():
    # Ne fonctionne que si Flask est en mode DEBUG
    if not current_app.debug:
        return jsonify(message="This endpoint is only available in debug mode."), 403

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role', 'manager') # Rôle 'manager' par défaut
    fullName = data.get('fullName', f"{username} (Test)")

    if not username or not password:
        return jsonify(message="Username and password required"), 400

    # Vérifier si le username est déjà pris
    if mongo.db.users.find_one({'username': username}):
        return jsonify(message=f"Username '{username}' already exists."), 409

    # Hacher le mot de passe fourni
    try:
        hashed_pw = hash_password(password)
    except Exception as e:
         current_app.logger.error(f"Error hashing password for test user {username}: {e}")
         return jsonify(message="Error hashing password."), 500

    # Préparer le nouvel utilisateur
    new_user = {
        "username": username,
        "password_hash": hashed_pw,
        "role": role,
        "fullName": fullName,
        "isActive": True, 
        "createdAt": datetime.utcnow(),
        "updatedAt": None  
    }

    # Insérer dans la base de données
    try:
        result = mongo.db.users.insert_one(new_user)
        if result.inserted_id:
            # Récupérer et renvoyer l'utilisateur créé (sans le hash)
            created_user_doc = mongo.db.users.find_one(
                {'_id': result.inserted_id}, {'password_hash': 0}
            )
            return bson_to_json(mongo_to_dict(created_user_doc)), 201 
        else:
            return jsonify(message="Failed to insert test user."), 500
    except Exception as e:
        current_app.logger.error(f"Error inserting test user {username}: {e}")
        return jsonify(message="Error inserting test user into database."), 500