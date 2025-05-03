<template>
    <div class="container mt-4">
        <div class="row">
            <div class="col-12 text-center mb-4">
                <h1 class="display-4">CS2 Servers</h1>
                <div
                    v-if="busy"
                    class="d-flex justify-content-center my-3"
                >
                    <div
                        class="spinner-border text-light"
                        role="status"
                    >
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div
                class="col-md-6 col-lg-4 mb-3"
                v-for="{id} in servers"
                :key="id"
            >
                <server-list-item :server-id="id" />
            </div>
            <div
                v-if="servers.length === 0 && !busy"
                class="col-12 text-center"
            >
                <div class="alert alert-info">No servers available</div>
            </div>
        </div>
    </div>
</template>

<script>
import ServerListItem from '../components/ServerListItem.vue'

export default {
    name: 'HomeView',
    data() {
        return {
            busy: false,
        }
    },
    computed: {
        servers() {
            return this.$store.getters.servers
        },
    },
    mounted() {
        this.busy = true
        this.$store
            .dispatch('loadServers')
            .then(servers => Promise.all(servers.map(({id}) => this.$store.dispatch('loadServerStatus', id))))
            .finally(() => this.busy = false)
    },
    components: {
        ServerListItem,
    },
}
</script>
