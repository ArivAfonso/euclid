import { createRouter, createWebHistory, createWebHashHistory, RouteRecordRaw } from "vue-router";

type RouteRecordRaw = typeof RouteRecordRaw
// Static routes
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/home",
    component: () => import("@/views/Home/index.vue"),
    meta: {
      hidden: true,
      title: 'Euclid'
    },
  },
  {
    path: "/projects",
    component: () => import("@/views/Projects/index.vue"),
    meta: {
      hidden: true,
      title: 'Euclid'
    },
  },
  {
    path: "/",
    redirect: "/projects",
  },
  {
    path: "/editor",
    name: "editor",
    component: () => import("@/views/Editor/index.vue"),
    meta: {
      title: 'Euclid'
    },
  },
  {
    path: "/404",
    component: () => import("@/views/Error/404.vue"),
    meta: { hidden: true },
  },
];

/**
 * Create router
 * In Electron, we MUST use hash history because file:// protocol doesn't
 * support HTML5 history mode (the URL pathname is the full filesystem path,
 * not a route path). We detect Electron at runtime via the preload bridge.
 * During dev (electron-vite dev) Vite sets MODE='electron', but during
 * production build MODE='production', so MODE alone isn't reliable.
 */
const isElectronRuntime = typeof window !== 'undefined' && !!(window as any).electron;

const router = createRouter({
  history: isElectronRuntime ? createWebHashHistory() : createWebHistory(),
  routes: constantRoutes,
  // Restore scroll position on refresh
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

router.beforeResolve((to: any, from: any, next: any) => {
  window.document.title = to.meta.title
  next()
})

/**
 * Reset router
 */
export const resetRouter = () => {
  router.replace({ path: "/" });
}

export default router;
