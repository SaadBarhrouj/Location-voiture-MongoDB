from flask import Blueprint, request, jsonify, current_app, session 
from bson import ObjectId
from datetime import datetime
import os 
from werkzeug.utils import secure_filename 
import uuid 

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required 
from ..utils.audit_logger import log_action 

cars_bp = Blueprint('cars', __name__)

cars_collection = lambda: mongo.db.cars
reservations_collection = lambda: mongo.db.reservations 

# Helper function pour sauvegarder l'image de la voiture
def _save_car_image(file_storage, entity_identifier_for_log: str):
    """Sauvegarde l'image et retourne l'URL de l'image ou lève une exception."""
    if not file_storage or file_storage.filename == '':
        return None 


    upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
    allowed_extensions = current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif'})

    filename = file_storage.filename
    if not ('.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        raise ValueError(f"File type not allowed. Allowed: {', '.join(allowed_extensions)}")

    original_filename = secure_filename(filename)
    extension = original_filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{extension}"
    
    if not os.path.exists(upload_folder):
        try:
            os.makedirs(upload_folder)
        except OSError as e:
            current_app.logger.error(f"Error creating upload directory {upload_folder}: {e}")
            raise IOError(f"Server error: Could not create upload directory.")
    
    file_path = os.path.join(upload_folder, unique_filename)
    try:
        file_storage.save(file_path)
        static_url_path = os.path.join('uploads', 'cars', unique_filename).replace('\\\\', '/') 
        image_url = f"/{current_app.static_url_path}/{static_url_path}"
        if not image_url.startswith('/static/'):
             image_url = f"/static/{static_url_path}"


        return image_url
    except Exception as e:
        current_app.logger.error(f"Error saving uploaded file {unique_filename}: {e}")
        raise IOError(f"Error saving file.")

# --- GET / (Liste toutes les voitures) ---
@cars_bp.route('', methods=['GET'])
@login_required(role="manager") 
def get_cars():
    try:
        cars_cursor = cars_collection().find()
        cars_list = [mongo_to_dict(car) for car in cars_cursor]
        return bson_to_json(cars_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching cars: {e}")
        return jsonify(message="Error fetching cars."), 500

# --- GET /<id> (Récupère UNE voiture) ---
@cars_bp.route('/<string:car_id>', methods=['GET'])
@login_required(role="manager")
def get_car_by_id(car_id):
    try:
        oid = ObjectId(car_id)
    except Exception:
        return jsonify(message="Invalid car ID format."), 400

    try:
        car_doc = cars_collection().find_one({'_id': oid})
        if car_doc:
            return bson_to_json(mongo_to_dict(car_doc)), 200
        else:
            return jsonify(message="Car not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching car {car_id}: {e}")
        return jsonify(message="Error fetching car."), 500

# --- POST / (Crée une nouvelle voiture) ---
@cars_bp.route('', methods=['POST'])
@login_required(role="manager")
def create_car():
    image_url_for_db = None 
    data = {}
    try:
        # Pour multipart/form-data, les données textuelles sont dans request.form
        # et les fichiers dans request.files
        data = request.form.to_dict() 
        image_file = request.files.get('imageFile') 

        required_fields = ['make', 'model', 'year', 'licensePlate', 'vin', 'status', 'dailyRate']
        if not all(field in data for field in required_fields):
            return jsonify(message="Missing required fields. Required: " + ", ".join(required_fields)), 400

        # Vérifications d'unicité pour licensePlate et vin
        if cars_collection().find_one({"licensePlate": data['licensePlate']}):
            return jsonify(message=f"License plate '{data['licensePlate']}' already exists."), 409

        if cars_collection().find_one({"vin": data['vin']}):
            return jsonify(message=f"VIN '{data['vin']}' already exists."), 409
        
        user_id_from_session = session.get('user_id')
        try:
            added_by_oid = ObjectId(user_id_from_session) if user_id_from_session else None
        except Exception:
            current_app.logger.warn(f"Could not convert session user_id to ObjectId for car creation: {user_id_from_session}")
            added_by_oid = None

        if image_file:
            try:
                image_url_for_db = _save_car_image(image_file, data.get('vin', 'new_car_creation'))
            except ValueError as ve:
                return jsonify(message=str(ve)), 400
            except IOError as ioe: 
                return jsonify(message=f"Could not save image: {str(ioe)}"), 500
        
        new_car_data = {
            "make": data['make'],
            "model": data['model'],
            "licensePlate": data['licensePlate'],
            "vin": data['vin'],
            "color": data.get('color'),
            "status": data['status'],
            "description": data.get('description'),
            "imageUrl": image_url_for_db,
            "addedAt": datetime.utcnow(),
            "addedBy": added_by_oid,
            "updatedAt": None,
            "updatedBy": None
        }

        try:
            new_car_data["year"] = int(data['year'])
            new_car_data["dailyRate"] = float(data['dailyRate'])
        except ValueError:
            if image_url_for_db:
                try:
                    filename_to_delete = image_url_for_db.split('/')[-1]
                    upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                    filepath_to_delete = os.path.join(upload_folder, filename_to_delete)
                    if os.path.exists(filepath_to_delete):
                        os.remove(filepath_to_delete)
                except Exception as e_remove:
                    current_app.logger.error(f"Error deleting orphaned image {image_url_for_db} during car creation failure: {e_remove}")
            return jsonify(message="Invalid data type for year or dailyRate."), 400

        result = cars_collection().insert_one(new_car_data)
        if result.inserted_id:
            log_action('create_car', 'car', entity_id=result.inserted_id, status='success', 
                       details={
                           'vin': new_car_data['vin'], 
                           'licensePlate': new_car_data['licensePlate'],
                           'imageUrl': new_car_data.get('imageUrl')
                        })
            created_car_doc = cars_collection().find_one({'_id': result.inserted_id})
            return bson_to_json(mongo_to_dict(created_car_doc)), 201
        else:

            if image_url_for_db:
                try:
                    filename_to_delete = image_url_for_db.split('/')[-1]
                    upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                    filepath_to_delete = os.path.join(upload_folder, filename_to_delete)
                    if os.path.exists(filepath_to_delete):
                        os.remove(filepath_to_delete)
                except Exception as e_remove:
                    current_app.logger.error(f"Error deleting orphaned image {image_url_for_db} during car creation failure (DB insert): {e_remove}")
            return jsonify(message="Failed to create car."), 500

    except Exception as e:
        current_app.logger.error(f"Error creating car: {e}")

        if image_url_for_db: 
            try:
                filename_to_delete = image_url_for_db.split('/')[-1]
                upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                filepath_to_delete = os.path.join(upload_folder, filename_to_delete)
                if os.path.exists(filepath_to_delete):
                    os.remove(filepath_to_delete)
            except Exception as e_remove:
                current_app.logger.error(f"Error deleting orphaned image {image_url_for_db} during general car creation exception: {e_remove}")
        return jsonify(message="Error creating car."), 500

# --- PUT /<id> (Met à jour UNE voiture) ---
@cars_bp.route('/<string:car_id>', methods=['PUT'])
@login_required(role="manager")
def update_car(car_id):
    try:
        oid = ObjectId(car_id)
    except Exception:
        return jsonify(message="Invalid car ID format."), 400

    try:
        current_car_doc = cars_collection().find_one({'_id': oid})
        if not current_car_doc:
            return jsonify(message="Car not found."), 404

        # Pour multipart/form-data
        data = request.form.to_dict()
        image_file = request.files.get('imageFile')

        update_fields = {}
        allowed_updates = ['make', 'model', 'year', 'licensePlate', 'vin', 'color', 'status', 'dailyRate', 'description']
        
        before_details_log = {} 

        for key in allowed_updates:
            if key in data:
                new_value = data[key]
                if key == 'year' and new_value is not None:
                    try:
                        new_value = int(new_value)
                    except ValueError:
                        return jsonify(message=f"Invalid year format: {new_value}"), 400
                elif key == 'dailyRate' and new_value is not None:
                    try:
                        new_value = float(new_value)
                    except ValueError:
                        return jsonify(message=f"Invalid dailyRate format: {new_value}"), 400
                
                # Vérifier si la valeur a réellement changé avant de l'ajouter aux champs à mettre à jour
                if new_value != current_car_doc.get(key):
                    # Vérifications d'unicité pour licensePlate et vin
                    if key == 'licensePlate':
                        if cars_collection().find_one({"licensePlate": new_value, "_id": {"$ne": oid}}):
                            return jsonify(message=f"License plate '{new_value}' already exists for another car."), 409
                    elif key == 'vin':
                        if cars_collection().find_one({"vin": new_value, "_id": {"$ne": oid}}):
                            return jsonify(message=f"VIN '{new_value}' already exists for another car."), 409
                    
                    before_details_log[key] = current_car_doc.get(key)
                    update_fields[key] = new_value

        new_image_url = None
        if image_file:
            try:
                new_image_url = _save_car_image(image_file, car_id)
                if new_image_url:

                    old_image_url = current_car_doc.get('imageUrl')
                    if old_image_url != new_image_url :
                         before_details_log['imageUrl'] = old_image_url
                         update_fields['imageUrl'] = new_image_url
                    
                    # Supprimer l'ancien fichier image du serveur si old_image_url existe et est différent de new_image_url
                    if old_image_url and old_image_url != new_image_url:
                        try:
                            old_filename = old_image_url.split('/')[-1]
                            upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                            old_filepath = os.path.join(upload_folder, old_filename)
                            if os.path.exists(old_filepath):
                                os.remove(old_filepath)
                        except Exception as e_remove:
                            current_app.logger.error(f"Error deleting old car image {old_image_url}: {e_remove}")

            except ValueError as ve:
                return jsonify(message=str(ve)), 400
            except IOError as ioe:
                return jsonify(message=f"Could not save image: {str(ioe)}"), 500
        

        if 'imageUrl' in data and (data['imageUrl'] is None or data['imageUrl'] == '') and not image_file:
            old_image_url = current_car_doc.get('imageUrl')
            if old_image_url:
                before_details_log['imageUrl'] = old_image_url
                update_fields['imageUrl'] = None
                try:
                    old_filename = old_image_url.split('/')[-1]
                    upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                    old_filepath = os.path.join(upload_folder, old_filename)
                    if os.path.exists(old_filepath):
                        os.remove(old_filepath)
                except Exception as e_remove:
                    current_app.logger.error(f"Error deleting existing car image {old_image_url}: {e_remove}")


        if not update_fields:
            return jsonify(message="No changes detected or no valid fields provided for update."), 200 
        user_id_from_session = session.get('user_id')
        try:
            updated_by_oid = ObjectId(user_id_from_session) if user_id_from_session else None
        except Exception:
            current_app.logger.warn(f"Could not convert session user_id to ObjectId for car update: {user_id_from_session}")
            updated_by_oid = None

        update_fields['updatedAt'] = datetime.utcnow()
        update_fields['updatedBy'] = updated_by_oid

        result = cars_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            updated_car_doc_for_log = cars_collection().find_one({'_id': oid})
            after_details_log = {key: updated_car_doc_for_log.get(key) for key in update_fields}
            
            log_action('update_car', 'car', entity_id=oid, status='success', 
                       details={
                           'updated_fields': list(update_fields.keys()),
                           'before': before_details_log, 
                           'after': after_details_log  
                        })
            return bson_to_json(mongo_to_dict(updated_car_doc_for_log)), 200
        else:
            return jsonify(message="Car not found during update operation."), 404 

    except Exception as e:
        current_app.logger.error(f"Error updating car {car_id}: {e}")
        return jsonify(message="Error updating car."), 500

# --- DELETE /<id> (Supprime UNE voiture) ---
@cars_bp.route('/<string:car_id>', methods=['DELETE'])
@login_required(role="manager") 
def delete_car(car_id):
    try:
        oid = ObjectId(car_id)
    except Exception:
        return jsonify(message="Invalid car ID format."), 400

    try:
        car_to_delete = cars_collection().find_one({'_id': oid}, {'vin': 1, 'licensePlate': 1, 'status': 1, 'imageUrl': 1}) 
        if not car_to_delete:
            return jsonify(message="Car not found."), 404


        active_or_confirmed_reservations = reservations_collection().find_one({
            "carId": oid, 
            "status": {"$in": ["active", "confirmed"]}
        })

        if active_or_confirmed_reservations:
            reservation_id_str = str(active_or_confirmed_reservations['_id'])

            return jsonify(message=f"Cannot delete car. It is part of an active or confirmed reservation (ID: {reservation_id_str})."), 409

        if car_to_delete.get('status') == 'rented':

            pass 
        
        # Sauvegarder l'URL de l'image avant de supprimer le document de la DB
        image_url_to_delete = car_to_delete.get('imageUrl')

        result = cars_collection().delete_one({'_id': oid})

        if result.deleted_count:
            # Si la voiture est supprimée de la DB, supprimer aussi son image du serveur
            if image_url_to_delete:
                try:
                    filename_to_delete = image_url_to_delete.split('/')[-1]
                    upload_folder = current_app.config.get('UPLOAD_FOLDER_CARS', os.path.join(current_app.static_folder, 'uploads', 'cars'))
                    filepath_to_delete = os.path.join(upload_folder, filename_to_delete)
                    if os.path.exists(filepath_to_delete):
                        os.remove(filepath_to_delete)
                except Exception as e_remove_img:
                    current_app.logger.error(f"Error deleting image file {image_url_to_delete} for deleted car {oid}: {e_remove_img}")
            log_action('delete_car', 'car', entity_id=oid, status='success', details={'deleted_car_vin': car_to_delete.get('vin'), 'deleted_car_licensePlate': car_to_delete.get('licensePlate')})
            return jsonify(message="Car deleted successfully."), 200
        else:
            return jsonify(message="Failed to delete car."), 500

    except Exception as e:
        current_app.logger.error(f"Error deleting car {car_id}: {e}")
        return jsonify(message="Error deleting car."), 500

