self.addEventListener('install', function(event) {
	var urls = [
		'/',
   	'css/media.css',
   	'css/styles.css',
   	'data/restaurants.json',
   	'index.html',
   	'restaurant.html',
   	'app.js',
   	'sw.js',
   	'js/dbhelper.js',
   	'js/main.js',
   	'js/restaurant_info.js',
      'images/1-400w.jpg',
		'images/1-800w.jpg',
		'images/2-400w.jpg',
		'images/2-800w.jpg',
		'images/3-400w.jpg',
		'images/3-800w.jpg',
		'images/4-400w.jpg',
		'images/4-800w.jpg',
		'images/5-400w.jpg',
		'images/5-800w.jpg', 
		'images/6-400w.jpg',
		'images/6-800w.jpg',
		'images/7-400w.jpg',
		'images/7-800w.jpg',
		'images/8-400w.jpg',
		'images/8-800w.jpg',
		'images/9-400w.jpg',
		'images/9-800w.jpg',
		'images/10-400w.jpg',
		'images/10-800w.jpg'
	];

  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll(
      	urls
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request).then(function(response) {
        return caches.open('v1').then(function(cache) {
          cache.put(event.request, response.clone());
          return response;
        });  
      });
    })
  );
});

// self.addEventListener('fetch', function(event) {

// 	console.log(event.request);
// });