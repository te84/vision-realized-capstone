import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading


SMTP_EMAIL = os.environ.get('SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', '')


def _send(to, subject, body_html):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print('[email] SMTP not configured, skipping email to', to)
        return
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = to
        msg['Subject'] = subject
        msg.attach(MIMEText(body_html, 'html'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to, msg.as_string())
        server.quit()
        print('[email] sent to', to)
    except Exception as e:
        print('[email] error:', e)


def send_async(to, subject, body_html):
    t = threading.Thread(target=_send, args=(to, subject, body_html))
    t.daemon = True
    t.start()


def notify_client_new_message(client_email, client_name, message_text):
    subject = "New message from Vision Realized"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>Hi {client_name},</p>
        <p>You have a new message from your event planner:</p>
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;color:#2E1547;">{message_text}</p>
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/portal.html" style="color:#4A2772;">Client Portal</a> to reply.</p>
        <p style="color:#999;font-size:12px;">Vision Realized LLC &middot; (862) 215-0186</p>
    </div>
    """
    send_async(client_email, subject, body)


def notify_owner_new_message(client_name, client_email, message_text, event_name=''):
    if not OWNER_EMAIL:
        return
    subject = f"New message from {client_name}"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>New message from <strong>{client_name}</strong> ({client_email})</p>
        {f'<p style="color:#7a6e5e;">Event: {event_name}</p>' if event_name else ''}
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;color:#2E1547;">{message_text}</p>
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/owner.html" style="color:#4A2772;">Owner Dashboard</a> to reply.</p>
    </div>
    """
    send_async(OWNER_EMAIL, subject, body)


def notify_owner_new_quote(first_name, last_name, email, event_type, event_date=''):
    if not OWNER_EMAIL:
        return
    subject = f"New quote request from {first_name} {last_name}"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>A new quote request has been submitted:</p>
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p><strong>Name:</strong> {first_name} {last_name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Event:</strong> {event_type or 'Not specified'}</p>
            <p><strong>Date:</strong> {event_date or 'TBD'}</p>
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/owner.html" style="color:#4A2772;">Owner Dashboard</a> to review and respond.</p>
    </div>
    """
    send_async(OWNER_EMAIL, subject, body)


def notify_client_new_task(client_email, client_name, task_title, due_date=''):
    subject = "New task assigned — Vision Realized"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>Hi {client_name},</p>
        <p>A new task has been assigned to your event:</p>
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;font-weight:600;color:#2E1547;">{task_title}</p>
            {f'<p style="margin:4px 0 0;color:#7a6e5e;font-size:14px;">Due: {due_date}</p>' if due_date else ''}
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/portal.html" style="color:#4A2772;">Client Portal</a> to view your tasks.</p>
        <p style="color:#999;font-size:12px;">Vision Realized LLC &middot; (862) 215-0186</p>
    </div>
    """
    send_async(client_email, subject, body)


def notify_client_status_change(client_email, client_name, event_name, new_status):
    subject = f"Event update — {event_name}"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>Hi {client_name},</p>
        <p>Your event <strong>{event_name}</strong> has been updated:</p>
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p style="margin:0;font-size:16px;color:#2E1547;">New status: <strong>{new_status}</strong></p>
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/portal.html" style="color:#4A2772;">Client Portal</a> to see details.</p>
        <p style="color:#999;font-size:12px;">Vision Realized LLC &middot; (862) 215-0186</p>
    </div>
    """
    send_async(client_email, subject, body)


def notify_owner_new_contact(name, email, message_text):
    if not OWNER_EMAIL:
        return
    subject = f"New contact message from {name}"
    body = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
        <h2 style="color:#4A2772;">Vision Realized</h2>
        <p>New contact form submission:</p>
        <div style="background:#f3eef9;padding:16px;border-radius:4px;margin:16px 0;">
            <p><strong>Name:</strong> {name}</p>
            <p><strong>Email:</strong> {email}</p>
            <p style="margin-top:12px;">{message_text}</p>
        </div>
        <p>Log in to your <a href="http://localhost:5001/pages/owner.html" style="color:#4A2772;">Owner Dashboard</a> to reply.</p>
    </div>
    """
    send_async(OWNER_EMAIL, subject, body)
