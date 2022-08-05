/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachedItem, UnsetCallback } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ------------------------------------------------------- class: Cachable ------------------------------------------------------- */

export class Cachable<T> {

  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    key: string,
    maxCacheAgeMs: number | null = 1000*60*60,
    defaultValue?: T,
    unsetCallback?: UnsetCallback,
    debug: boolean = false
  ) {
    this.key = key
    this.maxCacheAgeMs = maxCacheAgeMs
    this.unsetCallback = unsetCallback
    this.debug = debug

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

  maxCacheAgeMs: number | null
  debug: boolean
  unsetCallback?: UnsetCallback

  get value() { return this.get() }


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private cache?: CachedItem<T>

  private localStorageExists: boolean
  private localStorage: Storage | null


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  set(value: T): boolean {
    this.cache = {
      lastSaveMs: Date.now(),
      value: value
    }

    if (this.localStorage !== null) {
      if (this.debug) console.log(`Saving value for key '${this.key}'`)

      this.localStorage.setItem(this.key, JSON.stringify(this.cache))

      return true
    }

    return false
  }

  get(): T | undefined { return this.cache !== undefined && !this.unsetIfNeeded() ? this.cache.value : undefined }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private unsetIfNeeded(): boolean {
    if (this.cache !== undefined && this.maxCacheAgeMs != null) {
      const cacheAgeMs = Date.now() - this.cache.lastSaveMs

      if (cacheAgeMs > this.maxCacheAgeMs) {
        if (this.debug) console.log(`Removing value for key '${this.key}' (Reason: too old (Age ms: '${cacheAgeMs}' > Age ms: '${this.maxCacheAgeMs}))`)

        if (this.unsetCallback !== undefined) this.unsetCallback(this.key)

        return true
      }
    }

    return false
  }

  private load (): boolean {
    if (this.localStorage != null) {
      let cacheStr = this.localStorage.getItem(this.key)

      if (typeof cacheStr === 'string') {
        const _cache = JSON.parse(cacheStr)
        this.cache = _cache != null ? _cache : undefined

        return true
      }
    }

    return false
  }
}