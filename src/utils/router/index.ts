import { createRouter, createWebHashHistory } from 'vue-router'

// Only public extension entry pages belong to this router. Desktop components
// are not routes and must not be emitted into the browser package.
export const appRouter = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/action-popup', component: () => import('@/ui/action-popup/pages/index.vue') },
    { path: '/side-panel', component: () => import('@/ui/side-panel/pages/index.vue') },
    { path: '/options-page', component: () => import('@/ui/options-page/pages/index.vue') },
    { path: '/setup/install', component: () => import('@/ui/setup/pages/install.vue') },
    { path: '/setup/update', component: () => import('@/ui/setup/pages/update.vue') },
    { path: '/setup/CommunityGlows', component: () => import('@/ui/setup/pages/CommunityGlows.vue') },
    { path: '/setup/tasks', component: () => import('@/ui/setup/pages/tasks.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/setup/CommunityGlows' },
  ],
})
