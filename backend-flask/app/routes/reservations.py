from flask import Blueprint, request, jsonify, current_app, session
from bson import ObjectId
from datetime import datetime
import uuid 

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required
from ..utils.audit_logger import log_action 

# Créer le Blueprint
reservations_bp = Blueprint('reservations', __name__)

# Accès aux collections
reservations_collection = lambda: mongo.db.reservations
cars_collection = lambda: mongo.db.cars
clients_collection = lambda: mongo.db.clients
users_collection = lambda: mongo.db.users 

# Helper temporaire simple pour user_id
def _get_user_id():
    try:
        return ObjectId(session.get('user_id', ObjectId()))
    except:
        return ObjectId()

# --- Helper pour validation des dates ---
def _validate_reservation_dates(start_date_str, end_date_str):
    """Valide que les dates de réservation sont cohérentes."""
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        if end_date < start_date:
            return False, "End date cannot be before start date."
        
        return True, None
    except ValueError as e:
        return False, f"Invalid date format: {str(e)}"

# --- Helper pour calculer le coût estimé ---
def _calculate_estimated_cost(car_doc, start_date_str, end_date_str):
    """Calcule le coût estimé basé sur le dailyRate et la durée."""
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        
        # Calculer le nombre de jours (inclus le jour de fin)
        days = (end_date - start_date).days + 1
        
        daily_rate = car_doc.get('dailyRate', 0)
        if daily_rate <= 0:
            return None, "Car daily rate is not set or invalid."
        
        estimated_cost = days * daily_rate
        return estimated_cost, None
    except ValueError as e:
        return None, f"Error calculating cost: {str(e)}"

# --- Helper interne pour récupérer les détails ---
def _get_reservation_details(res_doc):
    """Récupère et ajoute les détails voiture/client/utilisateur à un document réservation."""
    if not res_doc:
        return None
    res_dict = mongo_to_dict(res_doc)
    
    # Détails de la voiture
    car_doc = cars_collection().find_one({'_id': res_doc.get('carId')}, {'make': 1, 'model': 1, 'licensePlate': 1, 'imageUrl': 1, 'vin': 1, 'status': 1})
    res_dict['carDetails'] = mongo_to_dict(car_doc) if car_doc else None
    
    # Détails du client
    client_doc = clients_collection().find_one({'_id': res_doc.get('clientId')}, {'firstName': 1, 'lastName': 1, 'email': 1, 'phone': 1})
    res_dict['clientDetails'] = mongo_to_dict(client_doc) if client_doc else None
    
    # Détails de l'utilisateur (créateur)
    if res_doc.get('createdBy'):
        user_doc_created = users_collection().find_one({'_id': res_doc.get('createdBy')}, {'username': 1, 'fullName': 1})
        res_dict['createdByUser'] = mongo_to_dict(user_doc_created) if user_doc_created else None
    
    # Détails de l'utilisateur (dernière modification)
    if res_doc.get('lastModifiedBy'):
        user_doc_modified = users_collection().find_one({'_id': res_doc.get('lastModifiedBy')}, {'username': 1, 'fullName': 1})
        res_dict['lastModifiedByUser'] = mongo_to_dict(user_doc_modified) if user_doc_modified else None
        
    return res_dict

