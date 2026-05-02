from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
from email_service import notify_owner_new_message


def register_client_action_routes(app):

    @app.route('/client/tasks/<int:task_id>/complete', methods=['PUT'])
    def client_complete_task(task_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE tasks SET completed = TRUE WHERE id = %s", (task_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/client/messages', methods=['POST'])
    def client_send_message():
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        uid = tok['user_id']
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT firstname, lastname FROM client WHERE user_id = %s", (uid,))
        row = cur.fetchone()
        sender = row[0] + ' ' + row[1] if row else 'Client'
        client_email = ''
        cur.execute("SELECT email FROM client WHERE user_id = %s", (uid,))
        email_row = cur.fetchone()
        if email_row: client_email = email_row[0]
        cur.execute("SELECT event_name FROM events WHERE id = %s", (data['event_id'],))
        ev_row = cur.fetchone()
        event_name = ev_row[0] if ev_row else ''
        cur.execute("INSERT INTO client_messages (event_id, sender, text) VALUES (%s,%s,%s)",
            (data['event_id'], sender, data['text']))
        db.commit(); cur.close(); db.close()
        notify_owner_new_message(sender, client_email, data['text'], event_name)
        return jsonify({'success': True})

    @app.route('/client/messages/<int:event_id>/read', methods=['PUT'])
    def mark_messages_read(event_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE client_messages SET read = TRUE WHERE event_id = %s AND sender = 'Vision Realized'", (event_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})