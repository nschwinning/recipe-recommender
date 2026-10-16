"""create reusable recipes library table

Revision ID: 0003_recipes_library
Revises: 0002_app_settings_language
Create Date: 2026-10-16 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_recipes_library"
down_revision: str | Sequence[str] | None = "0002_app_settings_language"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("summary", sa.String(), nullable=False),
        sa.Column("cuisine", sa.String(), nullable=True),
        sa.Column("prep_minutes", sa.Integer(), nullable=True),
        sa.Column("cook_minutes", sa.Integer(), nullable=True),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.Column("ingredients", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("steps", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("language", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("generated_by", sa.String(), nullable=True),
        # When liked from the recipe of the day, references that row. The unique
        # constraint enforces "a given day can be saved at most once".
        sa.Column("source_recipe_of_the_day_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["source_recipe_of_the_day_id"],
            ["recipe_of_the_day.id"],
            name="fk_recipes_source_recipe_of_the_day_id",
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint(
            "source_recipe_of_the_day_id",
            name="uq_recipes_source_recipe_of_the_day_id",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("recipes")
