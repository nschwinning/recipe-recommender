"""Agent factory wrapping the ``openai-agents`` SDK."""

from __future__ import annotations

from typing import Any

from agents.agent import Agent
from pydantic import BaseModel

from recipe_recommender.config import settings


def build_agent(
    name: str,
    instructions: str,
    output_type: type[BaseModel],
    tools: list[Any] | None = None,
    model: str | None = None,
) -> Agent:
    """Build an ``openai-agents`` Agent with structured output.

    ``output_type`` is required: agents must always produce structured output so
    callers get a validated Pydantic model back rather than free-form text.
    """
    if not (isinstance(output_type, type) and issubclass(output_type, BaseModel)):
        raise TypeError(
            "build_agent requires a Pydantic model class as output_type; "
            "agents must always produce structured output."
        )

    return Agent(
        name=name,
        instructions=instructions,
        model=model or settings.RECIPE_MODEL,
        tools=tools or [],
        output_type=output_type,
    )
