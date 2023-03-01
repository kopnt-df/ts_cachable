/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachedItem, IUnsetCallback } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */


const OBFUSCATION_N = 128


/* ------------------------------------------------------- class: Cachable ------------------------------------------------------- */

export class Cachable<T> {

  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    key: string,
    maxCacheAgeMs: number | null = 1000*60*60,
    defaultValue?: T,
    unsetCallbackObj?: IUnsetCallback,
    debug: boolean = false,

    stringify?: (value: CachedItem<T>) => string,
    parse?: (value: string) => CachedItem<T> | undefined,
    obfuscationKey?: number // 0 - (OBFUSCATION_N-1)
  ) {
    this.key = key
    this.maxCacheAgeMs = maxCacheAgeMs
    this.unsetCallbackObj = unsetCallbackObj
    this.debug = debug
    this.obfuscationKey = obfuscationKey

    this.stringify = stringify !== undefined ? stringify : this._stringify
    this.parse = parse !== undefined ? parse : this._parse

    this.localStorageExists = typeof window !== 'undefined'
    this.localStorage = this.localStorageExists ? window.localStorage : null
    this.localStorageSupported = this.localStorageExists && this.localStorage != null

    if (debug) console.log(`Local storage supported: ${this.localStorageSupported}`)
    var hasValue = true

    if (!this.load()) {
      hasValue = false

      if (debug) console.log(`Could not load value for key '${key}' on init`)
    } else if (this.unsetIfNeeded()) {
      hasValue = false
    }

    if (!hasValue && defaultValue !== undefined) {
      if (debug) console.log(`Setting default value for key '${key}'`)

      this.set(defaultValue)
    }
  }


  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly localStorageSupported: boolean
  readonly key: string
  readonly obfuscationKey: number | undefined

  maxCacheAgeMs: number | null
  debug: boolean
  unsetCallbackObj?: IUnsetCallback

  get value() { return this.get() }


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private cache?: CachedItem<T>

  private localStorageExists: boolean
  private localStorage: Storage | null

  private stringify: (value: CachedItem<T>) => string
  private parse: (value: string) => CachedItem<T> | undefined


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  set(value?: T | undefined | null): boolean {
    this.cache = {
      lastSaveMs: Date.now(),
      value: value
    }

    if (this.localStorage !== null) {
      if (this.debug) console.log(`Saving value for key '${this.key}'`)

      if (value != null) {
        var cacheStr = this.stringify(this.cache)
        if (this.obfuscationKey !== undefined && this.obfuscationKey < 0 && this.obfuscationKey < OBFUSCATION_N) {
          cacheStr = obfs(btoa(cacheStr), this.obfuscationKey, OBFUSCATION_N)
        }

        this.localStorage.setItem(this.key, cacheStr)
      } else this.localStorage.removeItem(this.key)

      return true
    }

    return false
  }

  get(): T | undefined { return this.cache !== undefined && !this.unsetIfNeeded() ? this.cache.value : undefined }

  load (): boolean {
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


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private unsetIfNeeded(): boolean {
    if (this.cache !== undefined && this.maxCacheAgeMs != null) {
      const cacheAgeMs = Date.now() - this.cache.lastSaveMs

      if (cacheAgeMs > this.maxCacheAgeMs) {
        if (this.debug) console.log(`Removing value for key '${this.key}' (Reason: too old (Age ms: '${cacheAgeMs}' > Age ms: '${this.maxCacheAgeMs}))`)
        if (this.unsetCallbackObj !== undefined) this.unsetCallbackObj.unsetCallback(this.key)

        return true
      }
    }

    return false
  }

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