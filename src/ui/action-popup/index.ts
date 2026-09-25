import { i18n } from "@/utils/i18n"
import { notivue } from "@/utils/notifications"
import { pinia } from "@/utils/pinia"
import { appRouter } from "@/utils/router"
import { createApp, watch } from "vue"
import { getConvexClient } from "@/lib/convex"
import { hydrateCloudState } from "@/lib/cloudSync"
import { isAuthenticated, setupConvexAuth } from "@/lib/convexAuth"
import { startCloudSyncQueue } from "@/lib/cloudSyncQueue"
import { EXTENSION_STATE_CHANGED } from "@/platform/extensionState"
import App from "./app.vue"
import "@/ui/extension-tokens.css"
import "./index.scss"


appRouter.addRoute({
  path: "/",
  redirect: "/action-popup",
})

// router.beforeEach((to, from, next) => {
//   if (to.path === '/') {
//     return next('/action-popup')
//   }

//   next()
// })

const app = createApp(App).use(i18n).use(notivue).use(pinia).use(appRouter)

app.mount("#app")

async function restoreCloudPreferences() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined
  if (!convexUrl) return
  try {
    await setupConvexAuth(getConvexClient(), convexUrl)
    startCloudSyncQueue()
    const refreshFromCloud = async () => {
      try {
        await hydrateCloudState()
        window.dispatchEvent(new Event(EXTENSION_STATE_CHANGED))
      } catch {
        // Local extension preferences remain available when cloud sync is offline.
      }
    }
    const stopWatching = watch(isAuthenticated, (authenticated) => {
      if (!authenticated) return
      stopWatching()
      void refreshFromCloud()
    })
    if (isAuthenticated.value) {
      stopWatching()
      await refreshFromCloud()
    }
  } catch {
    // Local extension preferences remain available when cloud sync is offline.
  }
}

void restoreCloudPreferences()

export default app
