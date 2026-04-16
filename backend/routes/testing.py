from flask import jsonify
from db import get_db


def register_testing_routes(app):

    @app.route('/test-db', methods=['GET'])
    def test_db():
        try:
            db = get_db()
            cur = db.cursor()
            cur.execute('SELECT COUNT(*) FROM users')
            cnt = cur.fetchone()[0]
            cur.close()
            db.close()
            return jsonify({'message': f'Connected. {cnt} users.'})
        except Exception as e:
            return jsonify({'message': f'DB error: {e}'}), 500