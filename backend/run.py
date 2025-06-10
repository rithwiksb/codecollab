from app import create_app, socketio
from app.db import init_app, init_db

app = create_app()
init_app(app)

if __name__ == '__main__':
    with app.app_context():
        init_db()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)