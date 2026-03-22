from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from services.auth_service import get_user_by_username, get_profile, validate_password

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400

    username = data['username'].strip()
    password = data['password']

    user, err = get_user_by_username(username)
    if err:
        return jsonify({'error': err}), 500
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    if not validate_password(password, user.password):
        return jsonify({'error': 'Invalid username or password'}), 401

    profile, _ = get_profile(user.user_id, user.role)

    redirect_url = '/dashboard/owner' if user.role == 'Owner' else '/dashboard/client'

    identity = {
        'user_id':  user.user_id,
        'username': user.username,
        'role':     user.role,
    }
    access_token = create_access_token(identity=identity)

    return jsonify({
        'message':      'Login successful',
        'access_token': access_token,
        'redirect_url': redirect_url,
        'user': {
            'user_id':   user.user_id,
            'username':  user.username,
            'role':      user.role,
            'firstname': profile.get('firstname'),
            'lastname':  profile.get('lastname'),
            'email':     profile.get('email'),
        }
    }), 200