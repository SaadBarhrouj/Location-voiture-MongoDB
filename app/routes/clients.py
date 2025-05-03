# app/routes/clients.py
from flask import Blueprint, request, jsonify, current_app, session # Ajout session (optionnel ici, mais cohérent)
from bson import ObjectId
from datetime import datetime

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required

# Créer le Blueprint pour les clients
clients_bp = Blueprint('clients', __name__)

clients_collection = lambda: mongo.db.clients # Raccourci pour la collection

# --- GET / (Liste tous les clients) ---
@clients_bp.route('', methods=['GET'])
@login_required(role="manager") # Manager ou Admin requis
def get_clients():
    try:
        clients_cursor = clients_collection().find().sort("lastName", 1) # Trier par nom de famille
        clients_list = [mongo_to_dict(client) for client in clients_cursor]
        return bson_to_json(clients_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching clients: {e}")
        return jsonify(message="Error fetching clients."), 500

# --- GET /<id> (Récupère UN client) ---
@clients_bp.route('/<string:client_id>', methods=['GET'])
@login_required(role="manager") # Manager ou Admin requis
def get_client_by_id(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return jsonify(message="Invalid client ID format."), 400

    try:
        client_doc = clients_collection().find_one({'_id': oid})
        if client_doc:
            return bson_to_json(mongo_to_dict(client_doc)), 200
        else:
            return jsonify(message="Client not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching client {client_id}: {e}")
        return jsonify(message="Error fetching client."), 500

# --- POST / (Crée un nouveau client) ---
@clients_bp.route('', methods=['POST'])
@login_required(role="manager") # Manager ou Admin requis
def create_client():
    try:
        data = request.get_json()
        required_fields = ['firstName', 'lastName', 'email', 'phone', 'driverLicenseNumber']
        if not data or not all(field in data for field in required_fields):
            return jsonify(message="Missing required fields"), 400

        # Vérifier unicité email
        if clients_collection().find_one({'email': data['email']}):
            return jsonify(message="Client with this email already exists."), 409

        # Préparer le document
        new_client = {
            "firstName": data['firstName'],
            "lastName": data['lastName'],
            "email": data['email'],
            "phone": data['phone'],
            "driverLicenseNumber": data['driverLicenseNumber'],
            "registeredAt": datetime.utcnow(),
            # "added_by_id": session.get('user_id'), # Optionnel : tracer qui a ajouté
            # "added_by_username": session.get('username')
        }

        # Insérer
        result = clients_collection().insert_one(new_client)
        if result.inserted_id:
            created_client_doc = clients_collection().find_one({'_id': result.inserted_id})
            return bson_to_json(mongo_to_dict(created_client_doc)), 201
        else:
            return jsonify(message="Failed to create client."), 500

    except Exception as e:
        current_app.logger.error(f"Error creating client: {e}")
        return jsonify(message="Error creating client."), 500

# --- PUT /<id> (Met à jour UN client) ---
@clients_bp.route('/<string:client_id>', methods=['PUT'])
@login_required(role="manager") # Manager ou Admin requis
def update_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return jsonify(message="Invalid client ID format."), 400

    try:
        data = request.get_json()
        if not data: return jsonify(message="No update data provided."), 400

        # Préparer les champs à mettre à jour
        update_fields = {}
        allowed_updates = ['firstName', 'lastName', 'email', 'phone', 'driverLicenseNumber']
        for key in allowed_updates:
            if key in data:
                 # Vérifier unicité email si modifié
                if key == 'email':
                    existing = clients_collection().find_one({'email': data['email'], '_id': {'$ne': oid}})
                    if existing: return jsonify(message="Another client with this email already exists."), 409
                update_fields[key] = data[key]

        if not update_fields: return jsonify(message="No valid fields provided for update."), 400

        # Mettre à jour
        result = clients_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            updated_client_doc = clients_collection().find_one({'_id': oid})
            return bson_to_json(mongo_to_dict(updated_client_doc)), 200
        else:
            return jsonify(message="Client not found."), 404

    except Exception as e:
        current_app.logger.error(f"Error updating client {client_id}: {e}")
        return jsonify(message="Error updating client."), 500

# --- DELETE /<id> (Supprime UN client) ---
@clients_bp.route('/<string:client_id>', methods=['DELETE'])
@login_required(role="admin") # Seul Admin peut supprimer
def delete_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        return jsonify(message="Invalid client ID format."), 400

    try:
        # TODO: Vérifier si le client a des réservations avant de supprimer ?
        result = clients_collection().delete_one({'_id': oid})

        if result.deleted_count:
            return '', 204 # Succès, No Content
        else:
            return jsonify(message="Client not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting client {client_id}: {e}")
        return jsonify(message="Error deleting client."), 500