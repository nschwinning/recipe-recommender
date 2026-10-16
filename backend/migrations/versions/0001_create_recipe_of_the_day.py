"""create recipe_of_the_day table

Revision ID: 0001_recipe_of_the_day
Revises:
Create Date: 2026-10-15 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_recipe_of_the_day"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "recipe_of_the_day",
        sa.Column("id", sa.Integer(), nullable=False),
        # One recipe per calendar day — the unique constraint enforces
        # "generated once per day" at the database level.
        sa.Column("recipe_date", sa.Date(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("summary", sa.String(), nullable=False),
        sa.Column("cuisine", sa.String(), nullable=True),
        sa.Column("prep_minutes", sa.Integer(), nullable=True),
        sa.Column("cook_minutes", sa.Integer(), nullable=True),
        sa.Column("servings", sa.Integer(), nullable=True),
        sa.Column("ingredients", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("steps", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("generated_by", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recipe_date", name="uq_recipe_of_the_day_recipe_date"),
    )
    op.create_index(
        op.f("ix_recipe_of_the_day_recipe_date"),
        "recipe_of_the_day",
        ["recipe_date"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_recipe_of_the_day_recipe_date"), table_name="recipe_of_the_day")
    op.drop_table("recipe_of_the_day")
