from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras


def register_owner_invoice_routes(app):

    @app.route('/owner/invoices/<int:event_id>', methods=['GET'])
    def get_event_invoices(event_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT invoice_id, client_id, event_id, status, amount, due_date, created_at
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

    @app.route('/owner/invoices', methods=['POST'])
    def create_invoice():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        event_id  = data.get('event_id')
        client_id = data.get('client_id')
        status    = data.get('status', 'Pending')
        amount    = data.get('amount') or None
        due_date  = data.get('due_date') or None
        if not event_id or not client_id:
            return jsonify({'success': False, 'message': 'event_id and client_id are required'}), 400
        db = get_db()
        cur = db.cursor()
        cur.execute(
            """INSERT INTO invoices (client_id, event_id, status, amount, due_date)
               VALUES (%s, %s, %s, %s, %s) RETURNING invoice_id""",
            (client_id, event_id, status, amount, due_date)
        )
        invoice_id = cur.fetchone()[0]
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True, 'invoice_id': invoice_id})

    @app.route('/owner/invoices/<int:invoice_id>/status', methods=['PUT'])
    def update_invoice_status(invoice_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        data = request.get_json()
        status   = data.get('status')
        amount   = data.get('amount')
        due_date = data.get('due_date') or None
        if not status:
            return jsonify({'success': False, 'message': 'status is required'}), 400
        db = get_db()
        cur = db.cursor()
        cur.execute(
            """UPDATE invoices SET status = %s,
               amount   = COALESCE(%s, amount),
               due_date = COALESCE(%s::date, due_date)
               WHERE invoice_id = %s""",
            (status, amount, due_date, invoice_id)
        )
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})

    @app.route('/owner/invoices/<int:invoice_id>', methods=['DELETE'])
    def delete_invoice(invoice_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401
        db = get_db()
        cur = db.cursor()
        cur.execute("DELETE FROM invoices WHERE invoice_id = %s", (invoice_id,))
        db.commit(); cur.close(); db.close()
        return jsonify({'success': True})