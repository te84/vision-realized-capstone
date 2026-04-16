from flask import request, jsonify
from db import get_db, hash_password, SECRET_KEY
import jwt
import datetime


def register_reset_password_routes(app):

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