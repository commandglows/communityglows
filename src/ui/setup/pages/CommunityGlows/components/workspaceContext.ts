import type { InjectionKey, Ref } from 'vue'

export const workspaceWebviewsSuspendedKey: InjectionKey<
  Readonly<Ref<boolean>>
> = Symbol('workspaceWebviewsSuspended')
