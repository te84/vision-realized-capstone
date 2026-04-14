from flask import request, jsonify
from db import get_db
from routes.auth import verify_token


def register_owner_communication_routes(app):

    @app.route('/owner/messages', methods=['POST'])
    def send_message():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO client_messages (event_id, sender, text) VALUES (%s,%s,%s)",
            (data['event_id'], data.get('sender', 'Vision Realized'), data['text']))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Message sent'})

    @app.route('/owner/documents', methods=['POST'])
    def add_document():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO documents (event_id, name, file_type, status) VALUES (%s,%s,%s,%s)",
            (data['event_id'], data['name'], data.get('file_type','PDF'), data.get('status','Uploaded')))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Document added'})