(function (global, factory) {
  (global.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB) &&
    (global.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction)
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.dbIndexed = factory);
}(this, class dbIndexed {
  constructor(dbName) {
    this.dbName = dbName || 'indexedDB';
    this.version;
  }

  version(version) {
    this.version = version * 10;
    return this;
  }

  async stores(obj) {
    return new Promise(async (resolve, reject) => {
      let keys = Object.keys(obj);
      keys.forEach(key => {
        this[key] = {
          name: key,
          dbName: this.dbName,
          version: this.version,
          fields: obj[key].split(','),
          get: async function (id) {
            return new Promise((resolve, reject) => {
              this.connectDB(this, function (db, collection) {
                var transaction = db.transaction([collection.name], "readonly").objectStore(collection.name).get(id);
                transaction.onerror = reject;
                transaction.onsuccess = function () {
                  resolve(transaction.result);
                }
              });
            });
          },
          getAll: async function () {
            return new Promise((resolve) => {
              this.connectDB(this, function (db, colletion) {
                var rows = [];
                var store = db.transaction([colletion.name], "readonly").objectStore(colletion.name);

                if (store.mozGetAll)
                  store.mozGetAll().onsuccess = function (e) {
                    resolve(e.target.result);
                  };
                else
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
              });
            });
          },
          add: async function (obj) {
            return new Promise((resolve, reject) => {
              this.connectDB(this, function (db, colletion) {
                var transaction = db.transaction([colletion.name], "readwrite")
                var objectStore = transaction.objectStore(colletion.name);
                var objectStoreRequest = objectStore.add(obj);
                objectStoreRequest.onerror = reject;
                objectStoreRequest.onsuccess = function () {
                  resolve({ ...obj, id: objectStoreRequest.result });
                }
              });
            });
          },
          delete: async function (id) {
            return new Promise((resolve, reject) => {
              this.connectDB(this, async function (db, colletion) {
                var transaction = db.transaction([colletion.name], "readwrite");
                var objectStore = transaction.objectStore(colletion.name);
                var obj = await objectStore.get(id);
                var objectStoreRequest = objectStore.delete(id);
                objectStoreRequest.onerror = reject;
                objectStoreRequest.onsuccess = function () {
                  resolve(obj.result);
                }
              });
            });
          },
          put: async function (obj) {
            return new Promise((resolve, reject) => {
              this.connectDB(this, function (db, colletion) {
                var transaction = db.transaction([colletion.name], "readwrite")
                var objectStore = transaction.objectStore(colletion.name);
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
            });
          },
          bulkAdd: async function (list) {
            return new Promise((resolve, reject) => {
              this.connectDB(this, function (db, colletion) {
                var transaction = db.transaction([colletion.name], "readwrite")
                var objectStore = transaction.objectStore(colletion.name);
                var listAdd = list.map(item => new Promise((res, reject) => {
                  var objectStoreRequest = objectStore.add(item);
                  objectStoreRequest.onerror = reject;
                  objectStoreRequest.onsuccess = function () {
                    res({ ...item, id: objectStoreRequest.result });
                  }
                }));
                Promise.all(listAdd).then(resolve).catch(reject);
              });
            });
          },
          clear: async function () {
            return new Promise(async (resolve, reject) => {
              let all = await this.getAll();
              let primises = all.map(item => this.delete(item.id));
              Promise
                .all(primises)
                .then(resolve)
                .catch(reject);
            });
          },
          where: function (key) {
            if (typeof key === 'undefined') throw new Error("Missing \"key\" to search...");
            if (typeof key === 'object') { }
            if (typeof key === 'string') {
              return {
                key,
                name: this.name,
                dbName: this.dbName,
                version: this.version,
                equal: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] === value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
                above: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] > value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
                below: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] < value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
                aboveEqual: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] >= value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
                belowEqual: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] <= value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
                notEqual: async function (value) {
                  return new Promise((resolve, reject) => {
                    var request = indexedDB.open(this.dbName, this.version);
                    request.onerror = console.log;
                    request.onsuccess = () => {
                      let db = request.result;
                      db.onversionchange = function () {
                        db.close();
                      };
                      var list = [];
                      var transaction = db.transaction([this.name], "readonly")
                      var objectStore = transaction.objectStore(this.name);

                      objectStore.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                          if (cursor.value[key] !== value) list.push(cursor.value);
                          cursor.continue();
                        }
                        else {
                          resolve(list);
                        }
                      };
                    }
                  });
                },
              };
            }
          },
          connectDB(colletion, f) {
            var request = indexedDB.open(colletion.dbName, colletion.version);
            request.onerror = console.log;
            request.onsuccess = () => {
              let db = request.result;
              db.onversionchange = function () {
                db.close();
              };

              f(db, colletion);
            }
            request.onupgradeneeded = function (e) {
              var Db = e.currentTarget.result;
              if (!Db.objectStoreNames.contains(colletion.name)) {
                let opt = {};
                if (colletion.fields.includes('++id')) opt = { keyPath: "id", autoIncrement: true };
                var store = Db.createObjectStore(colletion.name, opt);
                colletion.fields
                  .filter(item => !item.includes('id'))
                  .forEach(item => {
                    let name = item.replace(/\&/g, '');
                    store.createIndex(name, name, { unique: item.includes('&') });
                  });
              }
            }
          }
        }
      });

      var request = indexedDB.open(this.dbName, this.version);
      request.onerror = reject;
      request.onsuccess = () => {
        let db = request.result;
        db.onversionchange = function () {
          db.close();
        };
        resolve("Finished");
      }
      request.onupgradeneeded = function (e) {
        var Db = e.currentTarget.result;
        keys.forEach(key => {
          if (!Db.objectStoreNames.contains(key)) {
            let opt = {};
            let fields = obj[key].split(',')
            if (fields.includes('++id')) opt = { keyPath: "id", autoIncrement: true };
            let store = Db.createObjectStore(key, opt);
            fields
              .filter(item => !item.includes('id'))
              .forEach(item => {
                let name = item.replace(/\&/g, '');
                store.createIndex(name, name, { unique: item.includes('&') });
              });
          }
        });
      }
    });
  }
}));
