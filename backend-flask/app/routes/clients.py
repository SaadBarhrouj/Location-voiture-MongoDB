from flask import Blueprint, request, jsonify, current_app, session 
from bson import ObjectId
from datetime import datetime

from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required
from ..utils.audit_logger import log_action

clients_bp = Blueprint('clients', __name__)

clients_collection = lambda: mongo.db.clients
reservations_collection = lambda: mongo.db.reservations # Added for reservation checks

# --- GET / (Liste tous les clients) ---
@clients_bp.route('', methods=['GET'])
@login_required(role="manager")
def get_clients():
    try:
        clients_cursor = clients_collection().find().sort("registeredAt", 1) 
        clients_list = [mongo_to_dict(client) for client in clients_cursor]
        return bson_to_json(clients_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching clients: {e}")
        log_action('list_clients', 'client', status='failure', details={'error': str(e)})
        return jsonify(message="Error fetching clients."), 500

# --- GET /<id> (Récupère UN client) ---
@clients_bp.route('/<string:client_id>', methods=['GET'])
@login_required(role="manager") 
def get_client_by_id(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        log_action('get_client', 'client', entity_id=client_id, status='failure', details={'error': 'Invalid client ID format'})
        return jsonify(message="Invalid client ID format."), 400

    try:
        client_doc = clients_collection().find_one({'_id': oid})
        if client_doc:
            # log_action('get_client', 'client', entity_id=oid, status='success') # Optional
            return bson_to_json(mongo_to_dict(client_doc)), 200
        else:
            log_action('get_client', 'client', entity_id=oid, status='failure', details={'error': 'Client not found'})
            return jsonify(message="Client not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching client {client_id}: {e}")
        log_action('get_client', 'client', entity_id=client_id, status='failure', details={'error': str(e)})
        return jsonify(message="Error fetching client."), 500

# --- POST / (Crée un nouveau client) ---
@clients_bp.route('', methods=['POST'])
@login_required(role="manager") # Seul Manager peut créer un client
def create_client():
    try:
        data = request.get_json()
        required_fields = ['firstName', 'lastName', 'phone', 'CIN']
        if not data or not all(field in data for field in required_fields):
            log_action('create_client', 'client', status='failure', details={'error': 'Missing required fields', 'provided_data': data})
            return jsonify(message="Missing required fields: " + ", ".join(required_fields)), 400

        if clients_collection().find_one({'phone': data['phone']}):
            log_action('create_client', 'client', status='failure', details={'error': 'Phone number already exists', 'phone': data['phone']})
            return jsonify(message=f"Client with phone number '{data['phone']}' already exists."), 409
        
        if clients_collection().find_one({'CIN': data['CIN']}):
            log_action('create_client', 'client', status='failure', details={'error': 'CIN already exists', 'CIN': data['CIN']})
            return jsonify(message=f"Client with CIN '{data['CIN']}' already exists."), 409

        if data.get('email'): 
            if clients_collection().find_one({'email': data['email']}):
                log_action('create_client', 'client', status='failure', details={'error': 'Email already exists', 'email': data['email']})
                return jsonify(message=f"Client with email '{data['email']}' already exists."), 409

        user_id_from_session = session.get('user_id')
        try:
            registered_by_oid = ObjectId(user_id_from_session) if user_id_from_session else None
        except Exception:
            current_app.logger.warn(f"Could not convert session user_id to ObjectId for client creation: {user_id_from_session}")
            registered_by_oid = None

        new_client = {
            "firstName": data['firstName'],
            "lastName": data['lastName'],
            "phone": data['phone'],
            "CIN": data['CIN'],
            "email": data.get('email'), 
            "driverLicenseNumber": data.get('driverLicenseNumber'), 
            "notes": data.get('notes'), 
            "registeredAt": datetime.utcnow(),
            "registeredBy": registered_by_oid, 
            "updatedAt": None, 
            "updatedBy": None 
        }

        result = clients_collection().insert_one(new_client)
        if result.inserted_id:
            log_action('create_client', 'client', entity_id=result.inserted_id, status='success', details={'CIN': data['CIN'], 'name': f"{data['firstName']} {data['lastName']}"})
            created_client_doc = clients_collection().find_one({'_id': result.inserted_id})
            return bson_to_json(mongo_to_dict(created_client_doc)), 201
        else:
            log_action('create_client', 'client', status='failure', details={'error': 'Failed to insert client into DB', 'CIN': data['CIN']})
            return jsonify(message="Failed to create client."), 500

    except Exception as e:
        current_app.logger.error(f"Error creating client: {e}")
        log_action('create_client', 'client', status='failure', details={'error': str(e)})
        return jsonify(message="Error creating client."), 500

# --- PUT /<id> (Met à jour UN client) ---
@clients_bp.route('/<string:client_id>', methods=['PUT'])
@login_required(role="manager") 
def update_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        log_action('update_client', 'client', entity_id=client_id, status='failure', details={'error': 'Invalid client ID format'})
        return jsonify(message="Invalid client ID format."), 400

    try:
        data = request.get_json()
        if not data: 
            log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'No update data provided'})
            return jsonify(message="No update data provided."), 400

        current_client_doc = clients_collection().find_one({'_id': oid})
        if not current_client_doc:
            log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'Client not found'})
            return jsonify(message="Client not found."), 404

        update_fields = {}
        allowed_updates = ['firstName', 'lastName', 'phone', 'email', 'driverLicenseNumber', 'CIN', 'notes']
        
        for key in allowed_updates:
            if key in data:
                if key == 'phone' and data[key] != current_client_doc.get('phone'):
                    if clients_collection().find_one({'phone': data[key], '_id': {'$ne': oid}}):
                        log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'Phone number already exists', 'phone': data[key]})
                        return jsonify(message=f"Another client with phone '{data[key]}' already exists."), 409
                elif key == 'CIN' and data[key] != current_client_doc.get('CIN'):
                    if clients_collection().find_one({'CIN': data[key], '_id': {'$ne': oid}}):
                        log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'CIN already exists', 'CIN': data[key]})
                        return jsonify(message=f"Another client with CIN '{data[key]}' already exists."), 409
                elif key == 'email': 
                    new_email = data.get(key)
                    current_email = current_client_doc.get(key)
                    if new_email and new_email != current_email:
                        if clients_collection().find_one({'email': new_email, '_id': {'$ne': oid}}):
                            log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'Email already exists', 'email': new_email})
                            return jsonify(message=f"Another client with email '{new_email}' already exists."), 409
                update_fields[key] = data[key]

        if not update_fields: 
            log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'No valid fields provided for update', 'provided_data': data})
            return jsonify(message="No valid fields provided for update."), 400

        user_id_from_session = session.get('user_id')
        try:
            updated_by_oid = ObjectId(user_id_from_session) if user_id_from_session else None
        except Exception:
            current_app.logger.warn(f"Could not convert session user_id to ObjectId for client update: {user_id_from_session}")
            updated_by_oid = None

        update_fields['updatedAt'] = datetime.utcnow()
        update_fields['updatedBy'] = updated_by_oid

        result = clients_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            log_action('update_client', 'client', entity_id=oid, status='success', details={'updated_fields': list(update_fields.keys())})
            updated_client_doc = clients_collection().find_one({'_id': oid})
            return bson_to_json(mongo_to_dict(updated_client_doc)), 200
        else:
            # Should be caught by current_client_doc check
            log_action('update_client', 'client', entity_id=oid, status='failure', details={'error': 'Client not found during update operation'})
            return jsonify(message="Client not found."), 404

    except Exception as e:
        current_app.logger.error(f"Error updating client {client_id}: {e}")
        log_action('update_client', 'client', entity_id=client_id, status='failure', details={'error': str(e)})
        return jsonify(message="Error updating client."), 500

