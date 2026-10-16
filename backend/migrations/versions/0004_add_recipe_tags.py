"""add tags to recipe_of_the_day and recipes

Revision ID: 0004_recipe_tags
Revises: 0003_recipes_library
Create Date: 2026-10-16 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_recipe_tags"
down_revision: str | Sequence[str] | None = "0003_recipes_library"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    for table in ("recipe_of_the_day", "recipes"):
        op.add_column(
            table,
            sa.Column(
                "tags",
                postgresql.JSONB(astext_type=sa.Text()),
                server_default=sa.text("'[]'::jsonb"),
                nullable=False,
            ),
        )


def downgrade() -> None:
    """Downgrade schema."""
    for table in ("recipes", "recipe_of_the_day"):
        op.drop_column(table, "tags")
