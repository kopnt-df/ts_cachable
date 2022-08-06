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

    this.groupItemsKeys = new Cachable(
      groupKey, null, new Set<string>(), undefined, true,
      (value: CachedItem<Set<string>>) => {
        return JSON.stringify({
          lastSaveMs: value.lastSaveMs,
          value: [...value.value]
        })
      },
      (value: string) => {
        try {
          const parsedValue: CachedItem<Set<string>> = JSON.parse(value)

          return {
            lastSaveMs: parsedValue.lastSaveMs,
            value: new Set(parsedValue.value)
          }
        } catch (err) {
          if (this.debug) console.log(err)
    
          return undefined
        }
      }
    )

    this.items = {}

    console.log('this.groupItemsKeys.value', typeof this.groupItemsKeys.value, this.groupItemsKeys.value)

    this.groupItemsKeys.value!.forEach(itemKey => {
      this.items[itemKey] = new Cachable<T>(itemKey, maxCacheAgeMs, undefined, this.didUnset, debug)
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

    if (this.groupItemsKeys.value!.has(itemCacheKey)) {
      this.items[itemCacheKey].set(value)
    } else {
      this.items[itemCacheKey] = new Cachable<T>(itemCacheKey, this.maxCacheAgeMs, undefined, this.didUnset, this.debug)
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