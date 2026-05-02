from flask import jsonify, request
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

        cur.execute("""
            SELECT q.*
            FROM quotes q
            JOIN client c ON LOWER(q.email) = LOWER(c.email)
            JOIN events e ON e.client_id = c.client_id
            WHERE e.id = %s
              AND LOWER(q.event_type) = LOWER(e.event_type)
              AND q.event_date::text = e.event_date::text
            ORDER BY q.created_at DESC
            LIMIT 1
        """, (event_id,))
        quote = cur.fetchone()
        quote_data = dict(quote) if quote else None
        if quote_data:
            if quote_data.get('event_date'): quote_data['event_date'] = str(quote_data['event_date'])
            if quote_data.get('created_at'): quote_data['created_at'] = str(quote_data['created_at'])

        cur.execute("SELECT stars, comment, created_at FROM event_ratings WHERE event_id = %s", (event_id,))
        rating_row = cur.fetchone()
        rating_data = None
        if rating_row:
            rating_data = {
                'stars': rating_row['stars'],
                'comment': rating_row['comment'],
                'created_at': str(rating_row['created_at'])
            }

        inspo_photos = []
        cur.execute("SELECT c.email FROM client c JOIN events e ON e.client_id = c.client_id WHERE e.id = %s", (event_id,))
        client_row = cur.fetchone()
        if client_row:
            cur.execute("SELECT filename, image_data FROM quote_photos WHERE LOWER(email) = LOWER(%s)", (client_row['email'],))
            inspo_photos = [{'filename': p['filename'], 'image_data': p['image_data']} for p in cur.fetchall()]

        cur.close(); db.close()
        return jsonify({'success': True, 'tasks': tasks, 'messages': msgs, 'documents': docs, 'quote': quote_data, 'rating': rating_data, 'inspo_photos': inspo_photos})

    @app.route('/owner/event-detail/<int:event_id>/quote', methods=['PUT'])
    def update_event_quote(event_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        db = get_db()
        cur = db.cursor()

        if 'guests' in data and data.get('guests') is not None:
            cur.execute('UPDATE events SET guests = %s WHERE id = %s', (data.get('guests'), event_id))

        cur.execute("""
            SELECT q.id
            FROM quotes q
            JOIN client c ON LOWER(q.email) = LOWER(c.email)
            JOIN events e ON e.client_id = c.client_id
            WHERE e.id = %s
              AND LOWER(q.event_type) = LOWER(e.event_type)
              AND q.event_date::text = e.event_date::text
            ORDER BY q.created_at DESC
            LIMIT 1
        """, (event_id,))
        quote = cur.fetchone()
        if quote:
            cur.execute("""UPDATE quotes
                SET budget = %s, source = %s, guests = %s, event_type = %s
                WHERE id = %s""",
                (data.get('budget'), data.get('source'), data.get('guests'), data.get('event_type'), quote[0]))

        db.commit()
        cur.close(); db.close()
        return jsonify({'success': True, 'message': 'Quote updated'})