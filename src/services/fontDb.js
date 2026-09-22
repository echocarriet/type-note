const DB_NAME = 'type-note'
const DB_VERSION = 1
const STORE_NAME = 'fonts'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runTransaction(mode, operation) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        let request
        let requestResult
        let requestError

        try {
          request = operation(transaction.objectStore(STORE_NAME))
        } catch (error) {
          database.close()
          reject(error)
          return
        }

        request.onsuccess = () => {
          requestResult = request.result
        }
        request.onerror = () => {
          requestError = request.error
        }
        transaction.oncomplete = () => {
          database.close()
          resolve(requestResult)
        }
        transaction.onabort = () => {
          database.close()
          reject(transaction.error || requestError || new Error('IndexedDB transaction aborted'))
        }
      }),
  )
}

function createStorableFont(fontRecord) {
  return {
    id: fontRecord.id,
    name: fontRecord.name,
    family: fontRecord.family,
    fileName: fontRecord.fileName,
    type: fontRecord.type,
    file: fontRecord.file,
    hash: fontRecord.hash,
    sortOrder: fontRecord.sortOrder,
    lastUsedAt: fontRecord.lastUsedAt,
  }
}

export function saveFont(fontRecord) {
  // Vue makes items in reactive arrays into Proxy objects, which IndexedDB
  // cannot clone. Build a plain record before every write.
  return runTransaction('readwrite', (store) => store.put(createStorableFont(fontRecord)))
}

export function getFonts() {
  return runTransaction('readonly', (store) => store.getAll())
}

export function deleteFont(id) {
  return runTransaction('readwrite', (store) => store.delete(id))
}
