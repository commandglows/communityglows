import { i18n } from "@/utils/i18n"
import { notivue } from "@/utils/notifications"
import { pinia } from "@/utils/pinia"
import { appRouter } from "@/utils/router"
import { createApp } from "vue"
import App from "./app.vue"
import "@/ui/extension-tokens.css"
import "./index.scss"


appRouter.addRoute({
  path: "/",
  redirect: "/side-panel",
})

const app = createApp(App).use(i18n).use(notivue).use(pinia).use(appRouter)

app.mount("#app")

export default app
