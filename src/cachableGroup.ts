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

    this.groupItemsKeys = new Cachable(groupKey, null, {}, undefined, true)
    this.items = {}

    console.log('this.groupItemsKeys.value', typeof this.groupItemsKeys.value, this.groupItemsKeys.value)

    for(let itemKey of Object.keys(this.groupItemsKeys)) {
      this.items[itemKey] = new Cachable<T>(itemKey, maxCacheAgeMs, undefined, this.didUnset, debug)
    }
  }


  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly groupKey: string


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private maxCacheAgeMs: number
  private debug: boolean

  private groupItemsKeys: Cachable<{[key: string]: boolean}>
  private items: {
    [key: string]: Cachable<T>
  }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  getItem(key: string): T | undefined {
    const itemCache = this.items[this.itemCacheKey(key)]

    return itemCache !== undefined && itemCache.value !== undefined ? itemCache.value : undefined
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

    if (this.groupItemsKeys.value![itemCacheKey] === true) {
      this.items[itemCacheKey].set(value)
    } else {
      this.items[itemCacheKey] = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, this.didUnset, this.debug)
      this.groupItemsKeys.value![itemCacheKey] = true
      this.groupItemsKeys.set(this.groupItemsKeys.value!)
    }
  }

  deleteItem(key: string) {
    this._deleteItem(this.itemCacheKey(key))
  }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private itemCacheKey(itemKey: string) {
    return `${this.groupKey}-${itemKey.toLowerCase()}`
  }

  private didUnset(itemCacheKey: string) {
    this._deleteItem(itemCacheKey)
  }

  private _deleteItem(itemCacheKey: string) {
    if (this.groupItemsKeys.value![itemCacheKey] === true) {
      delete this.groupItemsKeys.value![itemCacheKey]
      this.groupItemsKeys.set(this.groupItemsKeys.value!)
      delete this.items[itemCacheKey]
    }
  }
}