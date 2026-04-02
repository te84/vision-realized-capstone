from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import hashlib
import jwt
import datetime
import os

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'vision-realized-login')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://vision_realized_user:UuFB5OCPR9MvGnixWrBYlLCiVkYAW3Yx@dpg-d72kntkg9agc739ajt4g-a.oregon-postgres.render.com/vision_realized')

def get_db():
    return psycopg2.connect(DATABASE_URL)

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

try:
    db = get_db()
    cur = db.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY, client_id INT NOT NULL, event_name VARCHAR(200),
        event_date DATE, location VARCHAR(200), guests VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Quote Submitted', planner VARCHAR(100),
        event_type VARCHAR(100), created_at TIMESTAMP DEFAULT NOW())""")
    cur.execute("""CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY, event_id INT NOT NULL, title VARCHAR(300),
        due_date DATE, completed BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())""")
    cur.execute("""CREATE TABLE IF NOT EXISTS client_messages (
        id SERIAL PRIMARY KEY, event_id INT NOT NULL, sender VARCHAR(100),
        text TEXT, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())""")
    cur.execute("""CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY, event_id INT NOT NULL, name VARCHAR(300),
        file_type VARCHAR(50), status VARCHAR(50) DEFAULT 'Uploaded', created_at TIMESTAMP DEFAULT NOW())""")
    cur.execute("""CREATE TABLE IF NOT EXISTS security_questions (
        id SERIAL PRIMARY KEY, user_id INT NOT NULL UNIQUE, question VARCHAR(300),
        answer VARCHAR(300), created_at TIMESTAMP DEFAULT NOW())""")
    db.commit()
    cur.close()
    db.close()
    print('tables ok')
except Exception as e:
    print('table error:', e)


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


@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute('SELECT COUNT(*) FROM users')
        cnt = cur.fetchone()[0]
        cur.close()
        db.close()
        return jsonify({'message': f'Connected. {cnt} users.'})
    except Exception as e:
        return jsonify({'message': f'DB error: {e}'}), 500


@app.route('/submit-quote', methods=['POST'])
def submit_quote():
    data = request.get_json()
    fname = data.get('first_name', '')
    lname = data.get('last_name', '')
    email = data.get('email', '')
    phone = data.get('phone', '')
    pw = data.get('password', '')

    try:
        db = get_db()
        cur = db.cursor()

        cur.execute("INSERT INTO quotes (first_name, last_name, email, phone, source, event_type, event_date, guests, location, budget) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (fname, lname, email, phone, data.get('source',''), data.get('event_type',''),
             data.get('event_date',''), data.get('guests',''), data.get('location',''), data.get('budget','')))

        user_id = None
        if email and pw:
            cur.execute("SELECT user_id FROM users WHERE username = %s", (email,))
            existing = cur.fetchone()

            if not existing:
                hashed = hash_password(pw)
                cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'Client') RETURNING user_id", (email, hashed))
                user_id = cur.fetchone()[0]

                cur.execute("INSERT INTO client (user_id, firstname, lastname, email, phone_number) VALUES (%s,%s,%s,%s,%s) RETURNING client_id",
                    (user_id, fname, lname, email, phone))
                client_id = cur.fetchone()[0]

                sq = data.get('security_question', '')
                sa = data.get('security_answer', '')
                if sq and sa:
                    cur.execute("INSERT INTO security_questions (user_id, question, answer) VALUES (%s,%s,%s)",
                        (user_id, sq, sa.lower().strip()))

                ev_name = fname + "'s " + data.get('event_type', 'Event')
                ev_date = data.get('event_date', None) or None
                cur.execute("""INSERT INTO events (client_id, event_name, event_date, location, guests, status, planner, event_type)
                    VALUES (%s,%s,%s,%s,%s,'Quote Submitted','TBD',%s)""",
                    (client_id, ev_name, ev_date, data.get('location',''), data.get('guests',''), data.get('event_type','')))
            else:
                user_id = existing[0]
                cur.execute("SELECT client_id FROM client WHERE user_id = %s", (user_id,))
                row = cur.fetchone()
                if row:
                    client_id = row[0]
                    ev_name = fname + "'s " + data.get('event_type', 'Event')
                    ev_date = data.get('event_date', None) or None
                    cur.execute("""INSERT INTO events (client_id, event_name, event_date, location, guests, status, planner, event_type)
                        VALUES (%s,%s,%s,%s,%s,'Quote Submitted','TBD',%s)""",
                        (client_id, ev_name, ev_date, data.get('location',''), data.get('guests',''), data.get('event_type','')))

        db.commit()
        cur.close()
        db.close()
        return jsonify({'success': True, 'message': 'Quote submitted and account created'})
    except Exception as e:
        print('quote error:', e)
        return jsonify({'success': False, 'message': 'Server error'}), 500


@app.route('/reset-password/verify-email', methods=['POST'])
def reset_verify_email():
    data = request.get_json()
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'success': False, 'message': 'Email required'}), 400
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT user_id FROM users WHERE username = %s", (email,))
        user = cur.fetchone()
        if not user:
            cur.close(); db.close()
            return jsonify({'success': False, 'message': 'No account found with that email.'}), 404

        uid = user[0]
        cur.execute("SELECT question FROM security_questions WHERE user_id = %s", (uid,))
        sq = cur.fetchone()
        cur.close(); db.close()

        if not sq:
            return jsonify({'success': False, 'message': 'No security question set for this account. Contact support.'}), 400
        return jsonify({'success': True, 'question': sq[0]})
    except Exception as e:
        print('reset error:', e)
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/reset-password/verify-answer', methods=['POST'])
def reset_verify_answer():
    data = request.get_json()
    email = data.get('email', '').strip()
    answer = data.get('answer', '').strip().lower()
    if not email or not answer:
        return jsonify({'success': False, 'message': 'Email and answer required'}), 400
    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT user_id FROM users WHERE username = %s", (email,))
        user = cur.fetchone()
        if not user:
            cur.close(); db.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404

        uid = user[0]
        cur.execute("SELECT answer FROM security_questions WHERE user_id = %s", (uid,))
        sq = cur.fetchone()
        cur.close(); db.close()

        if not sq or sq[0] != answer:
            return jsonify({'success': False, 'message': 'Incorrect answer. Please try again.'}), 401

        reset_tok = jwt.encode({
            'user_id': uid, 'purpose': 'reset',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }, SECRET_KEY)
        return jsonify({'success': True, 'reset_token': reset_tok})
    except Exception as e:
        print('reset error:', e)
        return jsonify({'success': False, 'message': 'Server error'}), 500

@app.route('/reset-password/update', methods=['POST'])
def reset_update_password():
    data = request.get_json()
    email = data.get('email', '').strip()
    reset_tok = data.get('reset_token', '')
    new_pw = data.get('new_password', '')

    if not email or not reset_tok or not new_pw:
        return jsonify({'success': False, 'message': 'All fields required'}), 400

    try:
        decoded = jwt.decode(reset_tok, SECRET_KEY, algorithms=['HS256'])
        if decoded.get('purpose') != 'reset':
            return jsonify({'success': False, 'message': 'Invalid reset token'}), 401
    except:
        return jsonify({'success': False, 'message': 'Reset link expired. Please start over.'}), 401

    try:
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE users SET password = %s WHERE username = %s", (hash_password(new_pw), email))
        db.commit()
        cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Password updated'})
    except Exception as e:
        print('reset error:', e)
        return jsonify({'success': False, 'message': 'Server error'}), 500


@app.route('/client/dashboard', methods=['GET'])
def client_dashboard():
    tok = verify_token()
    if not tok:
        return jsonify({'message': 'Not authorized'}), 401

    uid = tok['user_id']
    try:
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("SELECT client_id, firstname, lastname, email FROM client WHERE user_id = %s", (uid,))
        client = cur.fetchone()
        if not client:
            cur.close(); db.close()
            return jsonify({'message': 'Client profile not found'}), 404

        cid = client['client_id']

        cur.execute("SELECT * FROM events WHERE client_id = %s ORDER BY created_at DESC LIMIT 1", (cid,))
        event = cur.fetchone()
