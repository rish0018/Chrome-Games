const memory = new Map<string, string>()

/** localStorage can throw (private windows, blocked site data); fall back to memory so the app keeps working. */
export function readJson<T>(key: string, validate: (value: unknown) => value is T): T | null {
  let raw: string | null | undefined
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    raw = memory.get(key)
  }
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  try {
    window.localStorage.setItem(key, raw)
  } catch {
    memory.set(key, raw)
  }
}

export function removeKey(key: string): void {
  memory.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // storage unavailable; the in-memory copy is already cleared
  }
}
