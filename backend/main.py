from fastapi import FastAPI
import bcrypt
import jwt 
import os
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from psycopg2.errors import UniqueViolation

from models.models import User, LoginData, AddItem
from dbconfig import query, execute

app = FastAPI()
# run script: fastapi dev main.py
#aconfigure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

salt = bcrypt.gensalt()

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"

# Helper function to generate JWT token
def create_token(username: str, email: str, role: str) -> str:
    payload = {
        "username": f"{username}_{datetime.utcnow().strftime('%Y-%m-%d')}",
        "email": email,
        "role": role,
        # "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@app.post('/api/auth/login')
def login(data: LoginData):
    try:
        user = query(
            "SELECT username, email, password_hash, role FROM user_account WHERE email = %s",
            (data.email,)
        )

        if user and bcrypt.checkpw(data.password.encode('utf-8'), user[0][2].encode('utf-8')):
            token = create_token(user[0][0], user[0][1], user[0][3])
            return {"token": token}
        else:
            return {"error": "Invalid username or password"}
    except Exception as e:
        return {"error": str(e)}


@app.post('/api/auth/signup')
def signup(data: User):
    # Hash the password
    hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), salt)

    try:
        execute(
            "INSERT INTO user_account (username, email, password_hash) VALUES (%s, %s, %s)",
            (data.username, data.email, hashed_password.decode('utf-8'))
        )
        return {"message": "User created successfully", "token": create_token(data.username, data.email, "user")}
    except UniqueViolation:
        return {"error": "Username or email already exists."}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@app.get('/api/cart/{user_id}')
def get_cart(user_id: int):
    pass