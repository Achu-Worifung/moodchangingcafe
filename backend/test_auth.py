import requests

BASE_URL = "http://127.0.0.1:8000/api/auth"

# Test signup endpoint
def test_signup():
    payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/signup", json=payload)
    print("Signup Response:", response.json())

# Test login endpoint
def test_login():
    payload = {
        "username": "testuser",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/login", json=payload)
    print("Login Response:", response.json())

if __name__ == "__main__":
    print("Testing Signup...")
    test_signup()

    print("\nTesting Login...")
    test_login()