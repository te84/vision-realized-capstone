from flask import request, jsonify
from db import get_db
from routes.auth import verify_token
import psycopg2.extras


def register_gallery_routes(app):

    @app.route('/gallery', methods=['GET'])
    def get_gallery():
        try:
            db = get_db()
            cur = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute("SELECT id, title, category, description, image_url, created_at FROM gallery_items ORDER BY created_at DESC")
            items = cur.fetchall()
            cur.close(); db.close()

            result = []
            for item in items:
                result.append({
                    'id': item['id'],
                    'title': item['title'],
                    'category': item['category'],
                    'description': item['description'],
                    'image_url': item['image_url'],
                    'is_carousel': item.get('is_carousel', False),
                    'created_at': str(item['created_at'])
                })
            return jsonify({'success': True, 'items': result})
        except Exception as e:
            print('gallery error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/owner/gallery', methods=['POST'])
    def add_gallery_item():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401

        data = request.get_json()
        title = data.get('title', '').strip()
        category = data.get('category', '').strip()
        description = data.get('description', '').strip()
        image_url = data.get('image_url', '').strip()

        if not title or not image_url:
            return jsonify({'success': False, 'message': 'Title and image URL are required'}), 400

        try:
            db = get_db()
            cur = db.cursor()
            cur.execute("INSERT INTO gallery_items (title, category, description, image_url) VALUES (%s, %s, %s, %s) RETURNING id",
                (title, category, description, image_url))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return jsonify({'success': True, 'id': new_id})
        except Exception as e:
            print('gallery add error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/owner/gallery/carousel', methods=['POST'])
    def add_carousel_items():
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401

        data = request.get_json()
        images = data.get('images', [])
        if not images:
            return jsonify({'success': False, 'message': 'No images provided'}), 400

        try:
            db = get_db()
            cur = db.cursor()
            count = 0
            for img in images:
                if not img.get('image_url'):
                    continue
                cur.execute(
                    "INSERT INTO gallery_items (title, category, image_url, is_carousel) VALUES (%s, %s, %s, TRUE)",
                    (img.get('title', ''), img.get('category', ''), img['image_url']))
                count += 1
            db.commit()
            cur.close(); db.close()
            return jsonify({'success': True, 'count': count})
        except Exception as e:
            print('carousel add error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500

    @app.route('/owner/gallery/<int:item_id>', methods=['DELETE'])
    def delete_gallery_item(item_id):
        tok = verify_token()
        if not tok or tok.get('role') != 'Owner':
            return jsonify({'message': 'Not authorized'}), 401

        try:
            db = get_db()
            cur = db.cursor()
            cur.execute("DELETE FROM gallery_items WHERE id = %s", (item_id,))
            db.commit()
            cur.close(); db.close()
            return jsonify({'success': True})
        except Exception as e:
            print('gallery delete error:', e)
            return jsonify({'success': False, 'message': 'Server error'}), 500
