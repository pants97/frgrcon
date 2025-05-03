export class StringId {

    static get(id) {
        return id === undefined || id === null ? null : typeof id !== 'object' ? String(id) : JSON.stringify(Array.isArray(id)
            ? id
                .map(StringId.get)
                .sort()
            : Object.fromEntries(Object
                .entries(id)
                .map(([key, value]) => [StringId.get(key), StringId.get(value)])
                .sort(([a], [b]) => (a || '').localeCompare(b || '')),
            ))
    }
}
