import axios from 'axios'
import _ from 'lodash'

export default class CachedAxios {
  constructor(storage) {
    this.storage = storage
    this.axios = axios
  }

  getApi(url, options) {
    return (updatedAt = null) =>
      this.axios.get(url, options.params
        ? {
          ...options,
          params: {
            ...options.params,
            q: {
              ...(options.params
                ? options.params.q
                : {}),
              ...(updatedAt ? { updated_at: { $gt: updatedAt } } : {}),
            },
          },
        }
        : { options })
  }

  parse = data => {
    try {
      return JSON.parse(data)
    } catch (error) {
      return data
    }
  }

  getItem = item => typeof this.storage.getItem === 'function'
    ? this.storage.getItem.then
      ? this.storage.getItem(item).then(this.parse)
      : Promise.resolve(this.parse(this.storage.getItem(item)))
    : Promise.reject('getItem is not a function')

  setCache = (item, data, cachedBy) => this.getItem(item)
    .then(localData => {
      if (data && Array.isArray(data)) {
        const union = _.unionBy(data, localData, '_id')
        const latest = _.maxBy(data, obj => new Date(obj.updated_at).getTime()) || {}

        return (latest.updated_at
          ? Promise.all([
            this.storage.setItem(`${item}_latest`, latest[cachedBy || 'updated_at']),
            this.storage.setItem(item, union),
          ])
          : this.storage.setItem(item, union))
          .then(() => ({ data: union }))
      } else if (data && Object.keys(data).length) {
        const latest = JSON.stringify(data)
        return Promise.all([
          this.storage.setItem(`${item}_latest`, latest),
          this.storage.setItem(item, data),
        ]).then(() => ({ data }))
      }

      return Promise.resolve({ data: localData })
    })

  get = (url, options = {}, cachedBy) => this.getItem(`${url}_latest`)
    .then(this.parse)
    .then(this.getApi(url, options))
    .then(({ data }) => this.setCache(url, data, cachedBy))

  setDefaults = options => {
    axios.defaults = {
      ...axios.defaults,
      ...options,
    }
  }

  setAuthorizationToken = token => {
    this.axios.defaults.headers.common.authorization = `Bearer ${token}`
  }

  setBaseUrl = url => this.axios.defaults.baseURL = url
}
