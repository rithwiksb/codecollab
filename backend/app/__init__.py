from flask import Flask, jsonify, send_from_directory, request, make_response
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
socketio = SocketIO()
jwt = JWTManager()

def create_app(config=None):
    app = Flask(__name__)
    
    # Configure the app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-please-change')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-key-please-change')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 hour
    
    # JWT configuration
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Configure CORS with more permissive settings
    CORS(app)
    
    # Add explicit CORS headers to all responses
    @app.after_request
    def after_request(response):
        # Only add the header if it's not already there
        if 'Access-Control-Allow-Origin' not in response.headers:
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        if 'Access-Control-Allow-Headers' not in response.headers:
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        if 'Access-Control-Allow-Methods' not in response.headers:
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        if 'Access-Control-Allow-Credentials' not in response.headers:
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        
        # Handle OPTIONS request specially
        if request.method == 'OPTIONS':
            response.status_code = 200
        return response
    
    # Initialize extensions with app
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")  # More permissive for development
    
    # Register blueprints
    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from app.rooms.routes import rooms_bp
    app.register_blueprint(rooms_bp, url_prefix='/api/rooms')
    
    # Register Swagger UI blueprint
    from app.swagger import swaggerui_blueprint, generate_swagger_spec
    app.register_blueprint(swaggerui_blueprint, url_prefix='/api/docs')
    
    @app.route('/api/swagger.json')
    def swagger_spec():
        return jsonify(generate_swagger_spec())
    
    # A simple route to check if the app is running
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy'}
    
    # Serve static files for testing
    @app.route('/static/<path:path>')
    def send_static(path):
        return send_from_directory('static', path)
    
    # Socket.IO test page
    @app.route('/socket-test')
    def socket_test():
        static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'static')
        return send_from_directory(static_folder, 'socket_test.html')
    
    # Initialize Socket.IO events
    from app.rooms.socket_events import init_socket_events
    init_socket_events(app)
        
    return app