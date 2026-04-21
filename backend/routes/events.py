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

    @app.route('/owner/events/<int:event_id>', methods=['PUT'])
    def update_event(event_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401

        data = request.get_json()
        allowed_statuses = [
            'Quote Submitted', 'Consultation', 'Planning',
            'Vendors Set', 'Event Day', 'Completed'
        ]

        fields = []
        values = []

        if 'status' in data:
            if data['status'] not in allowed_statuses:
                return jsonify({'success': False, 'message': 'Invalid status'}), 400
            fields.append('status = %s')
            values.append(data['status'])

        if 'event_date' in data:
            fields.append('event_date = %s')
            values.append(data['event_date'] or None)

        if 'location' in data:
            fields.append('location = %s')
            values.append(data['location'])

        if 'planner' in data:
            fields.append('planner = %s')
            values.append(data['planner'])

        if 'event_name' in data:
            fields.append('event_name = %s')
            values.append(data['event_name'])

        if not fields:
            return jsonify({'success': False, 'message': 'No fields to update'}), 400

        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            values.append(event_id)
            cur.execute(
                'UPDATE events SET ' + ', '.join(fields) + ' WHERE id = %s RETURNING *',
                values
            )
            updated = cur.fetchone()
            db.commit()
            cur.close()
            db.close()
            if not updated:
                return jsonify({'success': False, 'message': 'Event not found'}), 404
            if updated.get('event_date'):
                updated['event_date'] = str(updated['event_date'])
            if updated.get('created_at'):
                updated['created_at'] = str(updated['created_at'])
            return jsonify({'success': True, 'event': dict(updated)})
        except Exception as e:
            print('update_event error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500