# --- DELETE /<id> (Supprime UN client) ---
@clients_bp.route('/<string:client_id>', methods=['DELETE'])
@login_required(role="manager") # Seul Manager peut supprimer un client
def delete_client(client_id):
    try:
        oid = ObjectId(client_id)
    except Exception:
        log_action('delete_client', 'client', entity_id=client_id, status='failure', details={'error': 'Invalid client ID format'})
        return jsonify(message="Invalid client ID format."), 400

    try:
        client_to_delete = clients_collection().find_one({'_id': oid}, {'CIN': 1, 'firstName': 1, 'lastName': 1})
        if not client_to_delete:
            log_action('delete_client', 'client', entity_id=oid, status='failure', details={'error': 'Client not found'})
            return jsonify(message="Client not found."), 404
        
        # Vérifier si le client a des réservations actives
        existing_reservations = reservations_collection().count_documents({'clientId': oid})
        if existing_reservations > 0:
            log_action('delete_client', 'client', entity_id=oid, status='failure', details={'error': 'Client has active reservations', 'reservation_count': existing_reservations})
            return jsonify(message=f"Client cannot be deleted. This client has {existing_reservations} existing reservation(s)."), 409 # 409 Conflict

        # For now, proceed with deletion and log.

        result = clients_collection().delete_one({'_id': oid})

        if result.deleted_count:
            log_action('delete_client', 'client', entity_id=oid, status='success', details={'deleted_CIN': client_to_delete.get('CIN'), 'deleted_name': f"{client_to_delete.get('firstName')} {client_to_delete.get('lastName')}"})
            return '', 204 
        else:
            # Should be caught by find_one above
            log_action('delete_client', 'client', entity_id=oid, status='failure', details={'error': 'Client not found during delete operation'})
            return jsonify(message="Client not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting client {client_id}: {e}")
        log_action('delete_client', 'client', entity_id=client_id, status='failure', details={'error': str(e)})
        return jsonify(message="Error deleting client."), 500