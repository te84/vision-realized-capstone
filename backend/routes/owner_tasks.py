from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
from email_service import notify_client_new_task


def register_owner_task_routes(app):

    @app.route('/owner/tasks', methods=['POST'])
    def add_task():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO tasks (event_id, title, due_date) VALUES (%s,%s,%s) RETURNING id",
            (data['event_id'], data['title'], data.get('due_date')))
        task_id = cur.fetchone()[0]
        # notify client
        cur.execute("""SELECT c.email, c.firstname FROM client c
            JOIN events e ON e.client_id = c.client_id
            WHERE e.id = %s""", (data['event_id'],))
        client_row = cur.fetchone()
        db.commit(); cur.close(); db.close()
        if client_row and client_row[0]:
            notify_client_new_task(client_row[0], client_row[1] or 'Client', data['title'], data.get('due_date', ''))
        return jsonify({'success': True, 'task_id': task_id})

    @app.route('/owner/tasks/<int:task_id>', methods=['PUT'])
    def toggle_task_owner(task_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE tasks SET completed = NOT completed WHERE id = %s", (task_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/owner/tasks/<int:task_id>', methods=['DELETE'])
    def delete_task(task_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})