from flask import Flask, send_from_directory
from flask_cors import CORS
import os
from db import create_tables
from routes.auth import register_auth_routes
from routes.quotes import register_quote_routes
from routes.dashboard import register_dashboard_routes
from routes.contact import register_contact_routes
from routes.client_actions import register_client_action_routes
from routes.reset_password import register_reset_routes
from routes.gallery import register_gallery_routes
from routes.events import register_owner_events_routes
from routes.event_details import register_owner_event_detail_routes
from routes.owner_tasks import register_owner_task_routes
from routes.owner_communications import register_owner_communication_routes
from routes.inbox import register_inbox_routes
from routes.owner_invoices import register_owner_invoice_routes
from routes.translations import register_translation_routes

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# Team A routes
register_auth_routes(app)
register_quote_routes(app)
register_dashboard_routes(app)
register_contact_routes(app)
register_client_action_routes(app)
register_reset_routes(app)
register_gallery_routes(app)

# Team B owner routes
register_owner_events_routes(app)
register_owner_event_detail_routes(app)
register_owner_task_routes(app)
register_owner_communication_routes(app)
register_inbox_routes(app)
register_owner_invoice_routes(app)
register_translation_routes(app)

create_tables()

if __name__ == '__main__':
    print('Server running at http://localhost:5001')
    app.run(debug=True, port=5001)
