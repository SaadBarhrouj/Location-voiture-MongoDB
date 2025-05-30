from flask import Blueprint, jsonify, current_app
from ..extensions import mongo
from ..utils.helpers import login_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

users_collection = lambda: mongo.db.users

@admin_bp.route('/stats', methods=['GET'])
@login_required(role="admin")
def get_admin_stats():
    try:
        total_managers = users_collection().count_documents({'role': 'manager'})
        total_system_users = users_collection().count_documents({}) 

        stats = {
            "totalManagers": total_managers,
            "totalSystemUsers": total_system_users
        }
        return jsonify(stats), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching admin stats: {e}")
        return jsonify(message="Error fetching admin statistics."), 500

