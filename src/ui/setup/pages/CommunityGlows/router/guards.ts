import type { NavigationGuard } from "vue-router";
import {
  authBootstrapError,
  isAuthenticated,
  isAuthLoading,
  isSessionLocked,
} from "@/lib/convexAuth";

export const authGuard: NavigationGuard = async (to, _from, next) => {
  if (to.meta.lockScreen) {
    if (!isAuthenticated.value && !isAuthLoading.value) {
      return next("/login");
    }
    return next();
  }

  // Public routes — always allow
  if (to.path === "/login" || to.path === "/sign-up") {
    // If already signed in, skip the login page
    if (isAuthenticated.value && !isAuthLoading.value && !isSessionLocked.value) {
      return next("/twitter");
    }
    return next();
  }

  if (to.meta.requiresAuth) {
    if (authBootstrapError.value) {
      return next({
        path: "/login",
        query: { access: "unavailable" },
      });
    }

    // Still loading auth state — block private navigation until resolved
    if (isAuthLoading.value) {
      return next({
        path: "/login",
        query: { access: "loading" },
      });
    }

    if (!isAuthenticated.value) {
      return next({
        path: "/login",
        query: { access: "required", destination: typeof to.meta.title === "string" ? to.meta.title : to.name?.toString() ?? "cet espace" },
      });
    }

    if (isSessionLocked.value) {
      return next("/session-lock");
    }
  }

  next();
};
