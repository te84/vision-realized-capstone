from flask import request, jsonify
from db import get_db, hash_password
from email_service import notify_owner_new_quote


def register_quote_routes(app):

    @app.route('/submit-quote', methods=['POST'])
    def submit_quote():
        data = request.get_json()
        fname = data.get('first_name', '')
        lname = data.get('last_name', '')
        email = data.get('email', '')
        phone = data.get('phone', '')
        pw = data.get('password', '')

        try:
            db = get_db()
            cur = db.cursor()

            cur.execute("""INSERT INTO quotes (first_name, last_name, email, phone, source, event_type,
                event_date, guests, location, venue_status, vision, budget, budget_notes, vibes, final_notes, service_type)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (fname, lname, email, phone, data.get('source',''), data.get('event_type',''),
                 data.get('event_date',''), data.get('guests',''), data.get('location',''),
                 data.get('venue_status',''), data.get('vision',''), data.get('budget',''),
                 data.get('budget_notes',''), data.get('vibes',''), data.get('final_notes',''),
                 data.get('service_type','')))

            user_id = None
            if email and pw:
                cur.execute("SELECT user_id FROM users WHERE username = %s", (email,))
                existing = cur.fetchone()

                if not existing:
                    hashed = hash_password(pw)
                    cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'Client') RETURNING user_id", (email, hashed))
                    user_id = cur.fetchone()[0]

                    cur.execute("INSERT INTO client (user_id, firstname, lastname, email, phone_number) VALUES (%s,%s,%s,%s,%s) RETURNING client_id",
                        (user_id, fname, lname, email, phone))
                    client_id = cur.fetchone()[0]

                    sq = data.get('security_question', '')
                    sa = data.get('security_answer', '')
                    if sq and sa:
                        cur.execute("INSERT INTO security_questions (user_id, question, answer) VALUES (%s,%s,%s)",
                            (user_id, sq, sa.lower().strip()))

                    ev_name = fname + "'s " + data.get('event_type', 'Event')
                    ev_date = data.get('event_date', None) or None
                    cur.execute("""INSERT INTO events (client_id, event_name, event_date, location, guests, status, planner, event_type)
                        VALUES (%s,%s,%s,%s,%s,'Quote Submitted','TBD',%s)""",
                        (client_id, ev_name, ev_date, data.get('location',''), data.get('guests',''), data.get('event_type','')))
                else:
                    user_id = existing[0]
                    cur.execute("SELECT client_id FROM client WHERE user_id = %s", (user_id,))
                    row = cur.fetchone()
                    if row:
                        client_id = row[0]
                        ev_name = fname + "'s " + data.get('event_type', 'Event')
                        ev_date = data.get('event_date', None) or None
                        cur.execute("""INSERT INTO events (client_id, event_name, event_date, location, guests, status, planner, event_type)
                            VALUES (%s,%s,%s,%s,%s,'Quote Submitted','TBD',%s)""",
                            (client_id, ev_name, ev_date, data.get('location',''), data.get('guests',''), data.get('event_type','')))

            db.commit()
            cur.close()
            db.close()
            notify_owner_new_quote(fname, lname, email, data.get('event_type',''), data.get('event_date',''))
            return jsonify({'success': True, 'message': 'Quote submitted and account created'})
        except Exception as e:
            print('quote error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/quote/photos', methods=['POST'])
    def upload_quote_photo():
        data = request.get_json()
        email = data.get('email', '').strip()
        filename = data.get('filename', '')
        image_data = data.get('image_data', '')

        if not email or not image_data:
            return jsonify({'success': False, 'message': 'Email and image are required'}), 400

        try:
            db = get_db()
            cur = db.cursor()
            cur.execute("INSERT INTO quote_photos (email, filename, image_data) VALUES (%s, %s, %s)",
                (email, filename, image_data))
            db.commit()
            cur.close(); db.close()
            return jsonify({'success': True})
        except Exception as e:
            print('photo upload error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500
