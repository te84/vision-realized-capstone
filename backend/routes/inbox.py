from flask import jsonify
from db import get_db
import psycopg2.extras

def register_inbox_routes(app):
    @app.route('/quotes', methods=['GET'])
    def get_quotes():
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM quotes ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); db.close()
        return jsonify({'success': True, 'quotes': [dict(r) for r in rows]})

    @app.route('/messages', methods=['GET'])
    def get_messages():
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM contact_messages ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); db.close()
        return jsonify({'success': True, 'messages': [dict(r) for r in rows]})