import {StringId} from '../lib/StringId'

export class StoreCache {

    constructor() {
        const cache = new Map()

        const stringifyId = id => StringId.get(id)
        const withId = (id, callback) => callback(stringifyId(id))

        this.has = key => cache.has(stringifyId(key))
        this.get = key => cache.get(stringifyId(key))
        this.cache = (key, loader) => withId(key, id => (cache.has(id) ? cache : cache.set(id, loader())).get(id))
        this.clear = key => cache.delete(stringifyId(key))
        this.clearAll = () => cache.clear()
    }
}
