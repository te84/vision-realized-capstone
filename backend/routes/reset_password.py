from flask import request, jsonify
from db import get_db, hash_password
import psycopg2.extras
import uuid

reset_tokens = {}


def register_reset_routes(app):

    @app.route('/reset-password/verify-email', methods=['POST'])
    def verify_email():
        data = request.get_json()
        email = data.get('email', '').strip()
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT user_id FROM users WHERE username = %s", (email,))
            user = cur.fetchone()
            if not user:
                cur.close(); db.close()
                return jsonify({'success': False, 'message': 'No account found with that email'})

            cur.execute("SELECT question FROM security_questions WHERE user_id = %s", (user['user_id'],))
            sq = cur.fetchone()
            cur.close(); db.close()

            if not sq:
                return jsonify({'success': False, 'message': 'No security question set for this account'})

            return jsonify({'success': True, 'question': sq['question']})
        except Exception as e:
            print('verify-email error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/reset-password/verify-answer', methods=['POST'])
    def verify_answer():
        data = request.get_json()
        email = data.get('email', '').strip()
        answer = data.get('answer', '').strip().lower()
        if not email or not answer:
            return jsonify({'success': False, 'message': 'Email and answer are required'}), 400

        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT u.user_id, sq.answer FROM users u JOIN security_questions sq ON u.user_id = sq.user_id WHERE u.username = %s", (email,))
            row = cur.fetchone()
            cur.close(); db.close()

            if not row:
                return jsonify({'success': False, 'message': 'Account not found'})

            if answer != row['answer'].strip().lower():
                return jsonify({'success': False, 'message': 'Incorrect answer'})

            token = str(uuid.uuid4())
            reset_tokens[token] = {'user_id': row['user_id'], 'email': email}

            return jsonify({'success': True, 'reset_token': token})
        except Exception as e:
            print('verify-answer error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/reset-password/update', methods=['POST'])
    def update_password():
        data = request.get_json()
        email = data.get('email', '').strip()
        token = data.get('reset_token', '')
        new_pw = data.get('new_password', '')

        if not email or not token or not new_pw:
            return jsonify({'success': False, 'message': 'All fields are required'}), 400

        token_data = reset_tokens.get(token)
        if not token_data or token_data['email'] != email:
            return jsonify({'success': False, 'message': 'Invalid or expired reset token'}), 400

        try:
            db = get_db()
            cur = db.cursor()
            hashed = hash_password(new_pw)
            cur.execute("UPDATE users SET password = %s WHERE user_id = %s", (hashed, token_data['user_id']))
            db.commit()
            cur.close(); db.close()

            del reset_tokens[token]

            return jsonify({'success': True, 'message': 'Password updated successfully'})
        except Exception as e:
            print('update-password error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500
