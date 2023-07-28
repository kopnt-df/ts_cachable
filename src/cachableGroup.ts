/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { Cachable } from './cachable'
import { CachedItem } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ----------------------------------------------------- class: CachableGroup ---------------------------------------------------- */

export class CachableGroup<T> {

  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly groupKey: string
  readonly stringify: ((value: CachedItem<T>) => string) | undefined
  readonly parse: ((value: string) => CachedItem<T> | undefined) | undefined
  readonly maxCacheAgeMs: number
  readonly debug: boolean
  readonly unsetOnExpire: boolean


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private obfuscationKey: number | undefined

  // private groupItemsKeys: Cachable<{[key: string]: boolean}>
  private items: {
    [key: string]: Cachable<T>
  }


  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    groupKey: string,
    maxCacheAgeMs: number = 1000*60*60,
    debug: boolean = false,

    stringify?: (value: CachedItem<T>) => string,
    parse?: (value: string) => CachedItem<T> | undefined,
    obfuscationKey?: number, // 0 - (OBFUSCATION_N-1)
    unsetOnExpire: boolean = true
  ) {
    this.groupKey = groupKey.toLowerCase()
    this.maxCacheAgeMs = maxCacheAgeMs
    this.debug = debug
    this.obfuscationKey = obfuscationKey
    this.items = {}

    this.stringify = stringify
    this.parse = parse

    this.unsetOnExpire = unsetOnExpire
  }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  reload() {
    for (const cacheKey of Object.keys(this.items)) {
      this.items[cacheKey].load()
    }
  }

  isExpired(key: string): boolean {
    return this.items[this.itemCacheKey(key)]?.isExpired()
  }

  getItem(key: string): T | undefined {
    const itemCacheKey = this.itemCacheKey(key)
    var itemCache = this.items[itemCacheKey]

    if (itemCache === undefined) {
      itemCache = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, (key: string) => { delete this.items[key] }, this.debug, this.stringify, this.parse, this.obfuscationKey, this.unsetOnExpire)
      this.items[itemCacheKey] = itemCache
    }

    return itemCache.value
  }

  setItem(
    key: string,
    value: T | null 
  ) {
    if (value === null) {
      this.deleteItem(key)

      return
    }

    const itemCacheKey = this.itemCacheKey(key)

    if (this.items[itemCacheKey] === undefined) {
      this.items[itemCacheKey] = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, (key: string) => { delete this.items[key] }, this.debug, this.stringify, this.parse, this.obfuscationKey, this.unsetOnExpire)
    }

    this.items[itemCacheKey].set(value)
  }

  deleteItem(key: string) {
    delete this.items[this.itemCacheKey(key)]
  }

  itemCacheKey(itemKey: string) {
    return `${this.groupKey}-${itemKey.toLowerCase()}`
  }
}