# BaleAnchor.HomeBox

## Copilot Agent Setup

This repository is configured to use a project-scoped Copilot agent and instructions.

- Primary agent: `BaleAnchorUtility/.github/agents/BaleAnchorHomeBox.agent.md`
- Global guidance: `BaleAnchorUtility/.github/copilot-instructions.md`
- File-scoped rules: `BaleAnchorUtility/.github/instructions/claude-spec.instructions.md`

When editing core app files, prioritize `ProjectDouments/CLAUDE.md` requirements and keep API validation/error behavior aligned with the RFC 7807 ProblemDetails contract defined in the instruction files.