# --- GET / (Liste toutes les réservations) ---
@reservations_bp.route('', methods=['GET'])
@login_required(role="manager") 
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
@login_required(role="manager") 
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
@login_required(role="manager") 
def create_reservation():
    data = request.get_json()
    try:
        required_fields = ['carId', 'clientId', 'startDate', 'endDate']
        if not data or not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            return jsonify(message=f"Missing required fields: {', '.join(missing)}"), 400

        # Validation des dates
        is_valid, date_error = _validate_reservation_dates(data['startDate'], data['endDate'])
        if not is_valid:
            return jsonify(message=date_error), 400

        car_oid = ObjectId(data['carId'])
        client_oid = ObjectId(data['clientId'])
        created_by_oid = _get_user_id()

        car = cars_collection().find_one({'_id': car_oid})
        client = clients_collection().find_one({'_id': client_oid})
        if not car: 
            return jsonify(message="Car not found."), 404
        if not client: 
            return jsonify(message="Client not found."), 404

        # Calcul automatique du coût estimé
        estimated_cost, cost_error = _calculate_estimated_cost(car, data['startDate'], data['endDate'])
        if estimated_cost is None:
            return jsonify(message=cost_error), 400

        # Permettre de surcharger le coût estimé si fourni (pour des cas spéciaux)
        if 'estimatedTotalCost' in data:
            provided_cost = float(data['estimatedTotalCost'])
            if provided_cost > 0:
                estimated_cost = provided_cost

        reservation_number = uuid.uuid4().hex[:10].upper()
        while reservations_collection().find_one({"reservationNumber": reservation_number}):
            reservation_number = uuid.uuid4().hex[:10].upper()

        amount_paid = float(data.get('paymentDetails', {}).get('amountPaid', 0.0))

        new_reservation = {
            "reservationNumber": reservation_number,
            "carId": car_oid,
            "clientId": client_oid,
            "startDate": data['startDate'],
            "endDate": data['endDate'],
            "actualPickupDate": None,
            "actualReturnDate": None,
            "status": data.get('status', 'pending_confirmation'),
            "estimatedTotalCost": estimated_cost,
            "finalTotalCost": None, 
            "notes": data.get('notes', ''),
            "reservationDate": datetime.utcnow(),
            "createdBy": created_by_oid,
            "lastModifiedAt": datetime.utcnow(),
            "lastModifiedBy": created_by_oid,
            "paymentDetails": {
                "amountPaid": amount_paid,
                "remainingBalance": estimated_cost - amount_paid,
                "transactionDate": data.get('paymentDetails', {}).get('transactionDate') 
            }
        }

        # Insérer
        result = reservations_collection().insert_one(new_reservation)
        if result.inserted_id:
             log_action('create_reservation', 'reservation', entity_id=result.inserted_id, status='success', details={'reservationNumber': reservation_number, 'carId': str(car_oid), 'clientId': str(client_oid)})
             created_res_doc = reservations_collection().find_one({'_id': result.inserted_id})
             details = _get_reservation_details(created_res_doc) 
             return bson_to_json(details), 201 
        else:
             return jsonify(message="Failed to create reservation."), 500

    except (ValueError, TypeError) as ve:
        return jsonify(message=f"Invalid data type or format: {str(ve)}."), 400
    except Exception as e:
        current_app.logger.error(f"Error creating reservation: {e}")
        return jsonify(message="Error creating reservation."), 500

