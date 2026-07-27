import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000/api/v1/auth/register"

def print_response(title, response_data, status_code):
    print(f"\n{'='*50}")
    print(f" DEMO: {title}")
    print(f"{'='*50}")
    print(f"Status Code: {status_code}")
    print("Response JSON:")
    print(json.dumps(response_data, indent=2))
    print("\n")

def make_request(title, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(BASE_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            response_data = json.loads(response.read().decode('utf-8'))
            print_response(title, response_data, response.status)
    except urllib.error.HTTPError as e:
        raw_error = e.read().decode('utf-8')
        try:
            error_data = json.loads(raw_error)
        except:
            error_data = {"raw_error": raw_error}
        print_response(title, error_data, e.code)

# 1. Test Validation Error (Invalid Email & Short Password)
invalid_payload = {
    "full_name": "J",
    "email": "not-an-email",
    "password": "123"
}
make_request("Invalid Data (Pydantic Validation)", invalid_payload)

# 2. Test Successful Registration
success_payload = {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
}
make_request("Successful Registration", success_payload)

# 3. Test Duplicate Email Error
make_request("Duplicate Email Error", success_payload)
