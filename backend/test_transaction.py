import httpx
import asyncio

BASE_URL = "http://127.0.0.1:8000/api"

async def test_bulk_partial_success():
    print("Testing Partial Success in Bulk College Depts...")
    
    # Payload with one valid item, and one invalid item (duplicate PK)
    # We will run this twice, first time should succeed, second time item 1 fails, item 2 succeeds
    payload_1 = {
        "items": [
            {
                "college_dept_abbv": "TEST-1",
                "college_dept_name": "Test Department 1",
                "college_dept_desc": "Desc 1"
            }
        ]
    }
    
    payload_2 = {
        "items": [
            {
                "college_dept_abbv": "TEST-1",
                "college_dept_name": "Test Department 1 Duplicate",
                "college_dept_desc": "Desc 1"
            },
            {
                "college_dept_abbv": "TEST-2",
                "college_dept_name": "Test Department 2",
                "college_dept_desc": "Desc 2"
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        # 1. Insert TEST-1
        resp = await client.post(f"{BASE_URL}/college-depts/bulk", json=payload_1)
        print("Setup (Insert TEST-1):", resp.status_code)
        
        # 2. Insert TEST-1 (Duplicate) AND TEST-2 (Valid)
        # Without savepoints, TEST-2 would be rolled back because TEST-1 throws IntegrityError
        resp = await client.post(f"{BASE_URL}/college-depts/bulk", json=payload_2)
        print("Test (Insert Duplicate TEST-1, Valid TEST-2):", resp.status_code)
        print("Response:", resp.json())
        
        # 3. Verify TEST-2 was actually saved
        resp = await client.get(f"{BASE_URL}/college-depts")
        data = resp.json()
        depts = [d['college_dept_abbv'] for d in data.get('data', {}).get('items', [])]
        print("Currently in DB:", depts)
        
        if "TEST-2" in depts:
            print("SUCCESS! Partial commit worked. TEST-2 is in the DB.")
        else:
            print("FAILED! TEST-2 was rolled back.")

if __name__ == "__main__":
    asyncio.run(test_bulk_partial_success())
