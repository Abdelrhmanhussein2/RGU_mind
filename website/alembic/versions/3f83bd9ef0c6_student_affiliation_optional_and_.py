"""student affiliation optional and university country

Revision ID: 3f83bd9ef0c6
Revises: 
Create Date: 2026-06-01 04:02:23.853219

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f83bd9ef0c6'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column("students", "university_id", nullable=True)
    op.alter_column("students", "faculty_id", nullable=True)
    op.execute("ALTER TABLE university ADD COLUMN IF NOT EXISTS country VARCHAR(255)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE university DROP COLUMN IF EXISTS country")
    op.alter_column("students", "faculty_id", nullable=False)
    op.alter_column("students", "university_id", nullable=False)
