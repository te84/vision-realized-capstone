from flask import jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras


def register_owner_bulk_routes(app):

    @app.route('/owner/bulk', methods=['GET'])
    def owner_bulk():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401

        db  = get_db()
        cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT e.id, e.event_name, e.event_type, e.event_date,
                   e.location, e.guests, e.planner, e.status, e.created_at,
                   c.client_id, c.firstname, c.lastname,
                   c.email, c.phone_number
            FROM   events e
            JOIN   client c ON e.client_id = c.client_id
            ORDER  BY e.created_at DESC
        """)
        events_rows = cur.fetchall()
        event_ids = [r['id'] for r in events_rows]

        if not event_ids:
            cur.close(); db.close()
            return jsonify({'success': True, 'events': [], 'details': {}})

        cur.execute("""
            SELECT id, event_id, title, due_date, completed, created_at
            FROM   tasks
            WHERE  event_id = ANY(%s)
            ORDER  BY created_at
        """, (event_ids,))
        tasks_by_event = {}
        for t in cur.fetchall():
            eid = t['event_id']
            tasks_by_event.setdefault(eid, []).append({
                'id':         t['id'],
                'title':      t['title'],
                'due_date':   str(t['due_date'])   if t['due_date']   else None,
                'completed':  t['completed'],
                'created_at': str(t['created_at']) if t['created_at'] else None,
            })

        cur.execute("""
            SELECT id, event_id, sender, text, created_at
            FROM   client_messages
            WHERE  event_id = ANY(%s)
            ORDER  BY created_at ASC
        """, (event_ids,))
        messages_by_event = {}
        for m in cur.fetchall():
            eid = m['event_id']
            messages_by_event.setdefault(eid, []).append({
                'id':         m['id'],
                'sender':     m['sender'],
                'text':       m['text'],
                'created_at': str(m['created_at']) if m['created_at'] else None,
            })

        cur.execute("""
            SELECT id, event_id, name, file_type, status, created_at
            FROM   documents
            WHERE  event_id = ANY(%s)
            ORDER  BY created_at DESC
        """, (event_ids,))
        docs_by_event = {}
        for d in cur.fetchall():
            eid = d['event_id']
            docs_by_event.setdefault(eid, []).append({
                'id':         d['id'],
                'name':       d['name'],
                'file_type':  d['file_type'],
                'status':     d['status'],
                'created_at': str(d['created_at']) if d['created_at'] else None,
            })

        cur.execute("""
            SELECT DISTINCT ON (e.id)
                   e.id AS event_id,
                   q.id, q.event_type, q.service_type, q.event_date,
                   q.guests, q.budget, q.budget_notes, q.location,
                   q.venue_status, q.source, q.vision, q.vibes,
                   q.final_notes, q.created_at
            FROM   quotes q
            JOIN   client c  ON LOWER(q.email) = LOWER(c.email)
            JOIN   events e  ON e.client_id = c.client_id
            WHERE  e.id = ANY(%s)
              AND  LOWER(q.event_type) = LOWER(e.event_type)
              AND  q.event_date::text  = e.event_date::text
            ORDER  BY e.id, q.created_at DESC
        """, (event_ids,))
        quotes_by_event = {}
        for q in cur.fetchall():
            eid = q['event_id']
            qd  = dict(q)
            if qd.get('event_date'):  qd['event_date']  = str(qd['event_date'])
            if qd.get('created_at'): qd['created_at'] = str(qd['created_at'])
            quotes_by_event[eid] = qd

        cur.execute("""
            SELECT event_id, stars, comment, created_at
            FROM   event_ratings
            WHERE  event_id = ANY(%s)
        """, (event_ids,))
        ratings_by_event = {}
        for r in cur.fetchall():
            ratings_by_event[r['event_id']] = {
                'stars':      r['stars'],
                'comment':    r['comment'],
                'created_at': str(r['created_at']) if r['created_at'] else None,
            }

        cur.execute("""
            SELECT invoice_id, event_id, client_id, status, amount, due_date
            FROM   invoices
            WHERE  event_id = ANY(%s)
            ORDER  BY invoice_id DESC
        """, (event_ids,))
        invoices_by_event = {}
        for i in cur.fetchall():
            eid = i['event_id']
            invoices_by_event.setdefault(eid, []).append({
                'invoice_id': i['invoice_id'],
                'client_id':  i['client_id'],
                'status':     i['status'],
                'amount':     float(i['amount']) if i['amount'] is not None else None,
                'due_date':   str(i['due_date']) if i['due_date'] else None,
            })

        cur.close(); db.close()

        events = []
        details = {}

        for row in events_rows:
            eid = row['id']
            ev = {
                'id':           eid,
                'event_name':   row['event_name'],
                'event_type':   row['event_type'],
                'event_date':   str(row['event_date'])   if row['event_date']   else None,
                'location':     row['location'],
                'guests':       row['guests'],
                'planner':      row['planner'],
                'status':       row['status'],
                'created_at':   str(row['created_at'])   if row['created_at']   else None,
                'client_id':    row['client_id'],
                'firstname':    row['firstname'],
                'lastname':     row['lastname'],
                'email':        row['email'],
                'phone_number': row['phone_number'],
            }
            events.append(ev)
            details[eid] = {
                'tasks':     tasks_by_event.get(eid,     []),
                'messages':  messages_by_event.get(eid,  []),
                'documents': docs_by_event.get(eid,      []),
                'quote':     quotes_by_event.get(eid,    None),
                'rating':    ratings_by_event.get(eid,   None),
                'invoices':  invoices_by_event.get(eid,  []),
            }

        return jsonify({'success': True, 'events': events, 'details': details})
