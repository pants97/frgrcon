import {createStore} from 'vuex'
import {StoreLoader} from './StoreLoader'

const loader = new StoreLoader()
export default createStore({
    state: {
        servers: [],
        serverStatuses: new Map(),
        serverMaps: new Map(),
    },
    mutations: {
        setServers(state, servers) {
            state.servers = servers
        },
        setServerStatus(state, {serverId, status}) {
            state.serverStatuses = new Map([
                ...state.serverStatuses.entries(),
                [serverId, status],
            ])
        },
        setServerMaps(state, {serverId, maps}) {
            state.serverMaps = new Map([
                ...state.serverMaps.entries(),
                [serverId, maps],
            ])
        },
    },
    actions: {
        loadServers: ({commit}) => loader
            .load('/api/cs', async url => {
                try {
                    const response = await fetch(url)
                    const servers = await response.json()
                    commit('setServers', servers)
                    return servers
                } catch (error) {
                    console.error('Error fetching servers', error)
                }
            })
            .catch(console.error),
        async loadServerStatus({commit}, serverId) {
            try {
                const response = await fetch(`/api/cs/${serverId}`)
                const status = await response.json()
                commit('setServerStatus', {serverId, status})
                return status
            } catch (error) {
                console.error('Error fetching servers status', error)
            }
        },
        async loadServerMaps({commit}, serverId) {
            try {
                const response = await fetch(`/api/cs/${serverId}/maps`)
                const maps = await response.json()
                commit('setServerMaps', {serverId, maps})
                return maps
            } catch (error) {
                console.error('Error fetching servers status', error)
            }
        },
        async setMap(_store, {serverId, map}) {
            try {
                return await fetch(`/api/cs/${serverId}/game/map`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({map}),
                })
            } catch (error) {
                console.error('Error setting server map:', error)
            }
        },
        async restartGame(_store, serverId) {
            try {
                return await fetch(`/api/cs/${serverId}/game/restart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            } catch (error) {
                console.error('Error restarting game:', error)
            }
        },
        async pauseGame(_store, serverId) {
            try {
                return await fetch(`/api/cs/${serverId}/game/pause`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            } catch (error) {
                console.error('Error restarting game:', error)
            }
        },
        async unpauseGame(_store, serverId) {
            try {
                return await fetch(`/api/cs/${serverId}/game/unpause`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            } catch (error) {
                console.error('Error restarting game:', error)
            }
        },
        async setTeamNames(_store, {serverId, ...teamNames}) {
            try {
                return await fetch(`/api/cs/${serverId}/game/teams`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(teamNames),
                })
            } catch (error) {
                console.error('Error setting team names:', error)
            }
        },
    },
    getters: {
        servers: state => state.servers,
        serverStatus: state => serverId => state.serverStatuses.get(serverId),
        serverMaps: state => serverId => state.serverMaps.get(serverId) ?? [],
    },
})
