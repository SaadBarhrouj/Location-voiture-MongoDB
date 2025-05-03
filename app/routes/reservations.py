# app/routes/reservations.py
from flask import Blueprint, request, jsonify, current_app, session
from bson import ObjectId
from datetime import datetime

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required

# Créer le Blueprint
reservations_bp = Blueprint('reservations', __name__)

# Accès aux collections
reservations_collection = lambda: mongo.db.reservations
cars_collection = lambda: mongo.db.cars
clients_collection = lambda: mongo.db.clients

# --- Helper interne pour récupérer les détails ---
def _get_reservation_details(res_doc):
    """Récupère et ajoute les détails voiture/client à un document réservation."""
    if not res_doc:
        return None
    res_dict = mongo_to_dict(res_doc)
    car = cars_collection().find_one({'_id': res_doc.get('carId')}, {'make': 1, 'model': 1, 'licensePlate': 1, 'imageUrl': 1})
    res_dict['carDetails'] = mongo_to_dict(car) if car else None
    client = clients_collection().find_one({'_id': res_doc.get('clientId')}, {'firstName': 1, 'lastName': 1, 'email': 1})
    res_dict['clientDetails'] = mongo_to_dict(client) if client else None
    return res_dict

# --- GET / (Liste toutes les réservations) ---
@reservations_bp.route('', methods=['GET'])
@login_required(role="manager") # Manager ou Admin
def get_reservations():
    try:
        reservations_list = []
        # Trier par date de réservation la plus récente
        reservations_cursor = reservations_collection().find().sort("reservationDate", -1)
        for res in reservations_cursor:
            details = _get_reservation_details(res)
            if details:
                reservations_list.append(details)
        return bson_to_json(reservations_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching reservations: {e}")
        return jsonify(message="Error fetching reservations."), 500

# --- GET /<id> (Récupère UNE réservation) ---
@reservations_bp.route('/<string:reservation_id>', methods=['GET'])
@login_required(role="manager") # Manager ou Admin
def get_reservation_by_id(reservation_id):
    try:
        oid = ObjectId(reservation_id)
    except Exception:
        return jsonify(message="Invalid reservation ID format."), 400

    try:
        reservation_doc = reservations_collection().find_one({'_id': oid})
        if reservation_doc:
            details = _get_reservation_details(reservation_doc)
            return bson_to_json(details), 200
        else:
            return jsonify(message="Reservation not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching reservation {reservation_id}: {e}")
        return jsonify(message="Error fetching reservation."), 500

# --- POST / (Crée une nouvelle réservation) ---
@reservations_bp.route('', methods=['POST'])
@login_required(role="manager") # Manager ou Admin crée la réservation
def create_reservation():
    try:
        data = request.get_json()
        required_fields = ['carId', 'clientId', 'startDate', 'endDate', 'totalCost'] # Status peut être optionnel avec défaut 'pending'
        if not data or not all(field in data for field in required_fields):
            return jsonify(message="Missing required fields: carId, clientId, startDate, endDate, totalCost"), 400

        try:
            car_oid = ObjectId(data['carId'])
            client_oid = ObjectId(data['clientId'])
        except Exception:
            return jsonify(message="Invalid carId or clientId format."), 400

        # Vérifier existence voiture/client
        car = cars_collection().find_one({'_id': car_oid})
        client = clients_collection().find_one({'_id': client_oid})
        if not car: return jsonify(message="Car not found."), 404
        if not client: return jsonify(message="Client not found."), 404

        # TODO: Ajouter logique de vérification de disponibilité de la voiture ici

        # Préparer le document
        new_reservation = {
            "carId": car_oid,
            "clientId": client_oid,
            "startDate": data['startDate'],
            "endDate": data['endDate'],
            "totalCost": float(data['totalCost']),
            "status": data.get('status', 'pending'), # Défaut 'pending'
            "notes": data.get('notes', ''),
            "reservationDate": datetime.utcnow(),
            "decisionDate": None,
            "createdBy": session.get('user_id')
        }

        # Insérer
        result = reservations_collection().insert_one(new_reservation)
        if result.inserted_id:
             created_res_doc = reservations_collection().find_one({'_id': result.inserted_id})
             details = _get_reservation_details(created_res_doc) # Récupérer détails pour réponse
             return bson_to_json(details), 201 # 201 Created
        else:
             return jsonify(message="Failed to create reservation."), 500

    except ValueError:
        return jsonify(message="Invalid data type for totalCost."), 400
    except Exception as e:
        current_app.logger.error(f"Error creating reservation: {e}")
        return jsonify(message="Error creating reservation."), 500

# --- PUT /<id> (Met à jour UNE réservation) ---
@reservations_bp.route('/<string:reservation_id>', methods=['PUT'])
@login_required(role="manager") # Manager ou Admin peut modifier
def update_reservation(reservation_id):
    try:
        oid = ObjectId(reservation_id)
    except Exception:
        return jsonify(message="Invalid reservation ID format."), 400

    try:
        data = request.get_json()
        if not data: return jsonify(message="No update data provided."), 400

        # Vérifier si la réservation existe
        existing_reservation = reservations_collection().find_one({'_id': oid})
        if not existing_reservation:
            return jsonify(message="Reservation not found."), 404

        # Champs modifiables (exclure status volontairement, utiliser /status pour ça)
        update_fields = {}
        allowed_updates = ['startDate', 'endDate', 'totalCost', 'notes', 'carId', 'clientId']

        for key in allowed_updates:
            if key in data:
                 # Validation/Conversion si nécessaire (ex: ObjectId, float)
                 if key in ['carId', 'clientId']:
                     try: update_fields[key] = ObjectId(data[key])
                     except: return jsonify(message=f"Invalid {key} format."), 400
                 elif key == 'totalCost':
                     try: update_fields[key] = float(data[key])
                     except: return jsonify(message="Invalid totalCost format."), 400
                 else:
                     update_fields[key] = data[key]

        if not update_fields: return jsonify(message="No valid fields provided for update."), 400

        # TODO: Si dates ou voiture changent, revérifier disponibilité?

        # Mettre à jour
        result = reservations_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            updated_res_doc = reservations_collection().find_one({'_id': oid})
            details = _get_reservation_details(updated_res_doc)
            return bson_to_json(details), 200
        else:
            # Normalement impossible si find_one a réussi avant, mais sécurité
            return jsonify(message="Reservation not found during update."), 404

    except ValueError:
         return jsonify(message="Invalid data type for totalCost."), 400
    except Exception as e:
        current_app.logger.error(f"Error updating reservation {reservation_id}: {e}")
        return jsonify(message="Error updating reservation."), 500

# --- PUT /<id>/status (Met à jour SEULEMENT le statut) ---
@reservations_bp.route('/<string:reservation_id>/status', methods=['PUT'])
@login_required(role="manager") # Manager ou Admin décide du statut
def update_reservation_status(reservation_id):
    try:
        oid = ObjectId(reservation_id)
    except Exception:
        return jsonify(message="Invalid reservation ID format."), 400

    try:
        data = request.get_json()
        new_status = data.get('status')

        # Valider le nouveau statut (liste de statuts possibles)
        valid_statuses = ["pending", "accepted", "refused", "active", "completed", "cancelled"]
        if not new_status or new_status not in valid_statuses:
            return jsonify(message=f"Invalid status value. Must be one of: {', '.join(valid_statuses)}"), 400

        # Préparer la mise à jour (statut et date de décision)
        update_data = {
            'status': new_status,
            'decisionDate': datetime.utcnow() # Mettre à jour la date de décision
        }

        # TODO: Logique métier supplémentaire
        # - Si accepted/active: vérifier dispo voiture, changer statut voiture ?
        # - Si completed/cancelled: remettre voiture 'available' ?

        result = reservations_collection().update_one({'_id': oid}, {'$set': update_data})

        if result.matched_count:
            updated_res_doc = reservations_collection().find_one({'_id': oid})
            details = _get_reservation_details(updated_res_doc)
            return bson_to_json(details), 200
        else:
            return jsonify(message="Reservation not found."), 404

    except Exception as e:
        current_app.logger.error(f"Error updating reservation status {reservation_id}: {e}")
        return jsonify(message="Error updating reservation status."), 500

# --- DELETE /<id> (Supprime/Annule une réservation) ---
@reservations_bp.route('/<string:reservation_id>', methods=['DELETE'])
@login_required(role="admin") # Seul l'admin peut supprimer (ou manager selon règles)
def delete_reservation(reservation_id):
    try:
        oid = ObjectId(reservation_id)
    except Exception:
        return jsonify(message="Invalid reservation ID format."), 400

    try:
        # TODO: Logique avant suppression: remettre voiture 'available' si besoin ?
        result = reservations_collection().delete_one({'_id': oid})

        if result.deleted_count:
            return '', 204 # Succès, No Content
        else:
            return jsonify(message="Reservation not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting reservation {reservation_id}: {e}")
        return jsonify(message="Error deleting reservation."), 500