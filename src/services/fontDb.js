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
        const request = operation(transaction.objectStore(STORE_NAME))

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

export function saveFont(fontRecord) {
  return runTransaction('readwrite', (store) => store.put(fontRecord))
}

export function getFonts() {
  return runTransaction('readonly', (store) => store.getAll())
}

export function deleteFont(id) {
  return runTransaction('readwrite', (store) => store.delete(id))
}
