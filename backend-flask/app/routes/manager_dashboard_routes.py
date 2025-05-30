from flask import Blueprint, jsonify, current_app, request
from bson import ObjectId
from app.extensions import mongo
from ..utils.helpers import login_required # Changed from app.utils.auth_utils import token_required
from ..utils.audit_logger import log_action # Assuming this is the correct path for log_action
from datetime import datetime, timedelta

manager_dashboard_bp = Blueprint('manager_dashboard_bp', __name__, url_prefix='/api/manager/dashboard')

@manager_dashboard_bp.route('/stats', methods=['GET'])
@login_required(role="manager")
def get_manager_dashboard_stats():
    try:
        cars_collection = mongo.db.cars
        clients_collection = mongo.db.clients
        reservations_collection = mongo.db.reservations

        # Car stats
        total_cars = cars_collection.count_documents({})
        available_cars = cars_collection.count_documents({"status": "available"})
        rented_cars = cars_collection.count_documents({"status": "rented"})
        maintenance_cars = cars_collection.count_documents({"status": "maintenance"})

        # Client stats
        total_clients = clients_collection.count_documents({})

        # Reservation stats
        active_reservations = reservations_collection.count_documents({"status": "active"})
        pending_reservations = reservations_collection.count_documents({"status": {"$in": ["pending_confirmation", "pending"]}})

        # Monthly Revenue
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        if now.month == 12:
            end_of_month = datetime(now.year + 1, 1, 1)
        else:
            end_of_month = datetime(now.year, now.month + 1, 1)

        monthly_revenue_pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "actualReturnDate": {
                        "$gte": start_of_month.isoformat(),
                        "$lt": end_of_month.isoformat()
                    },
                    "finalTotalCost": {"$exists": True, "$type": "number"}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "totalRevenue": {"$sum": "$finalTotalCost"}
                }
            }
        ]
        revenue_result = list(reservations_collection.aggregate(monthly_revenue_pipeline))
        monthly_revenue = revenue_result[0]['totalRevenue'] if revenue_result else 0

        stats = {
            "totalCars": total_cars,
            "availableCars": available_cars,
            "rentedCars": rented_cars,
            "maintenanceCars": maintenance_cars,
            "totalClients": total_clients,
            "activeReservations": active_reservations,
            "pendingReservations": pending_reservations,
            "monthlyRevenue": monthly_revenue,
        }
        return jsonify(stats), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching manager dashboard stats: {e}")
        return jsonify(message=f"Error fetching manager dashboard stats: {str(e)}"), 500


@manager_dashboard_bp.route('/recent-clients', methods=['GET'])
@login_required(role="manager") # Changed from @token_required
def get_recent_clients():
    try:
        limit = int(request.args.get('limit', 3))
        clients_collection = mongo.db.clients
        
        recent_clients_cursor = clients_collection.find().sort("createdAt", -1).limit(limit)
        
        clients_list = []
        for client in recent_clients_cursor:
            clients_list.append({
                "id": str(client["_id"]),
                "name": f"{client.get('firstName', '')} {client.get('lastName', '')}".strip(),
                "email": client.get("email"),
                "registeredAt": client.get("createdAt") 
            })
        return jsonify(clients_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching recent clients: {e}")
        return jsonify(message=f"Error fetching recent clients: {str(e)}"), 500


@manager_dashboard_bp.route('/recent-reservations', methods=['GET'])
@login_required(role="manager") 
def get_recent_reservations():
    try:
        limit = int(request.args.get('limit', 3))
        reservations_collection = mongo.db.reservations

        recent_reservations_cursor = reservations_collection.find().sort("reservationDate", -1).limit(limit)
        
        reservations_list = []
        for res in recent_reservations_cursor:
            client_name = "N/A"
            if res.get("clientDetails") and res["clientDetails"].get("firstName"):
                 client_name = f"{res['clientDetails'].get('firstName', '')} {res['clientDetails'].get('lastName', '')}".strip()
            elif res.get("clientId"): 
                client_doc = mongo.db.clients.find_one({"_id": ObjectId(res["clientId"])}, {"firstName": 1, "lastName": 1})
                if client_doc:
                    client_name = f"{client_doc.get('firstName', '')} {client_doc.get('lastName', '')}".strip()

            car_model_name = "N/A"
            if res.get("carDetails") and res["carDetails"].get("make"):
                car_model_name = f"{res['carDetails'].get('make', '')} {res['carDetails'].get('model', '')}".strip()
            elif res.get("carId"): 
                car_doc = mongo.db.cars.find_one({"_id": ObjectId(res["carId"])}, {"make": 1, "model": 1})
                if car_doc:
                    car_model_name = f"{car_doc.get('make', '')} {car_doc.get('model', '')}".strip()
            
            reservations_list.append({
                "id": str(res["_id"]),
                "clientName": client_name,
                "carModel": car_model_name,
                "startDate": res.get("startDate"), 
                "status": res.get("status")
            })
        return jsonify(reservations_list), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching recent reservations: {e}")
        return jsonify(message=f"Error fetching recent reservations: {str(e)}"), 500