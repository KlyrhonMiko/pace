import psycopg2
import os

DATABASE_URL="postgresql://postgres.cnctaypuorbulirzbuku:paceccs2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

def add_column():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if column exists first
        cur.execute("""
            SELECT count(*) 
            FROM information_schema.columns 
            WHERE table_name='job_applications' AND column_name='resume_file_url'
        """)
        
        if cur.fetchone()[0] == 0:
            print("Adding column resume_file_url to job_applications...")
            cur.execute("ALTER TABLE job_applications ADD COLUMN resume_file_url VARCHAR;")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column resume_file_url already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_column()
