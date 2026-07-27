import urllib.request
import json
import jwt # For decoding and displaying to the user

BASE_URL = "http://localhost:8000/api/v1/auth/login"
payload = {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(BASE_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')

print("\n--- Testing Valid Login JWT ---")
try:
    with urllib.request.urlopen(req) as response:
        response_data = json.loads(response.read().decode('utf-8'))
        token = response_data.get("access_token")
        
        print("Success! Token received:")
        print(f"Token: {token[:20]}...[truncated]")
        
        # Decode without verification just to display payload
        decoded_payload = jwt.decode(token, options={"verify_signature": False})
        print("\nDecoded JWT Payload:")
        print(json.dumps(decoded_payload, indent=2))
        
except Exception as e:
    print(f"Error: {e}")

print("\n--- Testing Invalid Login ---")
payload["password"] = "wrong"
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(BASE_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        pass
except urllib.error.HTTPError as e:
    print(f"Status Code: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
