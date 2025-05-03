# Fraghouse Control Panel

A Vue 3 SPA that communicates with a Node.js Express JSON API, containerized with Docker.

## Project Structure

- `/spa` - Vue 3 SPA using Vite, Vue Router, and Vuex
  - `/src` - Source code for the SPA
    - `/assets` - Static assets
    - `/components` - Vue components
    - `/lib` - Utility functions
    - `/router` - Vue Router configuration
    - `/store` - Vuex store
    - `/views` - Vue views (pages)
  - `/public` - Public static files
  - `/dist` - Built SPA (generated)
  - `Dockerfile` - Docker configuration for the web service
  - `nginx.conf` - Nginx configuration
- `/api` - Node.js Express API
  - `/lib` - API utility functions and classes
  - `server.js` - Main Express application
  - `Dockerfile` - Docker configuration for the API service
- `docker-compose.yml` - Docker Compose configuration for the entire application

## Test

## API Endpoints

- `GET /cs` - Get all servers
- `GET /cs/:serverId` - Get status of a specific server
- `GET /cs/:serverId/maps` - Get available maps for a specific server
- `POST /cs/:serverId/game/restart` - Restart the game on a specific server
- `POST /cs/:serverId/game/pause` - Pause the game on a specific server
- `POST /cs/:serverId/game/unpause` - Unpause the game on a specific server
- `POST /cs/:serverId/game/map` - Change the map on a specific server
- `POST /cs/:serverId/game/teams` - Update team names on a specific server

## Development Setup

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Docker and Docker Compose

### Running the SPA in Development Mode

```bash
cd spa
npm install
npm run dev
```

The Vite dev server will proxy any `/api` requests to the Node.js app on port 3000.

### Running the API in Development Mode

```bash
cd api
npm install
npm run dev
```

The API will run on 127.0.0.1:3000.

## Production Setup with Docker

To build and run the entire application with Docker:

```bash
docker-compose up -d --build
```

This will:
1. Build the Node.js API container with PM2 as the process manager
2. Build the Vue SPA and serve it through Nginx
3. Configure Nginx as a reverse proxy for the API

The application will be available at:
- SPA: http://localhost
- API: http://localhost/api

## Architecture

- The Node.js app runs in a Docker container using PM2 as the process manager
- Nginx serves the static assets and the built SPA
- Nginx also acts as a reverse proxy, forwarding requests to `/api` to the Node.js app
