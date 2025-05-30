# // filepath: c:\Users\ASUS\Documents\S8\BD\Car_rental\Location-voiture-MongoDB\backend-flask\app\routes\admin_routes.py
from flask import Blueprint, jsonify, current_app
from ..extensions import mongo
from ..utils.helpers import login_required # Assuming your login_required is here
from ..utils.audit_logger import log_action

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

users_collection = lambda: mongo.db.users

@admin_bp.route('/stats', methods=['GET'])
 #@login_required(role="admin") # Or appropriate role
def get_admin_stats():
    try:
        total_managers = users_collection().count_documents({'role': 'manager'})
        # Define how you count total system users, e.g., all users or specific roles
        total_system_users = users_collection().count_documents({}) # Example: counts all users

        stats = {
            "totalManagers": total_managers,
            "totalSystemUsers": total_system_users
        }
        log_action('get_admin_stats', 'system_stats', status='success')
        return jsonify(stats), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching admin stats: {e}")
        log_action('get_admin_stats', 'system_stats', status='failure', details={'error': str(e)})
        return jsonify(message="Error fetching admin statistics."), 500

# Add other admin-specific utility routes here if needed