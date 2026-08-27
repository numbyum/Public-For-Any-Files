# Changelog

All notable changes to Luna AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-27

### Added
- Initial project structure with modular architecture
- Connection to Minecraft servers via Mineflayer
- Auto-reconnect with exponential backoff on disconnect/kick
- Smooth look controller with overshoot, idle movements, and variable turn speed
- Natural movement system with acceleration, deceleration, wandering, and pausing
- Brain module with goal-based autonomous behavior
- Personality system with identity, chat style, and randomized responses
- Memory system with persistent JSON storage for players and events
- Perception module for detecting players, entities, and chat
- Chat commands: `hi luna`, `what is your name`, `follow me`, `stop`, `bye`
- Follow player behavior with natural distance keeping
- Player greeting and observation behaviors
- Graceful shutdown on SIGINT/SIGTERM
- Configurable environment variables via `.env`
- Logging system with configurable verbosity
- README with setup, troubleshooting, and usage instructions
- `.gitignore` to keep secrets and memory private

### Fixed
- Replaced deprecated `bot.look()` with `bot.lookAt()` for Mineflayer v4 compatibility
- Added proper yaw/pitch to Vec3 conversion for smooth camera control
- Centralized configuration in `Config.js` for easier tuning
- Separated chat handling into `ChatModule.js` for cleaner architecture
