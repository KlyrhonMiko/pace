"""Phase 2: Update Event model with EventType FK and rename fields

Revision ID: 311e7e90fd7b
Revises: 88f4a75d8c7a
Create Date: 2026-03-03 19:07:07.028142

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '311e7e90fd7b'
down_revision: Union[str, Sequence[str], None] = '88f4a75d8c7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if event_types table is empty and seed initial data if needed
    conn = op.get_bind()
    
    # Seed initial event types if they don't exist
    result = conn.execute(sa.text("SELECT COUNT(*) FROM event_types"))
    count = result.scalar()
    
    if count == 0:
        from datetime import timezone, timedelta
        from uuid import uuid4
        
        gmt8 = timezone(timedelta(hours=8))
        now = datetime.now(gmt8)
        
        seed_data = [
            (str(uuid4()), 'ET-000001', 'Career Fair', now, now),
            (str(uuid4()), 'ET-000002', 'Workshop', now, now),
            (str(uuid4()), 'ET-000003', 'Seminar', now, now),
            (str(uuid4()), 'ET-000004', 'Networking', now, now),
            (str(uuid4()), 'ET-000005', 'Other', now, now),
        ]
        
        for event_type_code, event_type_id, event_name, created_at, updated_at in seed_data:
            conn.execute(
                sa.text(
                    """INSERT INTO event_types (event_type_code, event_type_id, event_name, is_active, created_at, updated_at, is_deleted) 
                       VALUES (:code, :id, :name, true, :created, :updated, false)"""
                ),
                {"code": event_type_code, "id": event_type_id, "name": event_name, "created": created_at, "updated": updated_at}
            )
    
    # Update events table
    op.add_column('events', sa.Column('event_name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False, server_default=''))
    op.add_column('events', sa.Column('event_type_code', sa.Uuid(), nullable=True))
    
    # Migrate data from 'name' to 'event_name'
    op.execute(sa.text("UPDATE events SET event_name = name"))
    
    # For event_type, map old enum values to new event_type_codes using a default for now
    # Get the 'Other' event type code
    op.execute(sa.text("""
        UPDATE events 
        SET event_type_code = (SELECT event_type_code FROM event_types WHERE event_type_id = 'ET-000005')
        WHERE 1=1
    """))
    
    # Make event_type_code NOT NULL after setting values
    op.alter_column('events', 'event_type_code', nullable=False)
    
    # Create foreign key
    op.create_foreign_key(None, 'events', 'event_types', ['event_type_code'], ['event_type_code'])
    
    # Drop old columns
    op.drop_column('events', 'name')
    op.drop_column('events', 'event_type')
    
    # Remove server_default now that data is migrated
    op.alter_column('events', 'event_name', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Add back old columns to events
    op.add_column('events', sa.Column('event_type', postgresql.ENUM('CAREER_FAIR', 'WORKSHOP', 'SEMINAR', 'NETWORKING', 'OTHER', name='eventtype'), autoincrement=False, nullable=False, server_default='OTHER'))
    op.add_column('events', sa.Column('name', sa.VARCHAR(length=255), autoincrement=False, nullable=False, server_default=''))
    
    # Migrate data back
    op.execute(sa.text("UPDATE events SET name = event_name"))
    op.execute(sa.text("""
        UPDATE events 
        SET event_type = 'OTHER'
    """))
    
    # Drop foreign key and new columns
    op.drop_constraint(None, 'events', type_='foreignkey')
    op.drop_column('events', 'event_type_code')
    op.drop_column('events', 'event_name')

