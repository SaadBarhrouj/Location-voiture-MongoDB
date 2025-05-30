# app/utils/helpers.py
from bson import ObjectId, json_util
import json
from datetime import datetime
# --- IMPORTS NÉCESSAIRES POUR L'AUTH ---
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session, jsonify
from functools import wraps

# --- Fonctions existantes ---
def mongo_to_dict(doc):
    if doc and '_id' in doc:
        doc['id'] = str(doc.pop('_id'))
    return doc

def custom_serializer(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def bson_to_json(data):
    return json.loads(json.dumps(data, default=custom_serializer))


# --- Fonctions pour les mots de passe ---
def hash_password(password):
    """Génère un hash sécurisé pour un mot de passe."""
    return generate_password_hash(password)

def check_password(hashed_password, password):
    """Vérifie si un mot de passe correspond à son hash."""
    if not hashed_password: 
        return False
    return check_password_hash(hashed_password, password)

# --- Décorateur pour protéger les routes ---
def login_required(role=None):
    """Décorateur pour exiger une connexion et éventuellement un rôle."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify(message="Authentication required. Please log in."), 401

            if role:
                user_role = session.get('user_role')
                # Logique simple: on vérifie si le rôle est exactement celui requis
                # Ou si le rôle requis est 'manager' et que l'utilisateur est 'admin'
                is_authorized = (user_role == role) or (role == "manager" and user_role == "admin")
                if not is_authorized:
                     return jsonify(message=f"Authorization failed. '{role}' role required."), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator