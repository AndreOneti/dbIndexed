# dbIndexed

## How to use

```
npm install dbindexed --save

yarn add dbindexed
```

```html

<!doctype html>
<html>
  <head>
    <!-- Include DBIndexed -->
    <script src="https://unpkg.com/dbindexed@latest/index.js"></script>

    <script>
      //
      // Define your database
      //
      var db = new dbIndexed("todoDB");
      db.version(1).stores({
        tasks: '++id,description,priority'
      });

      //
      // Add some data into it
      //
      db.tasks.bulkAdd([
        { "description": "Learn IndexedDB", "": 5, "done": false },
        { "description": "Learn JavaScript", "": 4, "done": true },
        { "description": "Learn Java", "": 4, "done": false },
        { "description": "Learn Python", "": 1, "done": false },
      ]).then(function (tasks) {
        //
        // Display the result on console
        //
        console.log(tasks);
      }).catch(function (error) {
        //
        // And catch all error occurred
        //
        console.log("Ooops: " + error);
      });
    </script>
  </head>
</html>

```


<hr>

```javascript
let db;
(async function () {
  db = new dbIndexed("test");
  // DB name -> 'test'

  await db.version(1).stores({ users: "++id,name,age" });
  // DB version -> 10
  // The database version accepts the range from x.0 to x.9 when x is an integer above 0
  // DB stores -> users

  await db.users.add({ "name": "andre oneti", "age": 26 });
  // { "name": "andre oneti", "age": 26, id: 1 }
  await db.users.add({ "name": "lucas oneti", "age": 23 });
  // { "name": "lucas oneti", "age": 23, id: 2 }

  await db.users.where("name").equal("andre oneti");
  // { "name": "andre oneti", "age": 26, id: 1 }

  await db.users.where("name").notEqual("andre oneti");
  // { "name": "lucas oneti", "age": 23, id: 2 }

  await db.users.where("age").above(23);
  // [{ "name": "andre oneti", "age": 26, id: 1 }]

  await db.users.where("age").below(26);
  // [{ "name": "lucas oneti", "age": 23, id: 2 }]

  await db.users.where("age").aboveEqual(23);
  // [{ "name": "lucas oneti", "age": 23, id: 2 },{ "name": "andre oneti", "age": 26, id: 1 }]

  await db.users.where("age").belowEqual(26);
  // [{ "name": "lucas oneti", "age": 23, id: 2 },{ "name": "andre oneti", "age": 26, id: 1 }]

  await db.users.where("name").contains("andre");
  // [{ "name": "andre oneti", "age": 26, id: 1 }]

  await db.users.where("name").notContains("andre");
  // [{ "name": "lucas oneti", "age": 23, id: 2 }]

  await db.users.where({ "name": "andre oneti" });
  // [{ "name": "andre oneti", "age": 26, id: 1 }]
})();

(async function () {
  let idb = new dbIndexed();
  // 'indexedDB'

  await idb.version(1.1).stores({ tasks: '++id,description' });
  // DB version -> 11
  // DB stores -> tasks

  let add = await idb.tasks.bulkAdd([
    { "description": "learn JavaScript", "done": true },
    { "description": "learn TypeScript", "done": false },
    { "description": "learn PWA", "done": false },
    { "description": "learn Java", "done": true },
  ]);
  // [
  //   { "description": "learn JavaScript", "done": true, id: 1 },
  //   { "description": "learn TypeScript", "done": false, id: 2 },
  //   { "description": "learn PWA", "done": false, id: 3 },
  //   { "description": "learn Java", "done": true, id: 4 },
  // ]
})();
```
