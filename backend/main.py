from fastapi import FastAPI
import psycopg2 as pg
import bcrypt
import jwt 
from datetime import datetime, timedelta
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from models.models import User, LoginData, AddItem

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


@app.post('/api/auth/login')
def login(data: LoginData):
    # conn = pg.connect(database="postgres", user="postgres", password="postgres", host="localhost", port="5432")
    # cursor = conn.cursor()
    # cursor.execute("SELECT * FROM users WHERE username = %s", (data.username,))
    pass 


@app.post('/api/auth/signup')
def signup(data: User):
    pass


@app.get('/api/cart/{user_id}')
def get_cart(user_id: int):
    pass