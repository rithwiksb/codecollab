from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from flask_swagger_ui import get_swaggerui_blueprint

# Create an APISpec
spec = APISpec(
    title="CodeCollab API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[MarshmallowPlugin()],
)

# Define the Swagger UI blueprint
SWAGGER_URL = '/api/docs'  # URL for exposing Swagger UI
API_URL = '/api/swagger.json'  # Our API url

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "CodeCollab API",
        'deepLinking': True,
        'supportedSubmitMethods': ['get', 'post', 'put', 'delete', 'patch'],
        'displayOperationId': True,
        'displayRequestDuration': True,
        'docExpansion': 'list',
        'showExtensions': True,
        'showCommonExtensions': True,
        'oauth2RedirectUrl': f"{SWAGGER_URL}/oauth2-redirect.html",
        'persistAuthorization': True
    }
)

# Define API documentation
def generate_swagger_spec():
    """Generate the Swagger specification"""
    
    # Authentication endpoints
    spec.path(
        path="/api/auth/register",
        operations={
            "post": {
                "tags": ["Authentication"],
                "summary": "Register a new user",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "username": {"type": "string"},
                                    "email": {"type": "string", "format": "email"},
                                    "password": {"type": "string"}
                                },
                                "required": ["username", "email", "password"]
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "User registered successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"},
                                        "user": {"type": "object"},
                                        "access_token": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "400": {"description": "Missing required fields"},
                    "409": {"description": "Username or email already exists"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/auth/login",
        operations={
            "post": {
                "tags": ["Authentication"],
                "summary": "Login a user",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "username": {"type": "string"},
                                    "password": {"type": "string"}
                                },
                                "required": ["username", "password"]
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Login successful",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"},
                                        "user": {"type": "object"},
                                        "access_token": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "400": {"description": "Missing username or password"},
                    "401": {"description": "Invalid username or password"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/auth/me",
        operations={
            "get": {
                "tags": ["Authentication"],
                "summary": "Get current user",
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "User details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "user": {"type": "object"}
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "User not found"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    # Room endpoints
    spec.path(
        path="/api/rooms",
        operations={
            "get": {
                "tags": ["Rooms"],
                "summary": "Get all available rooms",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {
                        "name": "member_only",
                        "in": "query",
                        "description": "Filter rooms by user membership",
                        "required": False,
                        "schema": {"type": "boolean"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "List of rooms",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "rooms": {
                                            "type": "array",
                                            "items": {"type": "object"}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "500": {"description": "Server error"}
                }
            },
            "post": {
                "tags": ["Rooms"],
                "summary": "Create a new room",
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "language": {"type": "string"}
                                },
                                "required": ["name"]
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Room created successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"},
                                        "room": {"type": "object"}
                                    }
                                }
                            }
                        }
                    },
                    "400": {"description": "Room name is required"},
                    "409": {"description": "Room name already exists"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/rooms/{room_id}",
        operations={
            "get": {
                "tags": ["Rooms"],
                "summary": "Get a specific room by ID",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {
                        "name": "room_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Room details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "room": {"type": "object"}
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "Room not found"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/rooms/{room_id}/join",
        operations={
            "post": {
                "tags": ["Rooms"],
                "summary": "Join a room",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {
                        "name": "room_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Joined room successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "Room not found"},
                    "409": {"description": "Already a member of this room"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/rooms/{room_id}/leave",
        operations={
            "post": {
                "tags": ["Rooms"],
                "summary": "Leave a room",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {
                        "name": "room_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Left room successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"}
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "Not a member of this room"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    spec.path(
        path="/api/rooms/{room_id}/toggle-video",
        operations={
            "post": {
                "tags": ["Rooms"],
                "summary": "Toggle video chat for a room",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {
                        "name": "room_id",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "integer"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Video chat toggled",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "msg": {"type": "string"},
                                        "room": {"type": "object"}
                                    }
                                }
                            }
                        }
                    },
                    "404": {"description": "Room not found or not authorized"},
                    "500": {"description": "Server error"}
                }
            }
        }
    )
    
    # Add security scheme for JWT
    spec.components.security_scheme("bearerAuth", {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    })
    
    return spec.to_dict()