import requests
import sys
import getpass

API_URL = "http://127.0.0.1:8000/api/v1/auth/register"

def main():
    print("=== ScanDine Admin Creation Script ===")
    restaurant_name = input("Enter Restaurant Name: ").strip()
    if not restaurant_name:
        print("Restaurant name is required.")
        sys.exit(1)

    admin_name = input("Enter Admin Full Name: ").strip()
    admin_email = input("Enter Admin Email: ").strip()
    
    password = getpass.getpass("Enter Admin Password: ")
    confirm_password = getpass.getpass("Confirm Password: ")

    if password != confirm_password:
        print("Passwords do not match!")
        sys.exit(1)

    payload = {
        "restaurant_name": restaurant_name,
        "name": admin_name,
        "email": admin_email,
        "password": password
    }

    try:
        print("\nCreating restaurant and admin account...")
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 201 or response.status_code == 200:
            print("✅ Successfully created!")
            print(f"Login at: http://localhost:5173/login")
            print(f"Email: {admin_email}")
        else:
            print(f"❌ Failed! Status Code: {response.status_code}")
            try:
                print(f"Error: {response.json()}")
            except:
                print(response.text)
                
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the backend API.")
        print("Make sure the backend is running at http://127.0.0.1:8000")

if __name__ == "__main__":
    main()
