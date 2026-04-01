from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import hashlib
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL)

# Simple password hashing (for demo purposes)
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'message': 'Username and password required'}), 400
        
        db = get_db()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT u.*,
                   COALESCE(o.firstname, c.firstname) as firstname,
                   COALESCE(o.lastname, c.lastname) as lastname,
                   COALESCE(o.email, c.email) as email
            FROM users u
            LEFT JOIN owner o ON u.user_id = o.user_id
            LEFT JOIN client c ON u.user_id = c.user_id
            WHERE u.username = %s
        """, (username,))
        
        user = cursor.fetchone()
        cursor.close()
        db.close()
        
        if not user:
            return jsonify({'message': 'Invalid username or password'}), 401
        
        if hash_password(password) != user['password']:
            return jsonify({'message': 'Invalid username or password'}), 401

        token = jwt.encode({
            'user_id': user['user_id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY)
        
        user = dict(user)
        user.pop('password', None)

        return jsonify({'success': True, 'token': token, 'user': user})
        
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'message': 'Server error'}), 500

@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM users')
        count = cursor.fetchone()[0]
        cursor.close()
        db.close()
        return jsonify({'message': f'Database connected! {count} users found.'})
    except Exception as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500

if __name__ == '__main__':
    print('Server starting on http://localhost:5000')
    app.run(debug=True, port=5000)