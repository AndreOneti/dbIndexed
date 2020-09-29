# dbIndexed

```javascript
let db;
(async function () {
  db = new dbIndexed("test")
  await db.version(1).stores({ tasks: "++id,description,done" });
  await db.tasks.add({ "description": "Test", "done": false, "name": "andre", "age": 26 });
  await db.tasks.add({ "description": "Test", "done": false, "name": "lucas", "age": 23 });
  const oldFriends1 = await db.tasks.where("name").equal("andre");
  const oldFriends2 = await db.tasks.where("name").notEqual("andre");
  const oldFriends3 = await db.tasks.where("age").above(23);
  const oldFriends4 = await db.tasks.where("age").below(26);
  const oldFriends5 = await db.tasks.where("age").aboveEqual(23);
  const oldFriends6 = await db.tasks.where("age").belowEqual(26);
  console.log(oldFriends1);
  console.log(oldFriends2);
  console.log(oldFriends3);
  console.log(oldFriends4);
  console.log(oldFriends5);
  console.log(oldFriends6);
})();

(async function () {
  let idb = new dbIndexed();
  await idb.version(1.1).stores({ tasks: '++id,description' });
  let add = await idb.tasks.bulkAdd([
    { "description": "learn JavaScript", "done": true },
    { "description": "learn TypeScript", "done": false },
    { "description": "learn PWA", "done": false },
    { "description": "learn Java", "done": true },
  ]);
  console.log(add);
})();
```
