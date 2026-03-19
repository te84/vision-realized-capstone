from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import hashlib
import jwt
import datetime

app = Flask(__name__)
CORS(app)

# Secret key for JWT
SECRET_KEY = 'your-secret-key-here'

# Database connection
def get_db():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='',  # Change this to your MySQL password
        database='vision_realized'
    )

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
        
        # Connect to database
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # Simple query to get user
        cursor.execute("""
            SELECT u.*, 
                   COALESCE(o.firstname, c.firstname) as firstname,
                   COALESCE(o.lastname, c.lastname) as lastname,
                   COALESCE(o.email, c.email) as email
            FROM Users u
            LEFT JOIN Owner o ON u.user_id = o.user_id
            LEFT JOIN Client c ON u.user_id = c.user_id
            WHERE u.username = %s
        """, (username,))
        
        user = cursor.fetchone()
        cursor.close()
        db.close()
        
        if not user:
            return jsonify({'message': 'Invalid username or password'}), 401
        
        # Check password (using SHA256 for simplicity)
        hashed_input = hash_password(password)
        if hashed_input != user['password']:
            return jsonify({'message': 'Invalid username or password'}), 401
        
        # Create simple token
        token = jwt.encode({
            'user_id': user['user_id'],
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY)
        
        # Return user info (without password)
        user.pop('password', None)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user
        })
        
    except Exception as e:
        print('Error:', str(e))
        return jsonify({'message': 'Server error'}), 500

@app.route('/test-db', methods=['GET'])
def test_db():
    """Simple endpoint to test database connection"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT COUNT(*) FROM Users')
        count = cursor.fetchone()[0]
        cursor.close()
        db.close()
        return jsonify({'message': f'Database connected! {count} users found.'})
    except Exception as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500

if __name__ == '__main__':
    print('Server starting on http://localhost:5000')
    print('Test database: http://localhost:5000/test-db')
    app.run(debug=True, port=5000)