# --- PUT /<id> (Met à jour UNE réservation) ---
@reservations_bp.route('/<string:reservation_id>', methods=['PUT'])
@login_required(role="manager") 
def update_reservation(reservation_id):
    data = request.get_json()
    try:
        oid = ObjectId(reservation_id)
        modified_by_oid = _get_user_id()
    except Exception:
        return jsonify(message="Invalid reservation ID or user_id format."), 400

    try:
        if not data: 
            return jsonify(message="No update data provided."), 400

        existing_reservation = reservations_collection().find_one({'_id': oid})
        if not existing_reservation:
            return jsonify(message="Reservation not found."), 404

        # Validation des dates si modifiées
        start_date = data.get('startDate', existing_reservation.get('startDate'))
        end_date = data.get('endDate', existing_reservation.get('endDate'))
        
        if 'startDate' in data or 'endDate' in data:
            is_valid, date_error = _validate_reservation_dates(start_date, end_date)
            if not is_valid:
                return jsonify(message=date_error), 400

        update_fields = {}
        # Champs modifiables directement via cette route.
        # status, actualPickupDate, actualReturnDate, finalTotalCost sont gérés ailleurs ou par des logiques spécifiques.
        allowed_updates = ['carId', 'clientId', 'startDate', 'endDate', 'estimatedTotalCost', 'notes']
        payment_details_update = data.get('paymentDetails', {})

        # Recalcul automatique du coût si dates ou voiture changent
        should_recalculate_cost = False
        new_car_id = data.get('carId', existing_reservation.get('carId'))
        
        for key in allowed_updates:
            if key in data:
                 if key in ['carId', 'clientId']:
                     update_fields[key] = ObjectId(data[key])
                     if key == 'carId':
                         should_recalculate_cost = True
                 elif key == 'estimatedTotalCost':
                     update_fields[key] = float(data[key])
                 elif key in ['startDate', 'endDate']:
                     update_fields[key] = data[key]
                     should_recalculate_cost = True
                 else:
                     update_fields[key] = data[key]
        
        # Recalcul du coût estimé si nécessaire
        if should_recalculate_cost and 'estimatedTotalCost' not in data:
            car_doc = cars_collection().find_one({'_id': ObjectId(new_car_id)})
            if car_doc:
                estimated_cost, cost_error = _calculate_estimated_cost(car_doc, start_date, end_date)
                if estimated_cost is not None:
                    update_fields['estimatedTotalCost'] = estimated_cost
                else:
                    return jsonify(message=cost_error), 400
        
        # Gestion spécifique de paymentDetails
        current_payment_details = existing_reservation.get('paymentDetails', {})
        new_payment_details = current_payment_details.copy()

        payment_changed = False
        if 'amountPaid' in payment_details_update:
            new_payment_details['amountPaid'] = float(payment_details_update['amountPaid'])
            payment_changed = True
        
        if 'transactionDate' in payment_details_update: # Peut être None pour effacer
            new_payment_details['transactionDate'] = payment_details_update['transactionDate']
            payment_changed = True

        # Recalculer remainingBalance si amountPaid ou estimatedTotalCost a changé
        # Utiliser la nouvelle valeur de estimatedTotalCost si elle est dans update_fields, sinon l'existante
        current_estimated_cost = update_fields.get('estimatedTotalCost', existing_reservation.get('estimatedTotalCost'))
        if payment_changed or 'estimatedTotalCost' in update_fields:
            new_payment_details['remainingBalance'] = current_estimated_cost - new_payment_details.get('amountPaid', 0.0)
            update_fields['paymentDetails'] = new_payment_details
        elif payment_changed: 
             update_fields['paymentDetails'] = new_payment_details

        if not update_fields: 
            return jsonify(message="No valid fields provided for update."), 400

        # Mettre à jour les timestamps de modification
        update_fields['lastModifiedAt'] = datetime.utcnow()
        update_fields['lastModifiedBy'] = modified_by_oid

        result = reservations_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            log_action('update_reservation', 'reservation', entity_id=oid, status='success', details={'updated_fields': list(update_fields.keys())})
            updated_res_doc = reservations_collection().find_one({'_id': oid})
            details = _get_reservation_details(updated_res_doc)
            return bson_to_json(details), 200
        else:
            return jsonify(message="Reservation not found during update."), 404

    except (ValueError, TypeError) as ve:
         return jsonify(message=f"Invalid data type or format: {str(ve)}."), 400
    except Exception as e:
        current_app.logger.error(f"Error updating reservation {reservation_id}: {e}")
        return jsonify(message="Error updating reservation."), 500

