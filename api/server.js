import express, {Router} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import {CsServer} from './lib/CsServer.js'
import dotenv from 'dotenv'
import {EventEmitter} from 'events'
import process from 'process'

// Load environment variables from .env file
dotenv.config()
const PORT = process.env.PORT || 3000

const getRemoteAddress = ({headers, socket}) => headers?.['x-forwarded-for']
    ?.split(',')
    .map(remoteAddres => remoteAddres.trim())[0] || socket?.remoteAddress

/**
 * @typedef {Object} Connection
 * @property {string} host - The hostname or IP address of the server
 * @property {number} port - The port number for the RCON connection
 * @property {string} password - The RCON password for authentication
 * @property {number} id - The unique identifier for the server (added automatically)
 *
 * @type {Connection[]} Array of server connection configurations from CONNECTIONS_JSON environment variable
 */
const connections = JSON
    .parse(process.env.CONNECTIONS_JSON || '[]')
    .map((connection, id) => ({...connection, id}))

// Global event emitter for SSE
const globalEventEmitter = new EventEmitter()

const servers = new Map()
const getServer = async serverId => {
    let server
    if (!servers.has(serverId)) {
        server = new CsServer(connections[serverId])
        servers.set(serverId, server)

        // Forward server events to the global event emitter
        server.on('error', error => {
            console.error(`Server (${serverId}) ERROR`, error)
            globalEventEmitter.emit('server-error', {serverId, error: error.message})
        })

        server.on('end', () => {
            console.log(`Server (${serverId}) connection ended`)
            globalEventEmitter.emit('server-end', {serverId})
        })
        server.on('status', status => {
            globalEventEmitter.emit('server-status', {serverId, status})
        })

        await server.connect()
        globalEventEmitter.emit('server-connected', {serverId})
    }
    return servers.get(serverId)
}
const tryResponse = async (response, handler) => {
    try {
        await handler()
    } catch (error) {
        response.status(500).send({error: error.message})
    }
}
const sendJson = (response, data) => {
    if (data) {
        response.setHeader('Content-Type', 'application/json')
        response.json(data)
    } else {
        response.status(!data ? 204 : 200).send()
    }
}
const sendError = (response, error) => response.status(500).send({error: error.message})

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.set('trust proxy', true)
app
    .use((request, response, next) => {
        request.context = {ip: getRemoteAddress(request)}
        next()
    })
    .get('/test', ({context}, response) => {
        response.json(context)
    })
    .get('/cs', (request, response) => {
        response.json(connections)
    })
    .use(
        '/cs/:serverId(\\d+)',
        (request, _response, next) => {
            request.context.serverId = Number.parseInt(request.params.serverId)
            next()
        },
        new Router({mergeParams: true})
            .get('/', async ({context: {ip, serverId}}, response) =>
                tryResponse(response, async () => {
                    const server = await getServer(serverId)
                    const status = await server.status(ip)

                    // Emit server status update event
                    globalEventEmitter.emit('server-status', {serverId, status})

                    sendJson(response, status)
                }),
            )
            .use(
                '/game',
                async (request, response, next) => {
                    const {context: {ip, serverId}} = request
                    let server
                    let status
                    try {
                        server = await getServer(serverId)
                        status = await server.status(ip)
                    } catch (error) {
                        return sendError(response, new Error(`Unexpected error ${error.message}`))
                    }
                    if (status.players.every(({active}) => !active)) {
                        return sendError(response, new Error('Not connected to server'))
                    }
                    request.context.server = server
                    request.context.status = status
                    next()
                },
                new Router({mergeParams: true})
                    .post('/restart', async ({context: {server, serverId}}, response) =>
                        tryResponse(response, async () => {
                            const result = await server.restartGame()
                            globalEventEmitter.emit('game-action', {serverId, action: 'restart'})
                            sendJson(response, result)
                        }),
                    )
                    .post('/pause', async ({context: {server, serverId}}, response) =>
                        tryResponse(response, async () => {
                            const result = await server.pauseGame()
                            globalEventEmitter.emit('game-action', {serverId, action: 'pause'})
                            sendJson(response, result)
                        }),
                    )
                    .post('/unpause', async ({context: {server, serverId}}, response) =>
                        tryResponse(response, async () => {
                            const result = await server.unpauseGame()
                            globalEventEmitter.emit('game-action', {serverId, action: 'unpause'})
                            sendJson(response, result)
                        }),
                    )
                    .post('/map', ({context: {server, serverId}, body: {map}}, response) =>
                        tryResponse(response, async () => {
                            const result = await server.setMap(map)
                            globalEventEmitter.emit('game-action', {serverId, action: 'map-change', map})
                            sendJson(response, result)
                        }),
                    )
                    .post('/teams', ({context: {server, serverId}, body: teamNames}, response) =>
                        tryResponse(response, async () => {
                            const result = await server.setTeamNames(teamNames)
                            globalEventEmitter.emit('game-action', {serverId, action: 'team-names-change', teamNames})
                            sendJson(response, result)
                        }),
                    ),
            )
            .get('/maps', ({context: {serverId}}, response) =>
                tryResponse(response, async () => {
                    const server = await getServer(serverId)
                    const maps = await server.listMaps()
                    globalEventEmitter.emit('maps-list', {serverId, maps})
                    sendJson(response, maps)
                }),
            ),
    )
    /**
     * Server-Sent Events (SSE) endpoint
     * Establishes a persistent connection with clients and forwards events from CsServer instances
     * Events emitted:
     * - server-error: When a server encounters an error
     * - server-end: When a server connection ends
     * - server-connected: When a server connection is established
     * - server-status: When server status is requested
     * - game-action: When a game action is performed (restart, pause, unpause, map change, team names change)
     * - maps-list: When the list of available maps is requested
     */
    .get('/sse', (request, response) => {
        console.log('SSE client connected')

        const userIp = request.context.ip

        // Set headers for SSE
        response.setHeader('Content-Type', 'text/event-stream')
        response.setHeader('Cache-Control', 'no-cache')
        response.setHeader('Connection', 'keep-alive')
        response.flushHeaders()

        // Send initial connection message
        response.write(`data: ${JSON.stringify({type: 'connected'})}\n\n`)

        // Function to send events to this client
        const sendEvent = (event, data) => {
            response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        }

        // Set up heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
            response.write(`:heartbeat\n\n`)
        }, 30000) // Send heartbeat every 30 seconds

        // Set up event listeners for this client
        const errorHandler = data => sendEvent('server-error', data)
        const endHandler = data => sendEvent('server-end', data)
        const connectedHandler = data => sendEvent('server-connected', data)
        const statusHandler = status => sendEvent('server-status', !status.players?.length ? status : {
            ...status,
            players: status.players.map(player => ({...player, active: player.ip === userIp})),
        })
        const gameActionHandler = (data) => sendEvent('game-action', data)
        const mapsListHandler = (data) => sendEvent('maps-list', data)

        // Register event listeners
        globalEventEmitter.on('server-error', errorHandler)
        globalEventEmitter.on('server-end', endHandler)
        globalEventEmitter.on('server-connected', connectedHandler)
        globalEventEmitter.on('server-status', statusHandler)
        globalEventEmitter.on('game-action', gameActionHandler)
        globalEventEmitter.on('maps-list', mapsListHandler)

        // Handle client disconnect
        request.on('close', () => {
            // Clear heartbeat interval
            clearInterval(heartbeatInterval)

            // Remove event listeners
            globalEventEmitter.off('server-error', errorHandler)
            globalEventEmitter.off('server-end', endHandler)
            globalEventEmitter.off('server-connected', connectedHandler)
            globalEventEmitter.off('server-status', statusHandler)
            globalEventEmitter.off('game-action', gameActionHandler)
            globalEventEmitter.off('maps-list', mapsListHandler)

            console.log('SSE client disconnected')
        })
    })

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.info(`Server running at http://0.0.0.0:${PORT}`)
})

// Cleanup function
const cleanup = async () => {
    console.log('Shutting down gracefully...')

    // Close HTTP server
    server.close()

    // Disconnect all CS servers
    for (const [, csServer] of servers) {
        await csServer.disconnect()
    }

    // Remove all event listeners
    globalEventEmitter.removeAllListeners()

    console.log('Cleanup completed')
    process.exit(0)
}

// Handle shutdown signals
process.on('SIGTERM', cleanup)
process.on('SIGINT', cleanup)
