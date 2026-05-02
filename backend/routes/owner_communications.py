from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
from email_service import notify_client_new_message


def register_owner_communication_routes(app):
    @app.route('/owner/contact-conversations', methods=['GET'])
    def contact_conversations():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("""SELECT DISTINCT ON (LOWER(email)) id, name, email, message, sender, created_at
            FROM contact_messages
            ORDER BY LOWER(email), created_at DESC""")
        rows = cur.fetchall()
        conversations = []
        for r in rows:
            conversations.append({
                'id': r[0],
                'name': r[1],
                'email': r[2],
                'message': r[3],
                'sender': r[4],
                'created_at': str(r[5]) if r[5] else None
            })
        cur.close(); db.close()
        return jsonify({'success': True, 'conversations': conversations})

    @app.route('/owner/contact-conversation/<path:email>', methods=['GET'])
    def contact_conversation(email):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("""SELECT id, name, email, message, sender, created_at
            FROM contact_messages
            WHERE LOWER(email) = LOWER(%s)
            ORDER BY created_at ASC""", (email,))
        rows = cur.fetchall()
        messages = []
        for r in rows:
            messages.append({
                'id': r[0],
                'name': r[1],
                'email': r[2],
                'message': r[3],
                'sender': r[4],
                'created_at': str(r[5]) if r[5] else None
            })
        cur.close(); db.close()
        return jsonify({'success': True, 'messages': messages})

    @app.route('/owner/contact-conversation', methods=['POST'])
    def send_contact_reply():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()
        cur.execute("INSERT INTO contact_messages (name, email, message, sender) VALUES (%s,%s,%s,%s)",
            (data.get('name', ''), data['email'], data['message'], 'Vision Realized'))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Reply sent'})

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
        # look up client email for notification
        cur.execute("""SELECT c.email, c.firstname FROM client c
            JOIN events e ON e.client_id = c.client_id
            WHERE e.id = %s""", (data['event_id'],))
        client_row = cur.fetchone()
        db.commit(); cur.close(); db.close()
        if client_row and client_row[0]:
            notify_client_new_message(client_row[0], client_row[1] or 'Client', data['text'])
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