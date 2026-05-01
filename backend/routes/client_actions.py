from flask import request, jsonify
from db import get_db
from routes.auth import verify_token


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
        cur.execute("INSERT INTO client_messages (event_id, sender, text) VALUES (%s,%s,%s)",
            (data['event_id'], sender, data['text']))
        db.commit(); cur.close(); db.close()
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