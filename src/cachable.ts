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

  // private get localStorageExists(): boolean { return typeof window !== 'undefined' }
  // private get localStorage(): Storage | undefined { return this.localStorageExists ? window.localStorage : undefined }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  set(value: T): boolean {
    this.cache = {
      lastSaveMs: Date.now(),
      value: value
    }

    if (this.localStorage !== null) {
      if (this.debug) console.log(`Saving value for key '${this.key}'`)

      this.localStorage.setItem(this.key, JSON.stringify(value))

      return true
    }

    return false
  }

  get(): T | null { return this.cache != null && !this.unsetIfNeeded() ? this.cache.value : null }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private unsetIfNeeded(): boolean {
    if (this.cache && this.maxCacheAgeMs != null) {
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
        this.cache = JSON.parse(cacheStr)

        return true
      }
    }

    return false
  }
}