# Luna AI

Luna is an autonomous Minecraft AI player. She connects to a Minecraft server (like Minefort), explores, remembers players, and chats naturally. This is the first version - reliable, smooth, and ready to run.

## What Luna can do

- Connect to a Minecraft server
- Spawn and explore naturally
- Wander with smooth, human-like movement
- Notice and greet nearby players
- Remember player names and last seen times
- Respond to basic chat messages
- Follow a player when asked
- Stop following when asked
- Reconnect automatically if disconnected

## What is in this project

```
Luna-AI/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.js              (main entry point)
│   ├── brain/
│   │   ├── Brain.js          (decision making and goals)
│   │   ├── Personality.js    (Luna's identity and chat style)
│   │   └── Goals.js          (goal definitions and transitions)
│   ├── memory/
│   │   └── Memory.js         (persistent JSON memory)
│   ├── perception/
│   │   └── Perception.js     (world, players, entities, chat)
│   ├── movement/
│   │   ├── Movement.js       (smooth walking and wandering)
│   │   └── LookController.js (smooth camera / look control)
│   └── utils/
│       └── math.js           (smooth math and easing helpers)
└── data/
    └── memory.json           (auto-created on first run)
```

## Requirements

- **Node.js** version 16 or higher (version 18 or 20 recommended)
- **npm** (comes with Node.js)
- A Minecraft server you can connect to (such as Minefort)

## Install Node.js

If you do not have Node.js installed:

1. Go to https://nodejs.org/
2. Download the **LTS** version for your operating system.
3. Run the installer.
4. Open a terminal and type `node -v` to confirm it is installed.

## Setup

### 1. Extract the project

- If you downloaded a ZIP file, extract it to a folder on your computer.
- You should see a folder named `Luna-AI`.

### 2. Open a terminal in that folder

- **Windows:** Hold Shift, right-click inside the folder, and choose "Open PowerShell window here" or "Open in Terminal".
- **Mac:** Right-click inside the folder, choose "New Terminal at Folder".
- **Linux:** Right-click inside the folder, choose "Open in Terminal".

### 3. Install dependencies

Type this command and press Enter:

```
npm install
```

This will download `mineflayer` and `dotenv`.

### 4. Create your `.env` file

In the project folder, create a new file named `.env`.

You can copy the contents of `.env.example` into it and edit the values.

Edit these values in `.env`:

```
MINECRAFT_HOST=your-server-address.example.com
MINECRAFT_PORT=25565
MINECRAFT_VERSION=
MINECRAFT_USERNAME=Luna
MINECRAFT_AUTH=offline
```

- **MINECRAFT_HOST**: Your Minefort server address (for example: `mycoolserver.ma.minefort.com`)
- **MINECRAFT_PORT**: Usually `25565`
- **MINECRAFT_VERSION**: Leave empty to let the bot auto-detect. Or enter your server version, for example `1.20.4`
- **MINECRAFT_USERNAME**: The name Luna will use in-game (for example `Luna`)
- **MINECRAFT_AUTH**: Use `offline` if the server does not require a paid Minecraft account. Use `microsoft` if it does.

### 5. Run Luna

Type this command and press Enter:

```
npm start
```

You should see logs like:

```
[CONNECT] Luna AI starting... (Luna)
[CONNECT] Target: your-server:25565
[CONNECT] Connecting to your-server:25565...
[CONNECT] Spawned into the world.
```

If you see "Spawned into the world", Luna is online.

## Chat commands

When Luna is online, you can type these in Minecraft chat:

| Command | What Luna does |
|---------|----------------|
| `hi luna` or `hello luna` | Greets you and approaches |
| `what is your name` | Says "I'm Luna." |
| `follow me` | Follows you around |
| `stop` | Stops following and wandering |
| `bye` | Says goodbye |

## How Luna moves

Luna does NOT move like a robot. Her movement is designed to feel like a real player:

- Camera turns smoothly with variable speed
- She accelerates and decelerates when walking
- She occasionally overshoots slightly and corrects
- She makes small idle camera movements
- Walking duration and timing vary naturally
- She occasionally pauses, turns, and looks around
- She jumps occasionally while walking

## Troubleshooting

### `Error: connect ECONNREFUSED`
The server address or port is wrong, or the server is offline.
- Double-check `MINECRAFT_HOST` and `MINECRAFT_PORT` in `.env`.
- Make sure the server is running.

### `Error: Invalid version`
- Set `MINECRAFT_VERSION` in `.env` to match your server version exactly.
- Or leave it blank to use auto-detection.

### `Error: authentication`
- If the server requires a real Minecraft account, change `MINECRAFT_AUTH` to `microsoft`.
- If the server is offline/cracked, use `offline`.

### `Error: Cannot find module 'mineflayer'`
- Run `npm install` again.
- Make sure you are in the correct folder.

### Bot spawns but does not move
- Check `LUNA_AUTONOMOUS=true` in `.env`.
- Wait a few seconds - Luna may be observing first.
- Try typing `stop` in chat to reset her state.

### Bot disconnects immediately
- Some servers block bots. Check the server's rules.
- Make sure the username is not already online.
- Some servers require a whitelist.

## Keeping credentials private

- Never share your `.env` file.
- `.env` is already listed in `.gitignore` and will not be uploaded if you use Git.
- `data/memory.json` is also ignored by Git.
- Only `README.md`, source code, and config templates should be shared.

## Memory

Luna remembers things automatically:

- Player names
- Last time a player was seen
- Events like joins, leaves, and deaths

Memory is stored locally in `data/memory.json`. Later, this can be upgraded to SQLite or another database without changing the rest of the code.

## Project structure explained

- `src/index.js` - Starts the bot, connects, reconnects, runs the main loop.
- `src/brain/Brain.js` - Decides what Luna should do right now.
- `src/brain/Goals.js` - Defines possible goals like wander, observe, greet, follow.
- `src/brain/Personality.js` - Luna's identity, chat style, and responses.
- `src/memory/Memory.js` - Loads and saves player and event data.
- `src/perception/Perception.js` - Detects nearby players, entities, and chat.
- `src/movement/Movement.js` - Controls walking, sprinting, pausing, and following with natural timing.
- `src/movement/LookController.js` - Controls camera smoothly with overshoot, idle movements, and variable turn speed.
- `src/utils/math.js` - Smooth interpolation and random helpers.

## Upgrading later

The code is modular. You can later add:

- Pathfinding for obstacle avoidance
- Building and gathering behaviors
- Crafting and inventory management
- SQLite or web-based memory backend
- Custom Minefort-specific features

## Version

Current: **0.1.0**

This is a first version focused on reliable connection, natural movement, basic chat, and memory. It is not a fully intelligent AGI. It simulates personality and behavior through modular code.
