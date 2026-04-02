from flask import jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras


def register_dashboard_routes(app):

    @app.route('/client/dashboard', methods=['GET'])
    def client_dashboard():
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401

        uid = tok['user_id']
        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

            cur.execute("SELECT client_id, firstname, lastname, email FROM client WHERE user_id = %s", (uid,))
            client = cur.fetchone()
            if not client:
                cur.close(); db.close()
                return jsonify({'message': 'Client profile not found'}), 404

            cid = client['client_id']

            cur.execute("SELECT * FROM events WHERE client_id = %s ORDER BY created_at DESC LIMIT 1", (cid,))
            event = cur.fetchone()

            ev_data = None
            eid = None
            if event:
                eid = event['id']
                ev_data = {
                    'id': event['id'], 'name': event['event_name'],
                    'date': str(event['event_date']) if event['event_date'] else None,
                    'location': event['location'], 'guests': event['guests'],
                    'planner': event['planner'], 'status': event['status'],
                    'event_type': event['event_type']
                }

            tasks = []
            if eid:
                cur.execute("SELECT * FROM tasks WHERE event_id = %s ORDER BY created_at", (eid,))
                for t in cur.fetchall():
                    tasks.append({'id': t['id'], 'title': t['title'],
                        'due_date': str(t['due_date']) if t['due_date'] else None,
                        'completed': t['completed']})

            messages = []
            if eid:
                cur.execute("SELECT * FROM client_messages WHERE event_id = %s ORDER BY created_at DESC", (eid,))
                for m in cur.fetchall():
                    messages.append({'id': m['id'], 'sender': m['sender'], 'text': m['text'],
                        'date': str(m['created_at']), 'read': m['read']})

            docs = []
            if eid:
                cur.execute("SELECT * FROM documents WHERE event_id = %s ORDER BY created_at DESC", (eid,))
                for d in cur.fetchall():
                    docs.append({'id': d['id'], 'name': d['name'], 'type': d['file_type'],
                        'date': str(d['created_at']), 'status': d['status']})

            journey = []
            if ev_data:
                steps = ['Quote Submitted','Consultation','Planning','Vendors Set','Event Day','Completed']
                cur_status = ev_data['status'] or 'Quote Submitted'
                idx = 0
                for i in range(len(steps)):
                    if steps[i] == cur_status:
                        idx = i
                        break
                for i in range(len(steps)):
                    if i < idx: st = 'done'
                    elif i == idx: st = 'current'
                    else: st = 'pending'
                    journey.append({'step': i+1, 'name': steps[i], 'status': st})

            cur.close(); db.close()

            return jsonify({
                'user': {'firstname': client['firstname'], 'lastname': client['lastname'], 'email': client['email']},
                'event': ev_data, 'tasks': tasks, 'messages': messages, 'documents': docs, 'journey': journey
            })
        except Exception as e:
            print('dashboard error:', e)
            return jsonify({'message': 'Server error'}), 500
