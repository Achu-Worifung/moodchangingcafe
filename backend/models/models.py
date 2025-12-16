from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: Optional[int]
    name: str
    email: str
    hashed_password: str
    
class LoginData(BaseModel):
    email: str
    password: str
    

class AddItem(BaseModel):
    name: str
    description: str
    category: str
    price: float
    stock: int
    img: Optional[str]