import Bottleneck from 'bottleneck'
import Rcon from 'rcon'
import {EventEmitter} from 'events'

const sanitizeTeamName = name => name.replaceAll('"', '')

const retry = async (attempt, errorMessage) => {
    if (attempt >= 10) {
        throw new Error(errorMessage)
    }
    return new Promise(resolve => setTimeout(resolve, 1000))
}

export class CsServer {

    constructor({id, host, port, password}) {
        const eventEmitter = new EventEmitter()
        const limiter = new Bottleneck({
            maxConcurrent: 1,
            minTime: 125,
        })

        const executeCommand = command => limiter.schedule(() => new Promise((resolve, reject) => {
            rcon.once('response', resolve)
            rcon.once('error', reject)
            rcon.send(command)
        }))

        const rcon = new Rcon(host, port, password)
        rcon
            // .on('response', function (str) {
            //     console.info('Response: ' + str)
            // })
            // .on('server', function (str) {
            //     console.info('Server: ' + str)
            // })
            .on('error', function (err) {
                eventEmitter.emit('error', err)
            })
            .on('end', function () {
                eventEmitter.emit('end')
            })

        this.id = id
        this.connect = () => new Promise((resolve, reject) => {
            rcon.once('auth', resolve)
            rcon.once('error', reject)
            rcon.connect()
        })
        this.status = async (userIp, attempt = 0) => {
            const status = await executeCommand('status')
            if (/Server\s*:\s+Inactive/i.test(status)) {
                await retry(++attempt, `Could not connect to server #${id}`)
                return this.status(userIp, attempt)
            }
            const [team1, team2] = (await Promise.all([
                await executeCommand('mp_teamname_1'),
                await executeCommand('mp_teamname_2'),
            ])).map(name => {
                const [, teamName] = name.match(/^mp_teamname_\d+ = (.+)$/i) ?? []
                return teamName
            })

            const [, name] = status.match(/^hostname\s*:\s*(.+)$/im) ?? []
            const [, connect] = status.match(/^udp\/ip\s*:\s*([\d.:]+)/im) ?? []
            const [map] = status.match(/(?:de_|cs_)\S+/i) ?? []
            const players = Array
                .from(status.matchAll(/^\s*\d+[^']+'([^']+)'/igm))
                .filter(([player]) => !player.includes('BOT'))
                .map(([player, name]) => {
                    const [, ip] = player.match(/(\d+\.\d+\.\d+\.\d+):\d+/i) ?? []
                    return {ip, name, active: ip === userIp}
                })
            return {name, connect, map, players, team1, team2}
        }
        this.listMaps = async () => {
            const maps = await executeCommand('maps *')
            return Array
                .from((maps.matchAll(/^\s*((?:de_|cs_)\w+)/img)))
                .map(([, map]) => map).filter(map => !map.endsWith('_vanity'))
        }
        this.setMap = async map => {
            const response = await executeCommand(`map ${map}`)
            if (response.includes('invalid map name')) {
                throw new Error('invalid map name')
            }
        }
        this.setTeamNames = async ({team1, team2}) => {
            await Promise.all([
                team1 !== undefined && await executeCommand(`mp_teamname_1 "${sanitizeTeamName(team1)}"`),
                team2 !== undefined && await executeCommand(`mp_teamname_2 "${sanitizeTeamName(team2)}"`),
            ])
        }
        this.restartGame = async () => await executeCommand('mp_restartgame 3')
        this.pauseGame = async () => await executeCommand('mp_pause_match')
        this.unpauseGame = async () => await executeCommand('mp_unpause_match')

        this.on = (event, listener) => eventEmitter.on(event, listener)
    }
}
