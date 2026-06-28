import threading
from extensions import mail

def send_async(app, msg):
    """Envoie un email dans un thread séparé pour ne pas bloquer la réponse HTTP."""
    def _send():
        with app.app_context():
            try:
                mail.send(msg)
            except BaseException as e:
                print(f"[MAIL ERROR async] {e}")
    t = threading.Thread(target=_send)
    t.daemon = True
    t.start()
