from db import get_db, hash_password

def seed():
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT user_id FROM users WHERE username = %s", ('admin',))
    admin = cur.fetchone()
    if admin:
        new_hash = hash_password('password123')
        cur.execute("UPDATE users SET password = %s WHERE user_id = %s", (new_hash, admin[0]))
        print('Updated admin password to bcrypt')

    cur.execute("SELECT user_id FROM users WHERE username = %s", ('demo@visionrealized.com',))
    if cur.fetchone():
        print('Demo user already exists, skipping.')
        db.commit()
        cur.close(); db.close()
        return

    hashed = hash_password('demo123')
    cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'Client') RETURNING user_id",
        ('demo@visionrealized.com', hashed))
    user_id = cur.fetchone()[0]

    cur.execute("""INSERT INTO client (user_id, firstname, lastname, email, phone_number)
        VALUES (%s, 'Maria', 'Santos', 'demo@visionrealized.com', '(862) 555-0147') RETURNING client_id""",
        (user_id,))
    client_id = cur.fetchone()[0]

    cur.execute("INSERT INTO security_questions (user_id, question, answer) VALUES (%s, %s, %s)",
        (user_id, 'What city were you born in?', 'newark'))

    cur.execute("""INSERT INTO events (client_id, event_name, event_date, location, guests, status, planner, event_type)
        VALUES (%s, %s, '2026-06-14', 'Newark, NJ', '120', 'Planning', 'Dawn Way', 'Fundraising Gala')
        RETURNING id""", (client_id, "Maria's Fundraising Gala"))
    event_id = cur.fetchone()[0]

    cur.execute("""INSERT INTO quotes (first_name, last_name, email, phone, source, event_type, event_date, guests, location, budget)
        VALUES ('Maria', 'Santos', 'demo@visionrealized.com', '(862) 555-0147', 'Instagram',
                'Fundraising Gala', '2026-06-14', '120', 'Newark, NJ', '$7.5K - $15K')""")

    tasks = [
        ("Confirm venue reservation", "2026-04-18", True),
        ("Submit guest list to planner", "2026-04-25", True),
        ("Approve catering menu selections", "2026-05-02", False),
        ("Review decoration mockups", "2026-05-09", False),
        ("Finalize seating chart", "2026-05-23", False),
        ("Confirm day-of timeline", "2026-06-06", False),
    ]
    for title, due, completed in tasks:
        cur.execute("INSERT INTO tasks (event_id, title, due_date, completed) VALUES (%s, %s, %s, %s)",
            (event_id, title, due, completed))

    messages = [
        ("Dawn Way", "Hi Maria! I'm Dawn, your event planner. Excited to work on your fundraising gala. Let's schedule a call this week to go over your vision!", True),
        ("Dawn Way", "Great news - the venue confirmed your date for June 14th. I'll send over the contract for review.", True),
        ("Maria Santos", "That's wonderful! I'll review it tonight. Also, do we have options for the catering yet?", True),
        ("Dawn Way", "Yes! I've narrowed it down to three caterers. I'll upload the proposals to your documents tab by end of day.", False),
    ]
    for sender, text, read in messages:
        cur.execute("INSERT INTO client_messages (event_id, sender, text, read) VALUES (%s, %s, %s, %s)",
            (event_id, sender, text, read))

    docs = [
        ("Venue Contract - Newark Grand Hall", "PDF", "Pending Signature"),
        ("Catering Proposal - Savory Bites", "PDF", "Uploaded"),
        ("Event Timeline Draft v1", "PDF", "Uploaded"),
        ("Guest List Template", "XLSX", "Uploaded"),
    ]
    for name, ftype, status in docs:
        cur.execute("INSERT INTO documents (event_id, name, file_type, status) VALUES (%s, %s, %s, %s)",
            (event_id, name, ftype, status))

    cur.execute("SELECT COUNT(*) FROM gallery_items")
    gallery_count = cur.fetchone()[0]
    if gallery_count == 0:
        gallery = [
            ("Casino Royale Night", "Gala", "A glamorous casino-themed fundraising gala with full decor, live entertainment, and custom table settings.", "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600"),
            ("Annual Corporate Summit", "Corporate", "A professional networking event featuring keynote speakers, breakout sessions, and an awards ceremony.", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600"),
            ("Roaring Twenties Birthday", "Party", "A themed milestone birthday celebration with vintage decor, live jazz, and specialty cocktails.", "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600"),
            ("Community Heritage Crawl", "Social", "A walking tour event celebrating Black history in Newark with local vendors, music, and storytelling.", "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600"),
            ("Team Building Retreat", "Corporate", "An outdoor team-building day featuring group activities, catering, and custom team t-shirts.", "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600"),
            ("Sweet Sixteen Celebration", "Party", "A magical sweet sixteen with custom decor, photo booth, DJ, and a themed dessert table.", "https://images.unsplash.com/photo-1464349153459-f0199f4a3168?w=600"),
        ]
        for title, category, desc, url in gallery:
            cur.execute("INSERT INTO gallery_items (title, category, description, image_url) VALUES (%s, %s, %s, %s)",
                (title, category, desc, url))

    db.commit()
    cur.close()
    db.close()
    print('Demo data seeded!')
    print('Client login: demo@visionrealized.com / demo123')
    print('Admin login: admin / password123')


if __name__ == '__main__':
    seed()
