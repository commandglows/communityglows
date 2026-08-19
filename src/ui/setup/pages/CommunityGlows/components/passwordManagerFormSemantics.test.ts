import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from '@vue/compiler-sfc'

const componentUrl = (path: string) => new URL(path, import.meta.url)

function sourceOf(path: string): string {
  return readFileSync(componentUrl(path), 'utf8')
}

function templateOf(path: string): string {
  const parsed = parse(sourceOf(path), { filename: path })
  expect(parsed.errors).toEqual([])
  return parsed.descriptor.template?.content ?? ''
}

describe('password manager form semantics', () => {
  it('keeps the LoginView account fields stable while changing the password purpose by mode', () => {
    const source = sourceOf('../views/LoginView.vue')
    const template = templateOf('../views/LoginView.vue')

    expect(template).toContain('name="email"')
    expect(template).toContain('autocomplete="username"')
    expect(template).toContain('inputmode="email"')
    expect(template).toContain('autocapitalize="none"')
    expect(template).toContain('spellcheck="false"')
    expect(template).toContain('name="password"')
    expect(template).toContain(':autocomplete="passwordAutocomplete"')
    expect(source).toContain("isSignUp.value ? 'new-password' : 'current-password'")
  })

  it('gives the mobile and desktop SignupNudge forms identical sign-up semantics', () => {
    const template = templateOf('./SignupNudge.vue')

    expect(template.match(/name="email"/g)).toHaveLength(2)
    expect(template.match(/autocomplete="username"/g)).toHaveLength(2)
    expect(template.match(/name="password"/g)).toHaveLength(2)
    expect(template.match(/autocomplete="new-password"/g)).toHaveLength(2)
    expect(template.match(/inputmode="email"/g)).toHaveLength(2)
    expect(template.match(/autocapitalize="none"/g)).toHaveLength(2)
    expect(template.match(/spellcheck="false"/g)).toHaveLength(4)
  })

  it('forwards semantic attributes and input events to the native inputs', () => {
    const inputSource = sourceOf('./ui/SgInput.vue')
    const passwordSource = sourceOf('./ui/SgPassword.vue')

    expect(inputSource).toContain('defineOptions({ inheritAttrs: false })')
    expect(inputSource).toContain('v-bind="attrs"')
    expect(passwordSource).toContain('v-bind="safeAttrs"')
    expect(passwordSource).toContain("name !== 'class' && name !== 'style'")
    expect(passwordSource).toContain("@input=\"$emit('update:modelValue'")
  })
})
