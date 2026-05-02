from flask import request, jsonify
from db import get_db
from routes.auth import verify_token


def register_client_action_routes(app):

    @app.route('/client/tasks/<int:task_id>/complete', methods=['PUT'])
    def client_complete_task(task_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE tasks SET completed = TRUE WHERE id = %s", (task_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/client/messages', methods=['POST'])
    def client_send_message():
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        uid = tok['user_id']
        db = get_db()
        cur = db.cursor()
        cur.execute("SELECT firstname, lastname FROM client WHERE user_id = %s", (uid,))
        row = cur.fetchone()
        sender = row[0] + ' ' + row[1] if row else 'Client'
        cur.execute("INSERT INTO client_messages (event_id, sender, text) VALUES (%s,%s,%s)",
            (data['event_id'], sender, data['text']))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/client/messages/<int:event_id>/read', methods=['PUT'])
    def mark_messages_read(event_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("UPDATE client_messages SET read = TRUE WHERE event_id = %s AND sender = 'Vision Realized'", (event_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/client/ratings', methods=['POST'])
    def client_submit_rating():
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401

        data = request.get_json()
        event_id = data.get('event_id')
        stars = data.get('stars')
        comment = data.get('comment', '').strip()

        if not event_id or not stars:
            return jsonify({'message': 'event_id and stars are required'}), 400
        if not isinstance(stars, int) or stars < 1 or stars > 5:
            return jsonify({'message': 'stars must be an integer between 1 and 5'}), 400

        uid = tok['user_id']
        db = get_db()
        cur = db.cursor()

        # Verify this event belongs to the requesting client
        cur.execute("""
            SELECT e.id FROM events e
            JOIN client c ON e.client_id = c.client_id
            WHERE e.id = %s AND c.user_id = %s
        """, (event_id, uid))
        if not cur.fetchone():
            cur.close(); db.close()
            return jsonify({'message': 'Event not found or not authorized'}), 403

        cur.execute("SELECT client_id FROM client WHERE user_id = %s", (uid,))
        client_row = cur.fetchone()
        client_id = client_row[0] if client_row else None

        # Upsert: one rating per event, replace if client re-submits
        cur.execute("""
            INSERT INTO event_ratings (event_id, client_id, stars, comment)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (event_id) DO UPDATE
                SET stars = EXCLUDED.stars,
                    comment = EXCLUDED.comment,
                    created_at = NOW()
        """, (event_id, client_id, stars, comment))

        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/client/invoices/<int:event_id>', methods=['GET'])
    def client_get_invoices(event_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401

        uid = tok['user_id']
        db = get_db()
        cur = db.cursor()

        # Verify this event belongs to the requesting client
        cur.execute("""
            SELECT e.id FROM events e
            JOIN client c ON e.client_id = c.client_id
            WHERE e.id = %s AND c.user_id = %s
        """, (event_id, uid))
        if not cur.fetchone():
            cur.close(); db.close()
            return jsonify({'message': 'Event not found or not authorized'}), 403

        import psycopg2.extras
        cur.close()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT invoice_id, status, amount, due_date, created_at
            FROM invoices
            WHERE event_id = %s
            ORDER BY invoice_id DESC
        """, (event_id,))
        invoices = [dict(row) for row in cur.fetchall()]
        for inv in invoices:
            if inv.get('due_date'):   inv['due_date']   = str(inv['due_date'])
            if inv.get('created_at'): inv['created_at'] = str(inv['created_at'])
            if inv.get('amount') is not None: inv['amount'] = float(inv['amount'])
        cur.close(); db.close()
        return jsonify({'success': True, 'invoices': invoices})

    @app.route('/client/ratings/<int:event_id>', methods=['GET'])
    def client_get_rating(event_id):
        tok = verify_token()
        if not tok:
            return jsonify({'message': 'Not authorized'}), 401

        uid = tok['user_id']
        db = get_db()
        cur = db.cursor()

        # Verify ownership
        cur.execute("""
            SELECT e.id FROM events e
            JOIN client c ON e.client_id = c.client_id
            WHERE e.id = %s AND c.user_id = %s
        """, (event_id, uid))
        if not cur.fetchone():
            cur.close(); db.close()
            return jsonify({'message': 'Event not found or not authorized'}), 403

        cur.execute("SELECT stars, comment, created_at FROM event_ratings WHERE event_id = %s", (event_id,))
        row = cur.fetchone()
        cur.close(); db.close()

        if row:
            return jsonify({'success': True, 'rating': {'stars': row[0], 'comment': row[1], 'created_at': str(row[2])}})
        return jsonify({'success': True, 'rating': None})