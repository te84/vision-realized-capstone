import psycopg2
import hashlib
import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://vision_realized_user:UuFB5OCPR9MvGnixWrBYlLCiVkYAW3Yx@dpg-d72kntkg9agc739ajt4g-a.oregon-postgres.render.com/vision_realized')

def get_db():
    return psycopg2.connect(DATABASE_URL)

def hash_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def check_password(pw, hashed):
    return hash_password(pw) == hashed

def create_tables():
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
        cur.execute("""CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY, name VARCHAR(200), email VARCHAR(200),
            message TEXT, sender VARCHAR(100) DEFAULT 'Client',
            read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW())""")
        cur.execute("ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS sender VARCHAR(100) DEFAULT 'Client'")
        cur.execute("ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE")
        cur.execute("ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()")
        cur.execute("""CREATE TABLE IF NOT EXISTS invoices (
            invoice_id SERIAL PRIMARY KEY,
            client_id INT NOT NULL,
            event_id INT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            amount NUMERIC(10,2),
            due_date DATE,
            created_at TIMESTAMP DEFAULT NOW())""")
        cur.execute("""CREATE TABLE IF NOT EXISTS security_questions (
            id SERIAL PRIMARY KEY, user_id INT NOT NULL UNIQUE, question VARCHAR(300),
            answer VARCHAR(300), created_at TIMESTAMP DEFAULT NOW())""")
        cur.execute("""CREATE TABLE IF NOT EXISTS event_ratings (
            id SERIAL PRIMARY KEY,
            event_id INT NOT NULL UNIQUE,
            client_id INT NOT NULL,
            stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT NOW())""")
        db.commit()
        cur.close()
        db.close()
        print('tables ok')
    except Exception as e:
        print('table error:', e)