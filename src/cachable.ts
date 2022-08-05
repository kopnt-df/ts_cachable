/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachedItem, UnsetCallback } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ------------------------------------------------------- class: Cachable ------------------------------------------------------- */

export class Cachable<T> {

  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    key: string,
    maxCacheAgeMs: number = 1000*60*60,
    defaultValue?: T | null,
    unsetCallback?: UnsetCallback | null,
    debug: boolean = false
  ) {
    this.key = key
    this.maxCacheAgeMs = maxCacheAgeMs
    this.unsetCallback = unsetCallback
    this.debug = debug

    this.cache = null

    this.localStorageSupported = this.localStorageExists && this.localStorage != null

    if (debug) console.log(`Local storage supported: ${this.localStorageSupported}`)
    var hasValue = true

    if (!this.load()) {
      hasValue = false

      if (debug) console.log(`Could not load value for key '${key}' on init`)
    } else if (this.unsetIfNeeded()) {
      hasValue = false
    }

    if (!hasValue && defaultValue) {
      if (debug) console.log(`Setting default value for key '${key}'`)

      this.set(defaultValue)
    }

    console.log('hasValue', hasValue)
    console.log('this.cache', this.cache)
  }


  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly localStorageSupported: boolean
  readonly key: string

  maxCacheAgeMs: number
  debug: boolean
  unsetCallback?: UnsetCallback

  get value() { return this.get() }


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private cache: CachedItem<T>

  private get localStorageExists(): boolean { return typeof window !== 'undefined' }
  private get localStorage(): Storage { return this.localStorageExists ? window['localStorage'] : undefined }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  set(value: T) {
    this.cache = {
      lastSaveMs: Date.now(),
      value: value
    }

    if (this.localStorageSupported) {
      if (this.debug) console.log(`Saving value for key '${this.key}'`)

      this.localStorage.setItem(this.key, JSON.stringify(value))
    }
  }

  get(): T | null { return this.cache != null && !this.unsetIfNeeded() ? this.cache.value : null }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private unsetIfNeeded(): boolean {
    if (this.cache && this.maxCacheAgeMs != null) {
      const cacheAgeMs = Date.now() - this.cache.lastSaveMs

      if (cacheAgeMs > this.maxCacheAgeMs) {
        if (this.debug) console.log(`Removing value for key '${this.key}' (Reason: too old (Age ms: '${cacheAgeMs}' > Age ms: '${this.maxCacheAgeMs}))`)

        if (this.unsetCallback) this.unsetCallback(this.key)

        return true
      }
    }

    return false
  }

  private load (): boolean {
    if (this.localStorageSupported) {
      this.cache = JSON.parse(window['localStorage'].getItem(this.key))

      return true
    }

    return false
  }
}