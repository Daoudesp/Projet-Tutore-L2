import threading
import requests
import os


def send_async(app, msg):
    """Envoie un email via l'API HTTP Brevo dans un thread séparé."""
    api_key = os.getenv('BREVO_API_KEY')
    sender_email = os.getenv('MAIL_SENDER', os.getenv('MAIL_USERNAME', 'noreply@homelink.sn'))

    if not api_key:
        print("[MAIL] BREVO_API_KEY non configurée, email non envoyé.")
        return

    # Extraire les données du message Flask-Mail
    recipients = [{'email': r} for r in msg.recipients]
    subject = msg.subject
    html = msg.html or msg.body or ''

    def _send():
        try:
            response = requests.post(
                'https://api.brevo.com/v3/smtp/email',
                headers={
                    'api-key': api_key,
                    'Content-Type': 'application/json',
                },
                json={
                    'sender': {'name': 'HomeLink', 'email': sender_email},
                    'to': recipients,
                    'subject': subject,
                    'htmlContent': html,
                },
                timeout=10
            )
            if response.status_code not in (200, 201):
                print(f"[MAIL ERROR] Brevo API: {response.status_code} — {response.text}")
            else:
                print(f"[MAIL OK] Email envoyé à {[r['email'] for r in recipients]}")
        except Exception as e:
            print(f"[MAIL ERROR] {e}")

    t = threading.Thread(target=_send)
    t.daemon = True
    t.start()