# --- PUT /<id>/status (Met à jour SEULEMENT le statut) ---
@reservations_bp.route('/<string:reservation_id>/status', methods=['PUT'])
@login_required(role="manager") 
def update_reservation_status(reservation_id):
    data = request.get_json()
    try:
        oid = ObjectId(reservation_id)
        modified_by_oid = _get_user_id()
    except Exception:
        return jsonify(message="Invalid reservation ID or user_id format."), 400

    try:
        new_status = data.get('status')
        valid_statuses = ["pending_confirmation", "confirmed", "active", "completed", "cancelled_by_client", "cancelled_by_agency", "no_show"]
        if not new_status or new_status not in valid_statuses:
            return jsonify(message=f"Invalid status value. Must be one of: {', '.join(valid_statuses)}"), 400

        reservation = reservations_collection().find_one({'_id': oid})
        if not reservation:
            return jsonify(message="Reservation not found."), 404

        update_data = {
            'status': new_status,
            'lastModifiedAt': datetime.utcnow(),
            'lastModifiedBy': modified_by_oid
        }

        action_details = {'old_status': reservation.get('status'), 'new_status': new_status, 'carId': str(reservation.get('carId'))}

        if new_status == 'active':
            update_data['actualPickupDate'] = datetime.utcnow()
            cars_collection().update_one({'_id': reservation.get('carId')}, {'$set': {'status': 'rented', 'updatedAt': datetime.utcnow(), 'updatedBy': modified_by_oid}})
            log_action('update_car_status', 'car', entity_id=reservation.get('carId'), status='success', details={'new_status': 'rented', 'reason': f'Reservation {reservation.get("reservationNumber")} active'})
        elif new_status == 'completed':
            update_data['actualReturnDate'] = datetime.utcnow()
            cars_collection().update_one({'_id': reservation.get('carId')}, {'$set': {'status': 'available', 'updatedAt': datetime.utcnow(), 'updatedBy': modified_by_oid}})
            log_action('update_car_status', 'car', entity_id=reservation.get('carId'), status='success', details={'new_status': 'available', 'reason': f'Reservation {reservation.get("reservationNumber")} completed'})
            
            # Gérer le coût final
            if 'finalTotalCost' in data: 
                update_data['finalTotalCost'] = float(data['finalTotalCost'])
            else: 
                update_data['finalTotalCost'] = reservation.get('estimatedTotalCost')
            
            # Mettre à jour les détails de paiement avec les nouvelles informations
            current_payment_details = reservation.get('paymentDetails', {})
            
            # Les nouveaux détails de paiement peuvent être envoyés dans les données
            if 'paymentDetails' in data:
                payment_update = data['paymentDetails']
                new_amount_paid = float(payment_update.get('amountPaid', current_payment_details.get('amountPaid', 0.0)))
                new_transaction_date = payment_update.get('transactionDate', current_payment_details.get('transactionDate'))
                
                update_data['paymentDetails'] = {
                    'amountPaid': new_amount_paid,
                    'remainingBalance': update_data['finalTotalCost'] - new_amount_paid,
                    'transactionDate': new_transaction_date
                }
            else:
                # Utiliser les détails existants mais recalculer le solde
                amount_paid = current_payment_details.get('amountPaid', 0.0)
                update_data['paymentDetails.remainingBalance'] = update_data['finalTotalCost'] - amount_paid
            
            # Ajouter les notes de completion si fournies
            if 'completionNotes' in data:
                update_data['notes'] = data['completionNotes']
            
            action_details['finalTotalCost'] = update_data['finalTotalCost']

        elif new_status in ["cancelled_by_client", "cancelled_by_agency", "no_show"]:
            car_doc = cars_collection().find_one({'_id': reservation.get('carId')})
            if car_doc and car_doc.get('status') not in ['available', 'maintenance']:
                 cars_collection().update_one({'_id': reservation.get('carId')}, {'$set': {'status': 'available', 'updatedAt': datetime.utcnow(), 'updatedBy': modified_by_oid}})
                 log_action('update_car_status', 'car', entity_id=reservation.get('carId'), status='success', details={'new_status': 'available', 'reason': f'Reservation {reservation.get("reservationNumber")} cancelled/no-show'})

        result = reservations_collection().update_one({'_id': oid}, {'$set': update_data})

        if result.matched_count:
            log_action('update_reservation_status', 'reservation', entity_id=oid, status='success', details=action_details)
            updated_res_doc = reservations_collection().find_one({'_id': oid})
            details = _get_reservation_details(updated_res_doc)
            return bson_to_json(details), 200
        else:
            return jsonify(message="Reservation not found."), 404

    except (ValueError, TypeError) as ve:
        return jsonify(message=f"Invalid data type or format for status update: {str(ve)}."),400
    except Exception as e:
        current_app.logger.error(f"Error updating reservation status {reservation_id}: {e}")
        return jsonify(message="Error updating reservation status."), 500

# --- DELETE /<id> (Supprime/Annule une réservation) ---
@reservations_bp.route('/<string:reservation_id>', methods=['DELETE'])
@login_required(role="manager") 
def delete_reservation(reservation_id):
    try:
        oid = ObjectId(reservation_id)
        modified_by_oid = _get_user_id()
    except Exception:
        return jsonify(message="Invalid reservation ID or user_id format."), 400

    try:
        reservation = reservations_collection().find_one({'_id': oid}) 
        if not reservation:
            return jsonify(message="Reservation not found."), 404

        action_details = {'reservationNumber': reservation.get('reservationNumber'), 'carId': str(reservation.get('carId'))}

        if reservation: # This if is redundant but present in read_file output
            car_doc = cars_collection().find_one({'_id': reservation.get('carId')})
            if car_doc and car_doc.get('status') not in ['available', 'maintenance']:
                 cars_collection().update_one({'_id': reservation.get('carId')}, {'$set': {'status': 'available', 'updatedAt': datetime.utcnow(), 'updatedBy': modified_by_oid}})
                 log_action('update_car_status', 'car', entity_id=reservation.get('carId'), status='success', details={'new_status': 'available', 'reason': f'Reservation {reservation.get("reservationNumber")} deleted'})
        
        result = reservations_collection().delete_one({'_id': oid})

        if result.deleted_count:
            log_action('delete_reservation', 'reservation', entity_id=oid, status='success', details=action_details)
            return '', 204 # Succès, No Content
        else:
            # This case should be caught by the find_one for reservation above
            return jsonify(message="Reservation not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting reservation {reservation_id}: {e}")
        return jsonify(message="Error deleting reservation."), 500