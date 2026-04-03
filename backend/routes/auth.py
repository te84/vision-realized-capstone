from flask import request, jsonify
from db import get_db, hash_password, SECRET_KEY
import psycopg2.extras
import jwt
import datetime


def verify_token():
    auth = request.headers.get('Authorization')
    if not auth:
        return None
    parts = auth.split(' ')
    if len(parts) != 2:
        return None
    try:
        return jwt.decode(parts[1], SECRET_KEY, algorithms=['HS256'])
    except:
        return None


def register_auth_routes(app):

    @app.route('/login', methods=['POST'])
    def login():
        data = request.json
        uname = data.get('username')
        pw = data.get('password')
        if not uname or not pw:
            return jsonify({'message': 'Username and password required'}), 400

        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("""SELECT u.*, COALESCE(o.firstname, c.firstname) as firstname,
                COALESCE(o.lastname, c.lastname) as lastname,
                COALESCE(o.email, c.email) as email
                FROM users u LEFT JOIN owner o ON u.user_id = o.user_id
                LEFT JOIN client c ON u.user_id = c.user_id
                WHERE u.username = %s""", (uname,))
            user = cur.fetchone()
            cur.close()
            db.close()

            if not user:
                return jsonify({'message': 'Invalid username or password'}), 401
            if hash_password(pw) != user['password']:
                return jsonify({'message': 'Invalid username or password'}), 401

            tok = jwt.encode({
                'user_id': user['user_id'], 'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, SECRET_KEY)

            user = dict(user)
            user.pop('password', None)
            return jsonify({'success': True, 'token': tok, 'user': user})
        except Exception as e:
            print('login error:', e)
            return jsonify({'message': 'Server error'}), 500
