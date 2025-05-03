import {StoreCache} from './StoreCache.js'

export class StoreLoader {

    constructor() {
        const cache = new StoreCache()

        this.load = (id, loader) => cache.cache(id, () => loader(id).catch(error => {
            cache.clear(id)
            throw error
        }))
        this.get = id => cache.get(id)
        this.set = (id, value) => this.load(id, () => Promise.resolve(value))
        this.clear = id => cache.clear(id)
        this.clearAll = () => cache.clearAll()
    }
}
