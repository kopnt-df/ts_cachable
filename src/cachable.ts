/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachedItem, UnsetCallback } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */


const OBFUSCATION_N = 128


/* ------------------------------------------------------- class: Cachable ------------------------------------------------------- */

export class Cachable<T> {

  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly localStorageSupported: boolean
  readonly key: string
  readonly obfuscationKey: number | undefined
  readonly unsetOnExpire: boolean

  maxCacheAgeMs: number | null
  debug: boolean
  unsetCallback?: UnsetCallback

  get value() { return this.get() }


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private localStorageExists: boolean
  private localStorage: Storage | null
  private cache?: CachedItem<T>

  private stringify: (value: CachedItem<T>) => string
  private parse: (value: string) => CachedItem<T> | undefined


  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    key: string,
    maxCacheAgeMs: number | undefined | null = 1000*60*60,
    defaultValue?: T,
    unsetCallback?: UnsetCallback,
    debug: boolean = false,

    stringify?: (value: CachedItem<T>) => string,
    parse?: (value: string) => CachedItem<T> | undefined,
    obfuscationKey?: number, // 0 - (OBFUSCATION_N-1)
    unsetOnExpire: boolean = true
  ) {
    this.key = key
    this.maxCacheAgeMs = maxCacheAgeMs
    this.unsetCallback = unsetCallback
    this.debug = debug
    this.obfuscationKey = obfuscationKey

    this.stringify = stringify !== undefined ? stringify : this._stringify
    this.parse = parse !== undefined ? parse : this._parse

    this.localStorageExists = typeof window !== 'undefined'
    this.localStorage = this.localStorageExists ? window.localStorage : null
    this.localStorageSupported = this.localStorageExists && this.localStorage != null

    this.unsetOnExpire = unsetOnExpire

    if (debug) console.log(`Local storage supported: ${this.localStorageSupported}`)
    var hasValue = true

    if (!this.load()) {
      hasValue = false

      if (debug) console.log(`Could not load value for key '${key}' on init`)
    } else if (this.isExpired() && this.unsetOnExpire) {
      this.localStorage.removeItem(this.key)
      this.cache = undefined

      if (this.unsetCallback !== undefined) this.unsetCallback(this.key)
    }

    if (!hasValue && defaultValue !== undefined) {
      if (debug) console.log(`Setting default value for key '${key}'`)

      this.set(defaultValue)
    }
  }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  set(value?: T | undefined | null): boolean {
    if (value != null) {
      this.cache = {
        lastSaveMs: Date.now(),
        value: value
      }

      if (this.localStorage !== null) {
        var cacheStr = this.stringify(this.cache)
        if (this.obfuscationKey !== undefined && this.obfuscationKey < 0 && this.obfuscationKey < OBFUSCATION_N) {
          cacheStr = obfs(btoa(cacheStr), this.obfuscationKey, OBFUSCATION_N)
        }
  
        this.localStorage.setItem(this.key, cacheStr)
      }
    } else {
      this.cache = undefined

      if (this.localStorage !== null) {
        this.localStorage.removeItem(this.key)
      }
    }

    return true
  }

  get(): T | undefined {
    if (this.cache === undefined) return undefined

    if (this.isExpired() && this.unsetOnExpire) {
      this.localStorage.removeItem(this.key)
      this.cache = undefined

      if (this.unsetCallback !== undefined) this.unsetCallback(this.key)

      return undefined
    }

    return this.cache.value
  }

  load(): boolean {
    if (this.localStorage != null) {
      var cacheStr = this.localStorage.getItem(this.key)

      if (typeof cacheStr === 'string') {
        if (this.obfuscationKey !== undefined && this.obfuscationKey < 0 && this.obfuscationKey < OBFUSCATION_N) {
          cacheStr = atob(defs(cacheStr, this.obfuscationKey, OBFUSCATION_N))
        }

        this.cache = this.parse(cacheStr)

        return true
      }
    }

    return false
  }

  cacheAgeMs(): number {
    return Date.now() - this.cache.lastSaveMs
  }

  isExpired(): boolean {
    if (this.cache === undefined) return false
    if (this.maxCacheAgeMs == null) return false

    return Date.now() - this.cache.lastSaveMs > this.maxCacheAgeMs
  }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  // Helpers

  _parse: (value: string) => CachedItem<T> | undefined = (value: string) => {
    try {
      const parsedValue = JSON.parse(value)

      return parsedValue != null ? parsedValue : undefined
    } catch (err) {
      if (this.debug) console.log(err)

      return undefined
    }
  }

  _stringify: (value: CachedItem<T>) => string = (value: CachedItem<T>) => {
    return JSON.stringify(value)
  }
}


function obfs(
  str: string,
  key: number,
  n:   number = 126
) {
  if (!(typeof key === 'number' && key % 1 === 0)) {
    return str
  }

  var chars = str.split('')

  for (var i = 0; i < chars.length; i++) {
    var c = chars[i].charCodeAt(0)

    if (c <= n) {
      chars[i] = String.fromCharCode((c + key) % n)
    }
  }

  return chars.join('')
}

function defs(
  str: string,
  key: number,
  n:   number = 126
) {
  if (!(typeof key === 'number' && key % 1 === 0)) {
    return str
  }

  return obfs(str, n - key, n)
}