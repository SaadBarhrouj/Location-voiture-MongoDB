from flask import Blueprint, request, jsonify, current_app, session 
from bson import ObjectId
from datetime import datetime

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required, hash_password


# Créer le Blueprint pour les managers
managers_bp = Blueprint('managers', __name__)

# Raccourci vers la collection 'users'
users_collection = lambda: mongo.db.users

# --- GET / (Liste tous les managers) ---
@managers_bp.route('', methods=['GET'])
@login_required(role="admin") 
def get_managers():
    try:
        # Trouve les utilisateurs avec role='manager', exclut le hash du mot de passe
        managers_cursor = users_collection().find(
            {'role': 'manager'},
            {'password_hash': 0}
        ).sort("username", 1) 
        managers_list = [mongo_to_dict(manager) for manager in managers_cursor]
        return bson_to_json(managers_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching managers: {e}")
        return jsonify(message="Error fetching managers."), 500

# --- GET /<id> (Récupère UN manager) ---
@managers_bp.route('/<string:manager_id>', methods=['GET'])
@login_required(role="admin") # Seul Admin peut voir un manager
def get_manager_by_id(manager_id):
    try:
        oid = ObjectId(manager_id)
    except Exception:
        return jsonify(message="Invalid manager ID format."), 400

    try:
        # Trouve par ID, s'assure que c'est un manager, exclut le hash
        manager_doc = users_collection().find_one(
            {'_id': oid, 'role': 'manager'},
            {'password_hash': 0}
        )
        if manager_doc:
            return bson_to_json(mongo_to_dict(manager_doc)), 200
        else:
            return jsonify(message="Manager not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching manager {manager_id}: {e}")
        return jsonify(message="Error fetching manager."), 500

# --- POST / (Crée un nouveau manager) ---
@managers_bp.route('', methods=['POST'])
@login_required(role="admin") # Seul Admin peut créer
def create_manager():
    try:
        data = request.get_json()
        required_fields = ['username', 'fullName', 'password']
        if not data or not all(field in data for field in required_fields):
            return jsonify(message="Missing required fields: username, fullName, password"), 400

        # Vérifier unicité username
        if users_collection().find_one({'username': data['username']}):
            return jsonify(message=f"Username '{data['username']}' already exists."), 409

        # Hacher le mot de passe
        try:
            hashed_pw = hash_password(data['password'])
        except Exception as e:
             current_app.logger.error(f"Error hashing password for new manager: {e}")
             return jsonify(message="Error processing password."), 500

        # Préparer le nouveau manager
        new_manager = {
            "username": data['username'],
            "password_hash": hashed_pw, 
            "role": "manager",      
            "fullName": data['fullName'],
            "isActive": data.get('isActive', True), 
            "createdAt": datetime.utcnow(),
            "updatedAt": None 
        }

        # Insérer dans la collection 'users'
        result = users_collection().insert_one(new_manager)
        if result.inserted_id:
            # Renvoyer le manager créé (sans le hash)
            created_manager_doc = users_collection().find_one(
                {'_id': result.inserted_id}, {'password_hash': 0}
            )
            return bson_to_json(mongo_to_dict(created_manager_doc)), 201
        else:
            return jsonify(message="Failed to create manager."), 500

    except Exception as e:
        current_app.logger.error(f"Error creating manager: {e}")
        return jsonify(message="Error creating manager."), 500

# --- PUT /<id> (Met à jour UN manager) ---
@managers_bp.route('/<string:manager_id>', methods=['PUT'])
@login_required(role="admin") 
def update_manager(manager_id):
    try:
        oid = ObjectId(manager_id)
    except Exception:
        return jsonify(message="Invalid manager ID format."), 400

    try:
        data = request.get_json()
        if not data:
            return jsonify(message="No update data provided."), 400

        # Préparer les champs à mettre à jour
        update_fields = {}
        allowed_updates = ['username', 'fullName', 'password', 'isActive']

        for key in allowed_updates:
            if key in data:
                if key == 'username':
                    if data['username']: 
                        existing = users_collection().find_one({'username': data['username'], '_id': {'$ne': oid}})
                        if existing:
                            return jsonify(message=f"Username '{data['username']}' already taken."), 409
                        update_fields[key] = data[key]
                elif key == 'password':
                    if data['password']:
                        try:
                            update_fields['password_hash'] = hash_password(data['password'])
                            # password_updated = True
                        except Exception as e:
                            current_app.logger.error(f"Error hashing password on update: {e}")
                            return jsonify(message="Error processing new password."), 500
                elif key == 'fullName':
                    if data['fullName']:
                        update_fields[key] = data[key]
                elif key == 'isActive':
                    if isinstance(data[key], bool):
                        update_fields[key] = data[key]
                    else:
                        return jsonify(message="isActive field must be a boolean."), 400

        if not update_fields:
            return jsonify(message="No valid or changed fields provided for update."), 400

        update_fields['updatedAt'] = datetime.utcnow()

        result = users_collection().update_one({'_id': oid, 'role': 'manager'}, {'$set': update_fields})

        if result.matched_count:
            updated_manager_doc = users_collection().find_one(
                {'_id': oid}, {'password_hash': 0}
            )
            return bson_to_json(mongo_to_dict(updated_manager_doc)), 200
        else:
            return jsonify(message="Manager not found or user is not a manager."), 404

    except Exception as e:
        current_app.logger.error(f"Error updating manager {manager_id}: {e}")
        return jsonify(message="Error updating manager."), 500

# --- DELETE /<id> (Supprime UN manager) ---
@managers_bp.route('/<string:manager_id>', methods=['DELETE'])
@login_required(role="admin") 
def delete_manager(manager_id):
    current_user_id_str = session.get('user_id')
    if current_user_id_str == manager_id:
         return jsonify(message="Operation not allowed. Cannot delete own account via this route."), 403

    try:
        oid = ObjectId(manager_id)
    except Exception:
        return jsonify(message="Invalid manager ID format."), 400

    try:
        manager_to_delete = users_collection().find_one({'_id': oid, 'role': 'manager'}, {'username': 1})
        if not manager_to_delete:
            return jsonify(message="Manager not found or user is not a manager."), 404

        result = users_collection().delete_one({'_id': oid, 'role': 'manager'})

        if result.deleted_count:
            return '', 204
        else:
            return jsonify(message="Manager not found or user is not a manager."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting manager {manager_id}: {e}")
        return jsonify(message="Error deleting manager."), 500