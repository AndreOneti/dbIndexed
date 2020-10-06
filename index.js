(function (global, factory) {
  (global.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB) &&
    (global.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction)
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.dbIndexed = factory);
}(this, function (dbName) {
  var dbName = dbName || "indexedDB";
  var documents = {};
  var dbConnection;
  var tables = [];
  var dbVersion;

  function version(version) {
    dbVersion = version * 10;
    dbConnection = null;
    return this;
  }

  async function stores(stores) {
    return new Promise(async (resolve, reject) => {
      documents = { ...documents, ...stores };
      tables = Object.keys(documents);
      for (let index = 0; index < tables.length; index++) {
        let key = tables[index];
        this[key] = {
          /**
           * @returns {Promise<[]>}
           */
          getAll: () => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              var rows = [];
              var store = db.transaction([key], "readonly").objectStore(key);
              if (store.mozGetAll) {
                store.mozGetAll().onsuccess = function (e) {
                  resolve(e.target.result);
                };
              } else {
                store.openCursor().onsuccess = function (e) {
                  var cursor = e.target.result;
                  if (cursor) {
                    rows.push(cursor.value);
                    cursor.continue();
                  }
                  else {
                    resolve(rows);
                  }
                };
              }
            });
          },
          get: (id) => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              var store = db.transaction([key], "readonly").objectStore(key).get(id);
              store.onerror = reject;
              store.onsuccess = function () {
                resolve(store.result);
              }
            });
          },
          add: (obj) => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              let objectStore = db.transaction([key], "readwrite").objectStore(key);
              let objectStoreRequest = objectStore.add(obj);
              objectStoreRequest.onerror = function (error) {
                reject(error.target);
              }
              objectStoreRequest.onsuccess = function () {
                resolve({ ...obj, id: objectStoreRequest.result });
              }
            });
          },
          delete: async (id) => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              let objectStore = db.transaction([key], "readwrite").objectStore(key);
              var obj = await objectStore.get(id);
              var objectStoreRequest = objectStore.delete(id);
              objectStoreRequest.onerror = reject;
              objectStoreRequest.onsuccess = () => resolve(obj.result)
            });
          },
          put: async (obj) => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              let objectStore = db.transaction([key], "readwrite").objectStore(key);
              if (obj.id) {
                var objectStoreRequest = objectStore.put(obj);
                objectStoreRequest.onerror = reject;
                objectStoreRequest.onsuccess = function () {
                  resolve({ ...obj, id: objectStoreRequest.result });
                }
              } else {
                reject("Object without id, can't update.");
              }
            });
          },
          bulkAdd: async (list) => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              let objectStore = db.transaction([key], "readwrite").objectStore(key);
              var listAdd = list.map(item => new Promise((res, reject) => {
                var objectStoreRequest = objectStore.add(item);
                objectStoreRequest.onerror = reject;
                objectStoreRequest.onsuccess = function () {
                  res({ ...item, id: objectStoreRequest.result });
                }
              }));
              Promise.all(listAdd).then(resolve).catch(reject);
            });
          },
          clear: async () => {
            return new Promise(async (resolve, reject) => {
              let db = await getDB();
              let store = db.transaction([key], "readwrite").objectStore(key);
              let storeClear = store.clear();
              storeClear.onerror = function () {
                resolve(false);
              }
              storeClear.onsuccess = function (event) {
                resolve(true);
              };
            });
          },
          where: function (key) {
            if (typeof key === 'undefined') throw new Error("Missing \"key\" to search...");
            if (typeof key === 'object') {
              return new Promise(async (resolve, reject) => {
                let all = await this.getAll();
                let finded = all.filter(function (item) {
                  for (var _key in key) {
                    if (item[_key] === undefined || item[_key] != key[_key])
                      return false;
                  }
                  return true;
                });
                resolve(finded);
              });
            };
            if (typeof key === 'string') {
              return {
                equal: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] === value);
                    resolve(finded);
                  });
                },
                notEqual: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] !== value);
                    resolve(finded);
                  });
                },
                contains: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key].includes(value));
                    resolve(finded);
                  });
                },
                notContains: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => !item[key].includes(value));
                    resolve(finded);
                  });
                },
                above: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] > value);
                    resolve(finded);
                  });
                },
                aboveEqual: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] >= value);
                    resolve(finded);
                  });
                },
                below: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] < value);
                    resolve(finded);
                  });
                },
                belowEqual: (value) => {
                  return new Promise(async (resolve, reject) => {
                    let all = await this.getAll();
                    let finded = all.filter(item => item[key] <= value);
                    resolve(finded);
                  });
                },
              }
            };
          }
        }
      }
      await getDB();
      resolve(this);
    });
  }

  async function openDB(resolve, reject) {
    const request = indexedDB.open(dbName, dbVersion);

    request.addEventListener('upgradeneeded', event =>
      upgradeDB(event.target.result)
    )

    request.addEventListener('success', event => {
      dbConnection = event.target.result;
      let db = request.result;
      db.onversionchange = function () {
        db.close();
      };
      resolve(dbConnection);
    })

    request.addEventListener('error', event => {
      reject(event);
    })
  }

  async function upgradeDB(db) {
    // [...db.objectStoreNames].filter(function (item) {
    //   return !tables.includes(item)
    // }).forEach(item => {
    //   db.deleteObjectStore(item);
    // });
    tables.forEach(key => {
      if (!db.objectStoreNames.contains(key)) {
        let opt = {};
        let fields = documents[key].split(',');
        if (fields.includes('++id')) opt = { keyPath: "id", autoIncrement: true };
        let store = db.createObjectStore(key, opt);
        fields
          .filter(item => !item.includes('id'))
          .forEach(item => {
            let name = item.replace(/\&/g, '');
            store.createIndex(name, name, { unique: item.includes('&') });
          });
      }
    });
  }

  async function getDB() {
    return new Promise((resolve, reject) => {
      if (dbConnection) resolve(dbConnection);
      else openDB(resolve, reject);
    });
  }

  return {
    version,
    stores
  }
}));
