from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras
 
 
def register_owner_events_routes(app):
 
    @app.route('/owner/events', methods=['GET'])
    def owner_events():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""
                SELECT e.*, c.firstname, c.lastname, c.email, c.phone_number
                FROM events e
                JOIN client c ON e.client_id = c.client_id
                ORDER BY e.created_at DESC
            """)
            evts = [dict(r) for r in cur.fetchall()]
            for ev in evts:
                if ev.get('event_date'): ev['event_date'] = str(ev['event_date'])
                if ev.get('created_at'): ev['created_at'] = str(ev['created_at'])
            cur.close(); db.close()
            return jsonify({'success': True, 'events': evts})
        except Exception as e:
            print('owner_events error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500