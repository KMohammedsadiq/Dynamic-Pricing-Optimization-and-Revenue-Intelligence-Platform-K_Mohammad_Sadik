import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000/api/v1/auth/login"

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

# We registered 'jane@example.com' with 'SecurePassword123!' previously.

# 1. Successful Login
make_request("Successful Login", {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
})

# 2. Wrong Password
make_request("Wrong Password", {
    "email": "jane@example.com",
    "password": "WrongPassword!"
})

# 3. Unknown Email
make_request("Unknown Email", {
    "email": "nobody@example.com",
    "password": "SecurePassword123!"
})

# 4. Validation Error (Missing Password)
make_request("Validation Error (Missing Field)", {
    "email": "jane@example.com"
})
