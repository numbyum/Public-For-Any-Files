# Data Directory

This directory contains Luna's persistent data.

## Files

### `memory.json`
Auto-generated on first run. Stores:
- Known players and their last seen times
- Events (joins, leaves, deaths, disconnects)
- Places visited

This file is updated automatically while Luna is running.
It is ignored by Git (see `.gitignore`) and should not be shared publicly.

## Backups

If you want to back up Luna's memory:
1. Stop Luna (`Ctrl+C`)
2. Copy `data/memory.json` to a safe location
3. Restart Luna

## Upgrading storage

The memory system is modular. In the future, `data/memory.json` can be replaced
with SQLite, a web service, or another backend without changing the rest of the code.
