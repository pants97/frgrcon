<template>
    <div
        id="app"
        class="container"
    >
        <!-- Bootstrap Navbar -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container-fluid">
                <a
                    class="navbar-brand"
                    href="#"
                >Fraghouse</a>
                <button
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div
                    class="collapse navbar-collapse"
                    id="navbarNav"
                >
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <router-link
                                class="nav-link"
                                to="/"
                            >CS2 Servers
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main>
            <router-view />
            <div class="mw-100 text-center">
                <img
                    src="/fraghouse-logo.png"
                    width="1825"
                    height="1332"
                    alt="Fraghouse.at"
                    class="fraghouse-logo"
                />
            </div>
        </main>

        <!-- Bootstrap Footer -->
        <footer class="bg-dark text-white text-center py-3 mt-5">
            <div class="container">
                <p class="mb-0">Fraghouse CS2 Servers &copy; {{ new Date().getFullYear() }} ICH | pants</p>
            </div>
        </footer>
    </div>
</template>

<script>
export default {
    name: 'App',
    created() {
        // Subscribe to SSE events when the app is created
        this.$store.dispatch('subscribeToSSE')
    },
    beforeUnmount() {
        // Unsubscribe from SSE events when the app is unmounted
        this.$store.dispatch('unsubscribeFromSSE')
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: var(--bs-body-color);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
}

.fraghouse-logo {
    max-width: min(100%, 600px);
    height: auto;
}
</style>
