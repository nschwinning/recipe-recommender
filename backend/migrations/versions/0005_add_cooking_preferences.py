"""add cooking preferences to app_settings

Revision ID: 0005_cooking_preferences
Revises: 0004_recipe_tags
Create Date: 2026-10-19 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_cooking_preferences"
down_revision: str | Sequence[str] | None = "0004_recipe_tags"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("app_settings", sa.Column("servings", sa.Integer(), nullable=True))
    op.add_column(
        "app_settings",
        sa.Column(
            "diet",
            sa.String(),
            server_default="none",
            nullable=False,
        ),
    )
    op.add_column(
        "app_settings",
        sa.Column(
            "liked_ingredients",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )
    op.add_column(
        "app_settings",
        sa.Column(
            "disliked_ingredients",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("app_settings", "disliked_ingredients")
    op.drop_column("app_settings", "liked_ingredients")
    op.drop_column("app_settings", "diet")
    op.drop_column("app_settings", "servings")
