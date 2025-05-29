from flask import current_app, session
from datetime import datetime
from bson import ObjectId

def log_action(action, entity_type, entity_id=None, details=None, status='success', user_id=None, user_username=None):
    """
    Logs an action to the audit_log collection.

    Args:
        action (str): Description of the action (e.g., 'create_user', 'login_attempt').
        entity_type (str): The type of entity being affected (e.g., 'user', 'car', 'system').
        entity_id (ObjectId, optional): The ID of the entity being affected. Defaults to None.
        details (dict, optional): Additional details about the event. Defaults to None.
        status (str, optional): Status of the action ('success', 'failure', 'info'). Defaults to 'success'.
        user_id (ObjectId, optional): The ID of the user performing the action.
                                      If None, tries to get from session.
        user_username (str, optional): The username of the user performing the action.
                                       If None, tries to get from session.
    """
    try:
        mongo = current_app.extensions['mongo']
        audit_log_collection = mongo.db.audit_log

        log_entry = {
            "timestamp": datetime.utcnow(),
            "action": action,
            "entityType": entity_type,
            "status": status,
        }

        # Attempt to get user info from session if not provided
        if user_id is None and 'user_id' in session:
            try:
                log_entry['userId'] = ObjectId(session['user_id'])
            except Exception: # Handle cases where session['user_id'] might not be a valid ObjectId string
                current_app.logger.warn(f"Could not convert session user_id to ObjectId for audit log: {session['user_id']}")
                log_entry['userId'] = session['user_id'] # Log as string if conversion fails
        elif user_id:
            log_entry['userId'] = user_id

        if user_username is None and 'username' in session:
            log_entry['userUsername'] = session['username']
        elif user_username:
            log_entry['userUsername'] = user_username
        
        # If user info is still not available (e.g., system action before login)
        if 'userId' not in log_entry and 'userUsername' not in log_entry:
            log_entry['userUsername'] = 'system' # Default to system if no user context

        if entity_id:
            log_entry['entityId'] = entity_id
        if details:
            log_entry['details'] = details

        audit_log_collection.insert_one(log_entry)
        current_app.logger.info(f"Audit log: {action} on {entity_type} by {log_entry.get('userUsername', 'N/A')}, Status: {status}")

    except Exception as e:
        current_app.logger.error(f"Failed to log action '{action}' for entity_type '{entity_type}': {e}", exc_info=True)
