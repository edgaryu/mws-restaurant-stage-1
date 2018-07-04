// Code adapted from MDN article 'Using Service Workers' 
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers

// var idb = require('idb');
// import idb from 'idb';

// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/sw.js')
//   .then(function(reg) {
//     // registration worked
//     console.log('Registration succeeded. Scope is ' + reg.scope);
//   }).catch(function(error) {
//     // registration failed
//     console.log('Registration failed with ' + error);
//   });
// }



var dbPromise = idb.open('mydb', 1, function(upgradeDb) {
	var keyValStore = upgradeDb.createObjectStore('keyval');
	keyValStore.put("world", "hello");
})

dbPromise.then(function(db) {
	var tx = db.transaction('keyval');
	var keyValStore = tx.objectStore('keyval');
	return keyValStore.get('hello');

}).then(function(val) {
	console.log('The value of "hello" is:', val);
});