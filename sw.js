// Code adapted from MDN article 'Using Service Workers' 
// https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers


self.addEventListener('install', function(event) {
	var urls = [
		'/',
   	'css/styles.css',
   	// 'data/restaurants.json',
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
      	// if not valid response or response not from our site

      	if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
         }

      	// if valid response
        return caches.open('v1').then(function(cache) {
        	 console.log(response);
          cache.put(event.request, response.clone());
          return response;
        });  

      });
    })
  );
});

self.addEventListener('activate', function(event) {

  var cacheWhitelist = ['v1'];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

