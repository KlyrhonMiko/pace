import sys
import os
from datetime import datetime
from sqlmodel import Session, select

# Add the backend directory to sys.path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import engine
from core.config import settings
from utils.auth import create_access_token, decode_access_token
from models.users import User
from models.alumni import Alumni
from services.queries import alumni_queries, users_queries

def print_section(title):
    print(f"\n{'='*60}")
    print(f" {title.upper()} ")
    print(f"{'='*60}")

def check_db_connection():
    print_section("Database Connectivity")
    try:
        with Session(engine) as session:
            # Simple query to check connection
            session.exec(select(1)).first()
            print("✓ Successfully connected to PostgreSQL (Supabase)")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_auth_logic():
    print_section("Authentication Logic")
    try:
        test_data = {
            "user_id": "TEST-001",
            "user_type": "ADMIN",
            "user_code": "test-uuid-123"
        }
        
        # Test token creation
        token = create_access_token(test_data)
        print("✓ Access token created successfully")
        
        # Test token decoding
        decoded = decode_access_token(token)
        if decoded["user_id"] == test_data["user_id"]:
            print("✓ Token decoded and verified correctly")
        else:
            print("✗ Token mismatch after decoding")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Auth logic check failed: {e}")
        return False

def check_core_queries():
    print_section("Core Query Layer")
    results = {"users": False, "alumni": False}
    
    with Session(engine) as session:
        try:
            # Check users query
            user = session.exec(select(User).limit(1)).first()
            if user:
                print(f"✓ Found user in database: {user.user_id} ({user.email})")
                verified_user = users_queries.get_user_by_id(session, user.user_id)
                if verified_user:
                    print(f"✓ users_queries.get_user_by_id works")
                    results["users"] = True
            else:
                print("! No users found in database for verification")
                results["users"] = True  # Not a failure per se
        except Exception as e:
            print(f"✗ Users query check failed: {e}")

        try:
            # Check alumni query
            alumni = session.exec(select(Alumni).limit(1)).first()
            if alumni:
                print(f"✓ Found alumni in database: {alumni.alumni_id}")
                profile = alumni_queries.build_full_profile(session, alumni)
                if profile:
                    print(f"✓ alumni_queries.get_alumni_full_profile works")
                    results["alumni"] = True
            else:
                print("! No alumni found in database for verification")
                results["alumni"] = True
        except Exception as e:
            print(f"✗ Alumni query check failed: {e}")
            
    return all(results.values())

def run_sanity_suite():
    print(f"PACE Logic Sanity Suite - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'Unknown'}")
    
    checks = [
        ("Database Connection", check_db_connection),
        ("Authentication Logic", check_auth_logic),
        ("Core Queries", check_core_queries)
    ]
    
    success_count = 0
    for name, func in checks:
        if func():
            success_count += 1
            
    print_section("Summary")
    print(f"Passed: {success_count}/{len(checks)}")
    
    if success_count == len(checks):
        print("\n✨ ALL CORE LOGIC CHECKS PASSED ✨\n")
        return 0
    else:
        print("\n⚠ SOME CHECKS FAILED ⚠\n")
        return 1

if __name__ == "__main__":
    sys.exit(run_sanity_suite())
