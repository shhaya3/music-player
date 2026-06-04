import os, jwt, datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from models import db, User
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/register/', methods=['POST'])
def register():
    data = request.get_json()

    if not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'error':'All Fields required'}),400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    user = User(
        username = data['username'],
        email = data['email'],
        password=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'messege': 'Account Created'}), 201


@auth_bp.route('/app/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if not user or not check_password_hash(user.password.hash, data.get('password', '')):
        return jsonify({'error':'Invalid Credentials'}), 401
    
    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')
    current_user = User.query.get(data['user_id'])

    return jsonify({'token': token, 'username':user.username})

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization','')
        token = auth_header.replace('bearer','')

        if not token:
            return jsonify({'error':'Login Required'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error:''Session expired - Please log in again'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error:''Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated
