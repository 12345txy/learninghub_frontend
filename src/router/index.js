import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginRegister from '../views/LoginRegister.vue'
import FrontPage from '../views/FrontPage.vue'
// import CommunityView from '../views/CommunityView.vue'
import CommunityView_copy from '../views/CommunityView_copy.vue'
import UserProfile from '../views/UserProfile.vue'

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
    name: 'CommunityView_copy',
    component: CommunityView_copy
  },
  {
    path: '/profile/:id',
    name: 'UserProfile',
    component: UserProfile
  },
  // {
  //   path: '/community/:id',
  //   name: 'CommunityView',
  //   component: CommunityView
  // },
  // {
  //   path: '/community/:id/check-in',
  //   name: 'CheckInView',
  //   component: CheckInView
  // },
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
