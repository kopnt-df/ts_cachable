/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { CachedItem } from './cachedItem'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ------------------------------------------------------- class: Cachable ------------------------------------------------------- */

export class Cachable<T> {

    /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

    constructor(
        key: string,
        maxCacheAgeMs: number = 1000*60*60,
        debug: boolean = false,
        defaultValue?: T
    ) {
        this.key = key
        this.maxCacheAgeMs = maxCacheAgeMs
        this.debug = debug

        this.localStorageSupported = this.localStorage != null

        if (debug) console.log(`Local storage supported: ${this.localStorageSupported}`)

        if (!this.load()) {
            if (debug) console.log(`Could not load value for key '${key}' on init`)

            if (defaultValue) {
                if (debug) console.log(`Setting default value for key '${key}'`)

                this.set(defaultValue)
            }
        }
    }


    /* --------------------------------------------------- Public properties -------------------------------------------------- */

    readonly localStorageSupported: boolean
    readonly key: string

    maxCacheAgeMs: number
    debug: boolean

    get value() { return this.get() }


    /* -------------------------------------------------- Private properties -------------------------------------------------- */

    private cache: CachedItem<T>

    private get localStorage(): Storage { return window['localStorage'] }


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

    get(): T | null {
        if (this.cache != null) {
            const cacheAgeMs = Date.now() - this.cache.lastSaveMs

            if (cacheAgeMs <= this.maxCacheAgeMs) {
                return this.cache.value
            }

            this.localStorage.removeItem(this.key)
            if (this.debug) console.log(`Removing value for key '${this.key}' (Reason: too old (Age ms: '${cacheAgeMs}' > Age ms: '${this.maxCacheAgeMs}))`)
        }

        return null
    }


    /* ---------------------------------------------------- Private methods --------------------------------------------------- */

    private load (): boolean {
        if (this.localStorageSupported) {
            this.cache = JSON.parse(window['localStorage'].getItem(this.key))

            return true
        }

        return false
    }

}