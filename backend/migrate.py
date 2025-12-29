import sqlite3
from datetime import datetime

DATABASE_URL = "therapy.db"


def migrate_existing_data():
    """
    Migrate existing clients/sessions to new multi-therapist schema
    Strategy: Create a "Legacy" therapist account for existing data
    """
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()

    print("Starting data migration...")

    # Check if therapists table exists
    cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='therapists'
    """)

    if not cursor.fetchone():
        print("ERROR: Therapists table doesn't exist yet. Run init_db() first.")
        conn.close()
        return

    # Check if any clients lack therapist_id
    cursor.execute("SELECT COUNT(*) FROM clients WHERE therapist_id IS NULL")
    unassigned_clients = cursor.fetchone()[0]

    # Check if any sessions lack therapist_id
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE therapist_id IS NULL")
    unassigned_sessions = cursor.fetchone()[0]

    if unassigned_clients == 0 and unassigned_sessions == 0:
        print("No unassigned data found. Migration not needed.")
        conn.close()
        return

    print(f"Found {unassigned_clients} clients and {unassigned_sessions} sessions without therapist assignment")

    # Create or get legacy therapist
    cursor.execute("""
        SELECT id FROM therapists WHERE clerk_user_id = 'legacy_system'
    """)

    legacy_therapist = cursor.fetchone()

    if legacy_therapist:
        legacy_id = legacy_therapist[0]
        print(f"Using existing legacy therapist (ID: {legacy_id})")
    else:
        # Create legacy therapist
        cursor.execute("""
            INSERT INTO therapists
            (clerk_user_id, email, first_name, last_name)
            VALUES (?, ?, ?, ?)
        """, ('legacy_system', 'legacy@system.local', 'Legacy', 'System'))

        legacy_id = cursor.lastrowid
        print(f"Created legacy therapist (ID: {legacy_id})")

    # Assign all unassigned clients
    if unassigned_clients > 0:
        cursor.execute("""
            UPDATE clients
            SET therapist_id = ?
            WHERE therapist_id IS NULL
        """, (legacy_id,))
        print(f"✓ Assigned {unassigned_clients} clients to legacy therapist")

    # Assign all unassigned sessions
    if unassigned_sessions > 0:
        cursor.execute("""
            UPDATE sessions
            SET therapist_id = ?
            WHERE therapist_id IS NULL
        """, (legacy_id,))
        print(f"✓ Assigned {unassigned_sessions} sessions to legacy therapist")

    conn.commit()
    conn.close()

    print("\n✅ Migration completed successfully!")
    print(f"   Total clients migrated: {unassigned_clients}")
    print(f"   Total sessions migrated: {unassigned_sessions}")
    print(f"   Legacy therapist ID: {legacy_id}")
    print("\nNext steps:")
    print("1. Set up Clerk authentication")
    print("2. Create real therapist accounts")
    print("3. (Optional) Reassign legacy data to real therapists")


if __name__ == '__main__':
    migrate_existing_data()
