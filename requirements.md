# Fraghouse Control Panel Requirements

## Overview
The Fraghouse Control Panel is a Vue 3 SPA that communicates with a Node.js Express JSON API for managing CS2 game servers.

## Frontend Requirements
- The SPA is hosted in the `/spa` folder and uses Vite, Vue Router, and Vuex
- The SPA provides an interface for:
  - Viewing all available CS2 servers
  - Viewing server details including current map, connected players, and team names
  - Changing the current map
  - Setting team names
  - Restarting, pausing, and unpausing the game

## Backend Requirements
- The API is hosted in the `/api` folder
- The API does not require authentication
- The API exposes the following endpoints:
  - `GET /cs` - Get all servers
  - `GET /cs/:serverId` - Get status of a specific server
  - `GET /cs/:serverId/maps` - Get available maps for a specific server
  - `POST /cs/:serverId/game/restart` - Restart the game on a specific server
  - `POST /cs/:serverId/game/pause` - Pause the game on a specific server
  - `POST /cs/:serverId/game/unpause` - Unpause the game on a specific server
  - `POST /cs/:serverId/game/map` - Change the map on a specific server
  - `POST /cs/:serverId/game/teams` - Update team names on a specific server
- The Express app runs on port 3000

## Deployment Requirements
- The Node.js app runs in a Docker container using PM2 as the process manager
- Nginx serves the static assets and the built SPA
- Nginx acts as a reverse proxy, forwarding requests to `/api` to the Node.js app
- The application is deployed using Docker Compose

## Development Requirements
- The Vite dev server proxies any `/api` requests to the Node.js app on port 3000
