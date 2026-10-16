"""add app_settings table and recipe language column

Revision ID: 0002_app_settings_language
Revises: 0001_recipe_of_the_day
Create Date: 2026-10-16 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_app_settings_language"
down_revision: str | Sequence[str] | None = "0001_recipe_of_the_day"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "app_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    # Seed the singleton row (id == 1) with the German default.
    op.execute("INSERT INTO app_settings (id, language) VALUES (1, 'de')")

    # Existing recipes predate the language feature; default them to German.
    op.add_column(
        "recipe_of_the_day",
        sa.Column(
            "language",
            sa.String(),
            server_default="de",
            nullable=False,
        ),
    )
    # Drop the server_default now that existing rows are backfilled; the app
    # always sets the language explicitly on insert.
    op.alter_column("recipe_of_the_day", "language", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("recipe_of_the_day", "language")
    op.drop_table("app_settings")
