<template>
    <div
        class="card btn btn-primary mb-3"
        :class="isPlayer && 'bg-primary'"
        @click="showServer"
    >
        <div class="card-body">
            <h5 class="card-title">{{ name }}</h5>
            <p class="card-text">
                <span
                    v-if="map"
                    class="badge text-bg-primary me-2"
                >
                    {{ map }}
                </span>
                <span class="badge text-bg-success">{{ playersCount }} players</span>
            </p>
            <div
                v-if="busy"
                class="spinner-border text-light"
                role="status"
            >
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'server-list-item',
    props: {
        serverId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            busy: false,
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
            return this.status?.players
        },
        playersCount() {
            return this.players?.length ?? 0
        },
        isPlayer() {
            return !!this.players?.some(({active}) => active)
        },
    },
    methods: {
        showServer() {
            this.$router.push({
                name: 'server',
                params: {serverId: this.serverId},
            })
        },
    },
}
</script>

<style scoped>

</style>
