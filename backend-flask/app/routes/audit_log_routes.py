from flask import Blueprint, request, jsonify, current_app, session
from ..extensions import mongo
from ..utils.helpers import bson_to_json, mongo_to_dict 
from bson import ObjectId
from datetime import datetime, timedelta
from functools import wraps

# login_required decorator (ensure this is consistent with your project's auth handling)
def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                current_app.logger.warn("Audit log access attempt without session.")
                return jsonify(message="Authentication required"), 401
            
            user_role = session.get('user_role')
            current_app.logger.debug(f"User role: {user_role}, Required role: {role}")
            if role and user_role != role:
                current_app.logger.warn(f"User {session.get('username')} with role {user_role} tried to access admin audit log.")
                return jsonify(message=f"Access forbidden: '{role}' role required. You have '{user_role}'."), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

audit_log_bp = Blueprint('audit_log', __name__, url_prefix='/api/audit-logs')

@audit_log_bp.route('/', methods=['GET'])
@login_required(role="admin")
def get_audit_logs():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        if page < 1: page = 1
        if per_page < 1: per_page = 1
        if per_page > 100: per_page = 100 

        query = {}

        # Filtering options
        user_id_str = request.args.get('userId')
        if user_id_str:
            try:
                query['userId'] = ObjectId(user_id_str)
            except Exception:
                return jsonify(message="Invalid userId format. Must be a valid ObjectId."), 400

        user_username = request.args.get('userUsername')
        if user_username:
            query['userUsername'] = {'$regex': user_username, '$options': 'i'}

        action = request.args.get('action')
        if action:
            query['action'] = {'$regex': action, '$options': 'i'}

        entity_type = request.args.get('entityType')
        if entity_type:
            query['entityType'] = {'$regex': entity_type, '$options': 'i'}
        
        entity_id_str = request.args.get('entityId')
        if entity_id_str:
            try:
                query['entityId'] = ObjectId(entity_id_str)
            except Exception:
                return jsonify(message="Invalid entityId format. Must be a valid ObjectId."), 400

        start_date_str = request.args.get('startDate')
        end_date_str = request.args.get('endDate')
        
        date_filter = {}
        if start_date_str:
            try:
                # Expecting YYYY-MM-DD format for date part
                dt_start = datetime.fromisoformat(start_date_str.split('T')[0] + 'T00:00:00')
                date_filter['$gte'] = dt_start
            except ValueError:
                return jsonify(message="Invalid startDate format. Use YYYY-MM-DD or ISO format e.g., YYYY-MM-DDTHH:MM:SSZ"), 400
        
        if end_date_str:
            try:
                # Expecting YYYY-MM-DD format for date part, set to end of that day
                dt_end = datetime.fromisoformat(end_date_str.split('T')[0] + 'T00:00:00') + timedelta(days=1, microseconds=-1)
                date_filter['$lte'] = dt_end
            except ValueError:
                return jsonify(message="Invalid endDate format. Use YYYY-MM-DD or ISO format e.g., YYYY-MM-DDTHH:MM:SSZ"), 400

        if date_filter:
            query['timestamp'] = date_filter
            
        current_app.logger.debug(f"Audit log query: {query}")

        total_logs = mongo.db.audit_log.count_documents(query)
        # Sort by timestamp descending
        logs_cursor = mongo.db.audit_log.find(query).sort('timestamp', -1).skip((page - 1) * per_page).limit(per_page)
        
        logs_list = [mongo_to_dict(log) for log in logs_cursor]

        return jsonify({
            "logs": bson_to_json(logs_list),
            "page": page,
            "per_page": per_page,
            "total": total_logs,
            "totalPages": (total_logs + per_page - 1) // per_page if per_page > 0 else 0
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching audit logs: {e}", exc_info=True)
        return jsonify(message="An error occurred while fetching audit logs.", error=str(e)), 500

