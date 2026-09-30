export function forwardedComponentAttrs(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([name]) => name !== 'class' && name !== 'style',
    ),
  )
}

export function componentClasses(
  baseClass: string,
  attrs: Record<string, unknown>,
): unknown[] {
  return [baseClass, attrs.class]
}
