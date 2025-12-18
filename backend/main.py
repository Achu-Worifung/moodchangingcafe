from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Depends, Form
import bcrypt
import jwt 
import os
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
from psycopg2.errors import UniqueViolation
from fastapi.security import OAuth2PasswordBearer

from models.models import User, LoginData, AddItem
from dbconfig import query, execute
# uvicorn main:app --reload


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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper function to generate JWT token
def create_token(username: str, email: str, role: str) -> str:
    payload = {
        "username": f"{username}_{datetime.utcnow().strftime('%Y-%m-%d')}",
        "email": email,
        "role": role,
        # "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_admin_role(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin privileges required")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

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




@app.post('/api/admin/additem')
async def add_item(
    itemName: str = Form(...),
    itemDescription: Optional[str] = Form(None),
    itemPrice: float = Form(...),
    itemStock: int = Form(...),
    tax_rate: Optional[float] = Form(0.0),
    category: str = Form(...),
    img: Optional[UploadFile] = File(None),
    token: str = Depends(oauth2_scheme)
):
    verify_admin_role(token)
    
    # Debug
    print("Received:", itemName, itemDescription, itemPrice, itemStock, tax_rate, category, img)
    
    # Read image bytes
    img_bytes = None
    if img:
        img_bytes = await img.read()

    try:
        execute(
            """
            INSERT INTO item (name, description, unit_price, quantity_in_stock, tax_rate, category, img)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (itemName, itemDescription, itemPrice, itemStock, tax_rate, category, img_bytes)
        )
        return {"message": "Item added successfully"}
    except Exception as e:
        return {"error": str(e)}


@app.get('/api/admin/items')
def get_all_items():
    try:
        items = query("SELECT id, name, description, unit_price, quantity_in_stock, tax_rate, category, img FROM item")
        item_list = [
            {
                "id": item[0],
                "name": item[1],
                "description": item[2],
                "unit_price": float(item[3]),
                "quantity_in_stock": item[4],
                "tax_rate": float(item[5]),
                "category": item[6],
                "img": item[7].hex() if item[7] else None
            }
            for item in items
        ]
        # print("Fetched items:", item_list)
        return {"items": item_list}
    except Exception as e:
        return {"error": str(e)}