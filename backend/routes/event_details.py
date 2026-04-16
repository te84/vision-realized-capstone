from flask import jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras

def register_owner_event_detail_routes(app):
    @app.route('/owner/event-detail/<int:event_id>', methods=['GET'])
    def event_detail(event_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM tasks WHERE event_id = %s ORDER BY created_at", (event_id,))
        tasks = [dict(t) for t in cur.fetchall()]
        for t in tasks:
            if t.get('due_date'): t['due_date'] = str(t['due_date'])
            if t.get('created_at'): t['created_at'] = str(t['created_at'])
        cur.execute("SELECT * FROM client_messages WHERE event_id = %s ORDER BY created_at DESC", (event_id,))
        msgs = [dict(m) for m in cur.fetchall()]
        for m in msgs:
            if m.get('created_at'): m['created_at'] = str(m['created_at'])
        cur.execute("SELECT * FROM documents WHERE event_id = %s ORDER BY created_at DESC", (event_id,))
        docs = [dict(d) for d in cur.fetchall()]
        for d in docs:
            if d.get('created_at'): d['created_at'] = str(d['created_at'])
        cur.close(); db.close()
        return jsonify({'success': True, 'tasks': tasks, 'messages': msgs, 'documents': docs})