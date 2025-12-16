from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    username: str
    email: str
    password: str

class LoginData(BaseModel):
    username: str
    password: str
    

class AddItem(BaseModel):
    name: str
    description: str
    category: str
    price: float
    stock: int
    img: Optional[str]