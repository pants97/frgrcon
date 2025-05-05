<template>
    <div class="p-3">
        <div
            class="card mb-3"
            @click="showServer"
        >
            <button
                class="btn btn-link"
                @click="showServers"
            >
                Zur&uuml;ck
            </button>
            <div
                class="card-body p-0 d-flex flex-column"
            >
                <div class="card-header d-flex justify-content-between p-3">
                    <span
                        v-if="map"
                        class="badge d-flex align-items-center text-bg-secondary me-2"
                    >
                        {{ map }}
                    </span>
                    <h5 class="card-title d-flex align-items-center m-0">
                        {{ name }}
                    </h5>
                    <div
                        class="header-end position-relative d-flex align-items-center"
                        :class="busy && 'busy'"
                    >
                        <a
                            v-if="!isPlayer"
                            class="connect-button btn btn-success"
                            :href="`steam://connect/${connect}`"
                        >
                            click to join server
                        </a>
                        <button
                            v-else
                            class="connect-button btn"
                            :class="copied ? 'btn-success' : 'btn-dark'"
                            @click="copy"
                        >
                            <template v-if="copied">✔</template>
                            {{ connect }}
                        </button>
                        <div class="loading-spinner d-flex align-items-center justify-content-center px-4">
                            <div
                                class="spinner-grow spinner-grow-sm text-light"
                                role="status"
                            >
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    class="p-3 d-flex"
                >
                    <div
                        v-if="isPlayer"
                        class="badge bg-success w-100"
                    >
                        connected to server
                    </div>
                    <div
                        v-else
                        class="badge bg-danger w-100"
                    >
                        not connected to server
                    </div>
                </div>
                <div
                    class="row align-items-center p-3"
                    style="row-gap: .5rem;"
                >
                    <div class="col col-12 col-sm-6 col-lg-4 d-flex">
                        <button
                            type="button"
                            class="btn btn-danger d-block w-100"
                            :disabled="!isPlayer"
                            @click="restartGame"
                        >
                            restart
                        </button>
                    </div>
                    <div class="col col-12 col-sm-6 col-lg-4 d-flex">
                        <button
                            type="button"
                            class="btn btn-secondary d-block w-100"
                            :disabled="!isPlayer"
                            @click="pauseGame"
                        >
                            pause game
                        </button>
                    </div>
                    <div class="col col-12 col-sm-6 col-lg-4 d-flex">
                        <button
                            type="button"
                            class="btn btn-secondary d-block w-100"
                            :disabled="!isPlayer"
                            @click="unpauseGame"
                        >
                            un-pause game
                        </button>
                    </div>
                </div>
                <div
                    class="map-bg d-flex flex-column p-3"
                    style="gap: .5rem;"
                >
                    <div
                        class="row"
                        style="row-gap: 1rem;"
                    >
                        <div
                            class="col d-flex flex-column"
                            style="gap: 1rem;"
                        >
                            <form
                                class="d-flex flex-column"
                                style="gap: .5rem;"
                            >
                                <fieldset>
                                    <label
                                        for="map"
                                        class="form-label"
                                    >
                                        Map:
                                    </label>
                                    <select
                                        name="map"
                                        v-model="selectedMap"
                                        :disabled="!isPlayer || busy"
                                        class="form-control form-select"
                                    >
                                        <option
                                            v-for="(name, index) in mapItems"
                                            :key="index"
                                            :selected="map === name"
                                        >
                                            {{ name }}
                                        </option>
                                    </select>
                                </fieldset>
                                <button
                                    type="button"
                                    :disabled="!isPlayer || selectedMap === map"
                                    class="btn d-block w-100"
                                    :class="selectedMap !== map ? 'btn-success' : 'btn-dark'"
                                    @click="setMap"
                                >
                                    set map
                                </button>
                            </form>
                            <div
                                class="d-flex flex-column"
                                style="gap: .5rem"
                            >
                                <div class="form-group">
                                    Team Names:
                                </div>
                                <div
                                    class="card d-flex form-group p-3"
                                    style="gap: .5rem"
                                >
                                    <label for="team1">Counter-Terrorists</label>
                                    <div class="input-group">
                                        <input
                                            v-model="teamName1"
                                            type="text"
                                            name="team1"
                                            placeholder="Counter-Terrorists"
                                            :disabled="!isPlayer"
                                            class="form-control"
                                        />
                                        <div class="input-group-append">
                                            <button
                                                type="button"
                                                class="btn border input-group-text"
                                                :disabled="!isPlayer || teamName1 === status?.team1"
                                                :class="teamName1 === status?.team1 ? 'btn-dark' : 'btn-success'"
                                                @click="setTeamName1"
                                            >
                                                update
                                            </button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="team2">Terrorists</label>
                                        <div class="input-group">
                                            <input
                                                v-model="teamName2"
                                                type="text"
                                                name="team2"
                                                placeholder="Terrorists"
                                                :disabled="!isPlayer"
                                                class="form-control"
                                            />
                                            <div class="input-group-append">
                                                <button
                                                    type="button"
                                                    class="btn border input-group-text"
                                                    :disabled="!isPlayer || teamName2 === status?.team2"
                                                    :class="teamName2 === status?.team2 ? 'btn-dark' : 'btn-success'"
                                                    @click="setTeamName2"
                                                >
                                                    update
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="form-label">Players:</div>
                                <ul class="list-group">
                                    <li
                                        v-if="!players.length"
                                        class="list-group-item bg-transparent text-muted"
                                    >
                                        No players connected.
                                    </li>
                                    <li
                                        v-for="({name, ip, active}, index) in players"
                                        :key="index"
                                        class="list-group-item d-flex align-items-baseline justify-content-between"
                                        :class="active && 'bg-primary border-primary'"
                                    >
                                        <span>{{ name }}</span>
                                        <small>{{ ip }}</small>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div
                            v-if="map"
                            class="col col-12 col-lg-auto"
                        >
                            <div class="map-image rounded">
                                <img
                                    :src="`/cs2/${map}.png`"
                                    :alt="map"
                                    class="border rounded"
                                />
                                <span class="map-label">{{ map }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button
                class="btn btn-link"
                @click="showServers"
            >
                Zur&uuml;ck
            </button>

        </div>
    </div>
</template>

<script>
export default {
    name: 'server-view',
    props: {
        serverId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            busy: false,
            copied: false,
            copiedTimeoutId: null,
            selectedMap: '',
            teamName1: '',
            teamName2: '',
        }
    },
    computed: {
        status() {
            return this.$store.getters.serverStatus(this.serverId)
        },
        name() {
            return this.status?.name
        },
        connect() {
            return this.status?.connect
        },
        map() {
            return this.status?.map
        },
        players() {
            return this.status?.players ?? []
        },
        mapItems() {
            return this.$store.getters.serverMaps(this.serverId)
        },
        mapUrl() {
            return this.map && `url('/cs2/${this.map}.png')`
        },
        isPlayer() {
            return this.players.some(({active}) => active)
        },
    },
    methods: {
        setMap() {
            this.busy = true
            this.$store
                .dispatch('setMap', {serverId: this.serverId, map: this.selectedMap})
                // .then(this.reloadStatus)
                .finally(() => this.busy = false)
        },
        restartGame() {
            this.busy = true
            this.$store
                .dispatch('restartGame', this.serverId)
                .finally(() => this.busy = false)
        },
        pauseGame() {
            this.busy = true
            this.$store
                .dispatch('pauseGame', this.serverId)
                .finally(() => this.busy = false)
        },
        unpauseGame() {
            this.busy = true
            this.$store
                .dispatch('unpauseGame', this.serverId)
                .finally(() => this.busy = false)
        },
        setTeamNames(model) {
            this.busy = true
            this.$store
                .dispatch('setTeamNames', {...model, serverId: this.serverId})
                // .then(this.reloadStatus)
                .finally(() => this.busy = false)
        },
        setTeamName1() {
            this.setTeamNames({team1: this.teamName1})
        },
        setTeamName2() {
            this.setTeamNames({team2: this.teamName2})
        },
        showServers() {
            this.$router.push({
                name: 'home',
            })
        },
        async copy() {
            await navigator.clipboard.writeText(this.connect)
            this.copied = true
            clearTimeout(this.copiedTimeoutId)
            this.copiedTimeoutId = setTimeout(() => {
                this.copied = false
            }, 3000)
        },
    },
    mounted() {
        this.busy = true
        this.$store
            .dispatch('loadServerStatus', this.serverId)
            .then(status => {
                if (status) {
                    const {map, team1, team2} = status
                    this.teamName1 = team1
                    this.teamName2 = team2
                    this.selectedMap = map ?? null
                }
                return this.$store.dispatch('loadServerMaps', this.serverId)
            })
            .finally(() => this.busy = false)
    },
}
</script>

<style scoped>
.map-bg {
    --bg-image-url: v-bind(mapUrl);

    background-color: rgb(33, 37, 41, .9); /* Desired opacity */
    background-image: var(--bg-image-url);
    background-blend-mode: overlay; /* Other modes like multiply, screen, darken, etc. */
    background-size: cover;
    background-position: center;
}

.map-image {
    position: relative;
    text-align: center;
    background: rgb(33, 37, 41);
}

.map-image img {
    width: 100%;
    max-width: 400px;
    object-fit: contain;
}

.map-image .map-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: .5rem;
    background-color: rgba(0, 0, 0, .5);
    color: #fff;
    font-size: 1.2rem;
    font-weight: bold;
}

.loading-spinner {
    position: absolute;
    right: 0;
    opacity: 0;
    transition: opacity .3s ease;
}

.connect-button {
    opacity: 1;
    transition: opacity .3s ease;
}

.header-end.busy .loading-spinner {
    opacity: 1 !important;
}

.header-end.busy .connect-button {
    opacity: 0 !important;
}
</style>
