import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginRegister from '../views/LoginRegister.vue'
import FrontPage from '../views/FrontPage.vue'
import CommunityView from '../views/CommunityView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/LoginRegister',
    name: 'LoginRegister',
    component: LoginRegister
  },
  {
    path: '/FrontPage',
    name: 'FrontPage',
    component: FrontPage
  },
  {
    path: '/community/:id',
    name: 'CommunityView',
    component: CommunityView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
