import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ServerView from '../views/ServerView.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView,
    },
    {
        path: '/cs/:serverId(\\d+)/',
        name: 'server',
        props: (({params: {serverId}}) => ({serverId: Number.parseInt(serverId)})),
        component: ServerView,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
