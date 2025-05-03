import express, {Router} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import {CsServer} from './lib/CsServer.js'
import dotenv from 'dotenv'

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

const servers = new Map()
const getServer = async serverId => {
    let server
    if (!servers.has(serverId)) {
        server = new CsServer(connections[serverId])
        servers.set(serverId, server)

        server.on('error', error => console.error(`Server (${serverId}) ERROR`, error))
        await server.connect()
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
                    sendJson(response, await server.status(ip))
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
                    .post('/restart', async ({context: {server}}, response) =>
                        tryResponse(response, async () => {
                            sendJson(response, await server.restartGame())
                        }),
                    )
                    .post('/pause', async ({context: {server}}, response) =>
                        tryResponse(response, async () => {
                            sendJson(response, await server.pauseGame())
                        }),
                    )
                    .post('/unpause', async ({context: {server}}, response) =>
                        tryResponse(response, async () => {
                            sendJson(response, await server.unpauseGame())
                        }),
                    )
                    .post('/map', ({context: {server}, body: {map}}, response) =>
                        tryResponse(response, async () => {
                            sendJson(response, await server.setMap(map))
                        }),
                    )
                    .post('/teams', ({context: {server}, body: teamNames}, response) =>
                        tryResponse(response, async () => {
                            sendJson(response, await server.setTeamNames(teamNames))
                        }),
                    ),
            )
            .get('/maps', ({context: {serverId}}, response) =>
                tryResponse(response, async () => {
                    const server = await getServer(serverId)
                    sendJson(response, await server.listMaps())
                }),
            ),
    )
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.info(`Server running at http://0.0.0.0:${PORT}`)
})
