/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { Cachable } from './cachable'
import { CachedItem } from './types'

/* -------------------------------------------------------------------------------------------------------------------------------- */



/* ----------------------------------------------------- class: CachableGroup ---------------------------------------------------- */

export class CachableGroup<T> {

  /* ------------------------------------------------------ Constructor ----------------------------------------------------- */

  constructor(
    groupKey: string,
    maxCacheAgeMs: number = 1000*60*60,
    debug: boolean = false
  ) {
    this.groupKey = groupKey.toLowerCase()
    this.maxCacheAgeMs = maxCacheAgeMs
    this.debug = debug

    // this.groupItemsKeys = new Cachable(groupKey, null, {}, undefined, true)
    this.items = {}

    // for(let itemKey of Object.keys(this.groupItemsKeys.value)) {
    //   this.items[itemKey] = new Cachable<T>(itemKey, maxCacheAgeMs, undefined, this.didUnset, debug)
    // }
  }


  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly groupKey: string


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private maxCacheAgeMs: number
  private debug: boolean

  // private groupItemsKeys: Cachable<{[key: string]: boolean}>
  private items: {
    [key: string]: Cachable<T>
  }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  getItem(key: string): T | undefined {
    const itemCacheKey = this.itemCacheKey(key)
    var itemCache = this.items[this.itemCacheKey(key)]

    if (itemCache === undefined) {
      itemCache = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, this.didUnset, this.debug)
      this.items[this.itemCacheKey(key)] = itemCache
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
      this.items[itemCacheKey] = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, this.didUnset, this.debug)
    }

    this.items[itemCacheKey].set(value)
  }

  deleteItem(key: string) {
    this._deleteItem(this.itemCacheKey(key))
  }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private itemCacheKey(itemKey: string) {
    return `${this.groupKey}-${itemKey.toLowerCase()}`
  }

  private didUnset(itemCacheKey: string) {
    console.log('itemCacheKey', itemCacheKey)
    console.log('this', this)
    console.log('this._deleteItem', this._deleteItem)
    this._deleteItem(itemCacheKey)
  }

  private _deleteItem(itemCacheKey: string) {
    delete this.items[itemCacheKey]
  }
}