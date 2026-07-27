from app.core.security import get_password_hash, verify_password

pwd = 'SuperSecretPassword123!'
hash1 = get_password_hash(pwd)
hash2 = get_password_hash(pwd)

print(f"Original Password: {pwd}")
print(f"Hash 1: {hash1}")
print(f"Hash 2: {hash2}")
print(f"Verify Hash 1 with correct password: {verify_password(pwd, hash1)}")
print(f"Verify Hash 2 with correct password: {verify_password(pwd, hash2)}")
print(f"Verify Hash 1 with wrong password: {verify_password('wrong', hash1)}")
