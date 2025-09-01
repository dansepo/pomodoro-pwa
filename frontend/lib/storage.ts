const isClient = typeof window !== "undefined"

export const storage = {
  /**
   * Retrieves a JSON object from localStorage.
   * @param key The key of the item to retrieve.
   * @param defaultValue The default value to return if the item doesn't exist or an error occurs.
   * @returns The parsed object or the default value.
   */
  getObject: <T>(key: string, defaultValue: T): T => {
    if (!isClient) return defaultValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : defaultValue
    } catch (error) {
      console.warn(`Error reading JSON from localStorage key "${key}":`, error)
      return defaultValue
    }
  },

  /**
   * Saves a JSON object to localStorage.
   * @param key The key of the item to save.
   * @param value The object to save.
   */
  setObject: <T>(key: string, value: T): void => {
    if (!isClient) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  },

  getString: (key: string, defaultValue: string): string => {
    if (!isClient) return defaultValue
    return window.localStorage.getItem(key) || defaultValue
  },

  setString: (key: string, value: string): void => {
    if (!isClient) return
    window.localStorage.setItem(key, value)
  },

  getBoolean: (key: string, defaultValue: boolean): boolean => {
    if (!isClient) return defaultValue
    const item = window.localStorage.getItem(key)
    return item ? item === 'true' : defaultValue
  },

  setBoolean: (key: string, value: boolean): void => {
    if (!isClient) return
    window.localStorage.setItem(key, String(value))
  },

  remove: (key: string): void => {
    if (!isClient) return
    window.localStorage.removeItem(key)
  },
}

