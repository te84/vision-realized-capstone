import os
import mysql.connector
from dotenv import load_dotenv
from models.user import User

load_dotenv()


def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host     = os.getenv('DB_HOST', 'localhost'),
            user     = os.getenv('DB_USER', 'root'),
            password = os.getenv('DB_PASSWORD', ''),
            database = os.getenv('DB_NAME', 'vision_realized')
        )
        return conn
    except mysql.connector.Error as e:
        print(f'[DB] Connection error: {e}')
        return None


def get_user_by_username(username):
    conn = get_db_connection()
    if not conn:
        return None, 'Database connection failed'

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            'SELECT user_id, username, password, role FROM Users WHERE username = %s',
            (username,)
        )
        row = cursor.fetchone()
        return User.from_db_row(row), None
    except Exception as e:
        return None, str(e)
    finally:
        cursor.close()
        conn.close()


def get_profile(user_id, role):
    conn = get_db_connection()
    if not conn:
        return {}, 'Database connection failed'

    try:
        cursor = conn.cursor(dictionary=True)
        if role == 'Client':
            cursor.execute(
                'SELECT client_id, firstname, lastname, email FROM Client WHERE user_id = %s',
                (user_id,)
            )
        else:
            cursor.execute(
                'SELECT owner_id, firstname, lastname, email FROM Owner WHERE user_id = %s',
                (user_id,)
            )
        profile = cursor.fetchone() or {}
        return profile, None
    except Exception as e:
        return {}, str(e)
    finally:
        cursor.close()
        conn.close()


def validate_password(plain_password, stored_password):
    return plain_password == stored_password