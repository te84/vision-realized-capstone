from flask import request, jsonify
from db import get_db


def register_contact_routes(app):

    @app.route('/contact', methods=['POST'])
    def contact():
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        msg = data.get('message')
        if not name or not email or not msg:
            return jsonify({'success': False, 'message': 'All fields required'}), 400
        try:
            db = get_db()
            cur = db.cursor()
            cur.execute("INSERT INTO contact_messages (name, email, message) VALUES (%s,%s,%s)", (name, email, msg))
            db.commit(); cur.close(); db.close()
            return jsonify({'success': True, 'message': 'Message received'})
        except Exception as e:
            print('contact error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500
