import psycopg2
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get('SECRET_KEY')
DATABASE_URL = os.environ.get('DATABASE_URL')

if not SECRET_KEY or not DATABASE_URL:
    raise RuntimeError('Set SECRET_KEY and DATABASE_URL in your .env file')


def get_db():
    return psycopg2.connect(DATABASE_URL)


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password, hashed):
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False


def create_tables():
    try:
        db = get_db()
        cur = db.cursor()

        cur.execute("""CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('Client','Owner'))
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS owner (
            owner_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(user_id),
            firstname VARCHAR(50),
            lastname VARCHAR(50),
            email VARCHAR(100),
            phone_number VARCHAR(20)
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS client (
            client_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(user_id),
            firstname VARCHAR(50),
            lastname VARCHAR(50),
            email VARCHAR(100),
            phone_number VARCHAR(20),
            date_of_birth DATE
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS quotes (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(50),
            last_name VARCHAR(50),
            email VARCHAR(100),
            phone VARCHAR(20),
            source VARCHAR(100),
            event_type VARCHAR(100),
            event_date VARCHAR(50),
            guests VARCHAR(50),
            location VARCHAR(200),
            venue_status VARCHAR(100),
            vision TEXT,
            budget VARCHAR(50),
            budget_notes TEXT,
            vibes VARCHAR(300),
            final_notes TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS quote_photos (
            id SERIAL PRIMARY KEY,
            email VARCHAR(100) NOT NULL,
            filename VARCHAR(300),
            image_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100),
            message TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            client_id INT NOT NULL,
            event_name VARCHAR(200),
            event_date DATE,
            location VARCHAR(200),
            guests VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Quote Submitted',
            planner VARCHAR(100),
            event_type VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            event_id INT NOT NULL,
            title VARCHAR(300),
            due_date DATE,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS client_messages (
            id SERIAL PRIMARY KEY,
            event_id INT NOT NULL,
            sender VARCHAR(100),
            text TEXT,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            event_id INT NOT NULL,
            name VARCHAR(300),
            file_type VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Uploaded',
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS security_questions (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            question VARCHAR(300),
            answer VARCHAR(300),
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        cur.execute("""CREATE TABLE IF NOT EXISTS gallery_items (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            category VARCHAR(100),
            description TEXT,
            image_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )""")

        db.commit()
        cur.close()
        db.close()
        print('tables ok')
    except Exception as e:
        print('table error:', e)
