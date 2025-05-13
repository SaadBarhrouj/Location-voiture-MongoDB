# app/routes/cars.py
from flask import Blueprint, request, jsonify, current_app, session # Ajout session
from bson import ObjectId
from datetime import datetime

# Importer mongo et les helpers
from ..extensions import mongo
from ..utils.helpers import mongo_to_dict, bson_to_json, login_required # Ajout login_required

# Créer le Blueprint pour les voitures
cars_bp = Blueprint('cars', __name__)

cars_collection = lambda: mongo.db.cars # Raccourci pour la collection

# --- GET / (Liste toutes les voitures) ---
@cars_bp.route('', methods=['GET'])
# @login_required(role="manager") # Manager ou Admin requis
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
@login_required(role="manager") # Manager ou Admin requis
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
@login_required(role="admin") # Seul Admin peut créer
def create_car():
    try:
        data = request.get_json()
        required_fields = ['make', 'model', 'year', 'licensePlate', 'status', 'dailyRate']
        if not data or not all(field in data for field in required_fields):
            return jsonify(message="Missing required fields"), 400

        # Prépare les données de la nouvelle voiture
        new_car = {
            "make": data['make'],
            "model": data['model'],
            "year": int(data['year']),
            "licensePlate": data['licensePlate'],
            "status": data['status'], # TODO: Valider les valeurs de status?
            "dailyRate": float(data['dailyRate']),
            "description": data.get('description'),
            "imageUrl": data.get('imageUrl'), # TODO: Gérer l'upload d'image plus tard
            "added_at": datetime.utcnow(),
            "added_by_id": session.get('user_id'), # Qui a ajouté
            "added_by_username": session.get('username') # Qui a ajouté
        }

        # Insère dans la BDD
        result = cars_collection().insert_one(new_car)
        if result.inserted_id:
            created_car_doc = cars_collection().find_one({'_id': result.inserted_id})
            return bson_to_json(mongo_to_dict(created_car_doc)), 201
        else:
            return jsonify(message="Failed to create car."), 500

    except ValueError:
         return jsonify(message="Invalid data type for year or dailyRate."), 400
    except Exception as e:
        current_app.logger.error(f"Error creating car: {e}")
        return jsonify(message="Error creating car."), 500

# --- PUT /<id> (Met à jour UNE voiture) ---
@cars_bp.route('/<string:car_id>', methods=['PUT'])
@login_required(role="admin") # Seul Admin peut modifier
def update_car(car_id):
    try:
        oid = ObjectId(car_id)
    except Exception:
        return jsonify(message="Invalid car ID format."), 400

    try:
        data = request.get_json()
        if not data: return jsonify(message="No update data provided."), 400

        # Prépare les champs à mettre à jour
        update_fields = {}
        allowed_updates = ['make', 'model', 'year', 'licensePlate', 'status', 'dailyRate', 'description', 'imageUrl']
        for key in allowed_updates:
            if key in data:
                # Gérer les types
                if key == 'year' and data[key] is not None:
                    update_fields[key] = int(data[key])
                elif key == 'dailyRate' and data[key] is not None:
                    update_fields[key] = float(data[key])
                # TODO: Valider les valeurs de status ici aussi?
                else:
                    update_fields[key] = data[key]

        if not update_fields: return jsonify(message="No valid fields provided for update."), 400

        # Met à jour dans la BDD
        result = cars_collection().update_one({'_id': oid}, {'$set': update_fields})

        if result.matched_count:
            updated_car_doc = cars_collection().find_one({'_id': oid})
            return bson_to_json(mongo_to_dict(updated_car_doc)), 200
        else:
            return jsonify(message="Car not found."), 404

    except ValueError:
         return jsonify(message="Invalid data type for year or dailyRate."), 400
    except Exception as e:
        current_app.logger.error(f"Error updating car {car_id}: {e}")
        return jsonify(message="Error updating car."), 500

# --- DELETE /<id> (Supprime UNE voiture) ---
@cars_bp.route('/<string:car_id>', methods=['DELETE'])
@login_required(role="admin") # Seul Admin peut supprimer
def delete_car(car_id):
    try:
        oid = ObjectId(car_id)
    except Exception:
        return jsonify(message="Invalid car ID format."), 400

    try:
        # TODO: Vérifier si la voiture n'est pas dans une réservation active avant de supprimer?
        result = cars_collection().delete_one({'_id': oid})

        if result.deleted_count:
            return '', 204 # Succès, No Content
        else:
            return jsonify(message="Car not found."), 404
    except Exception as e:
        current_app.logger.error(f"Error deleting car {car_id}: {e}")
        return jsonify(message="Error deleting car."), 500

# --- POST /<id>/image (Upload image - Non implémenté) ---
# Route préparée mais logique à faire
@cars_bp.route('/<string:car_id>/image', methods=['POST'])
@login_required(role="admin") # Seul Admin peut uploader
def upload_car_image(car_id):
    # TODO: Ajouter la logique pour recevoir un fichier ('file'),
    # le sauvegarder (avec un nom unique, peut-être dans un dossier 'uploads'),
    # mettre à jour le champ 'imageUrl' de la voiture avec l'URL de l'image,
    # et renvoyer l'URL. Utiliser request.files['file'].
    # Utiliser un helper pour save_file serait bien.

    # Pour l'instant, on retourne une erreur "Not Implemented"
    return jsonify(message="File upload not implemented yet."), 501