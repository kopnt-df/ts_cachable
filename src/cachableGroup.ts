/* ------------------------------------------------------------ Imports ----------------------------------------------------------- */

// Local
import { Cachable } from './cachable'

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

    this.groupItemsKeys = new Cachable(groupKey, null, new Set<string>(), null, debug)

    this.items = {}

    this.groupItemsKeys.value!.forEach(itemKey => {
      this.items[itemKey] = new Cachable<T>(itemKey, maxCacheAgeMs, null, this.didUnset, this.debug)
    })
  }


  /* --------------------------------------------------- Public properties -------------------------------------------------- */

  readonly groupKey: string


  /* -------------------------------------------------- Private properties -------------------------------------------------- */

  private maxCacheAgeMs: number
  private debug: boolean

  private groupItemsKeys: Cachable<Set<string>>
  private items: {
    [key: string]: Cachable<T>
  }


  /* ---------------------------------------------------- Public methods ---------------------------------------------------- */

  getItem(key: string): T | null {
    const itemCache = this.items[this.itemCacheKey(key)]

    return itemCache !== undefined && itemCache !== null ? itemCache.value : null
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

    if (this.groupItemsKeys.value!.has(itemCacheKey)) {
      this.items[itemCacheKey].set(value)
    } else {
      this.items[itemCacheKey] = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, null, this.didUnset, this.debug)
      this.groupItemsKeys.value!.add(itemCacheKey)
      this.groupItemsKeys.set(this.groupItemsKeys.value!)
    }
  }

  deleteItem(key: string) {
    const itemCacheKey = this.itemCacheKey(key)

    if (this.groupItemsKeys.value!.delete(itemCacheKey)) {
      this.groupItemsKeys.set(this.groupItemsKeys.value!)
      delete this.items[itemCacheKey]
    }
  }


  /* ---------------------------------------------------- Private methods --------------------------------------------------- */

  private itemCacheKey(itemKey: string) {
    return `${this.groupKey}-${itemKey.toLowerCase()}`
  }

  private didUnset(itemCacheKey: string) {
    this.groupItemsKeys.value!.delete(itemCacheKey)
    this.groupItemsKeys.set(this.groupItemsKeys.value!)

    delete this.items[itemCacheKey]
  }
}