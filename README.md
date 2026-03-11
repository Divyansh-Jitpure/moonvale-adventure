# Moonvale Adventure

Moonvale Adventure is a 2D fantasy adventure game prototype built with Next.js, TypeScript, and Phaser.

The current vertical slice includes:
- a playable overworld prototype
- keyboard and controller support
- melee combat encounters
- NPC interaction and dialogue
- quest progression across multiple routes
- a milestone log themed around the game world

## Tech Stack

- Next.js
- React
- TypeScript
- Phaser 3
- Tailwind CSS

## Current Game Slice

The game currently follows the player through Moonvale Outpost and its early combat routes:
- the pond road scout encounter
- the northern stones archer encounter
- persistent local quest and inventory state

Progress is stored in browser `localStorage`, so quest and inventory data persist locally between sessions on the same machine.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project Structure

- `src/app` - Next.js app routes and UI shell
- `src/components` - reusable UI components
- `src/game` - Phaser bootstrap and game scenes
- `src/lib` - shared game progress/state helpers
- `public/assets` - game art and UI assets

## Notes

- Tiny Swords free-pack assets are used for the prototype art direction.
- Controller support works through the browser Gamepad API.
- Saved progress does not move with git unless exported separately.
