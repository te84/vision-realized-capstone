from flask import request, jsonify
from db import get_db
from routes.auth import verify_token


def register_owner_task_routes(app):

    @app.route('/owner/tasks', methods=['POST'])
    def add_task():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO tasks (event_id, title, due_date) VALUES (%s,%s,%s)",
            (data['event_id'], data['title'], data.get('due_date')))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Task added'})

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