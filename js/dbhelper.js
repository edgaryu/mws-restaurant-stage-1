/**
 * Common database helper functions.
 */
// var db;
// var request = indexedDB.open("restaurants");
// request.onerror = function(evt) {
//   console.log("Database error code: " + evt.target.errorCode);
// };
// request.onsuccess = function(evt) {
//   db = request.result;

// };

// const dbPromise = idb.open('keyval-store', 1, upgradeDB => {
//   upgradeDB.createObjectStore('keyval');
// });
// dbPromise.then(function(db) {
// 	var tx = db.transaction('keyval');
// 	var keyValStore = tx.objectStore('keyval');
// 	return keyValStore.get('hello');
// }).then(function(val) {
// 	console.log('The value of "hello" is:', val);
// });


class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 8000 // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;

    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }

  static handleErrors(response) {
		if (!response.ok) {
			console.log("Error");
			throw Error(response.statusText);
		}
		return response;
	}

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
		fetch(DBHelper.DATABASE_URL)
		.then(function(response)  {
			var restaurants = response.clone();

			var dbPromise = idb.open('mydb', 1, function(upgradeDb) {
			switch (upgradeDb.oldVersion) {
				case 0:
					upgradeDb.createObjectStore('restaurants', {
						keyPath: 'id'
					});
			}	
			});

			// update idb with new data
	  		dbPromise.then(function(db) {
				var tx = db.transaction('restaurants', 'readwrite');
				var keyValStore = tx.objectStore('restaurants');

				restaurants.json().then(function(allRestaurants) {
					allRestaurants.forEach(function (restaurant) {
						keyValStore.put(restaurant);
					})
				});

				return tx.complete;
			}).then(function() {
				console.log("Complete");
			});

			return response.json();
		}).then(function(json) {
			// Return fetch response to callback
			callback(null, json);
		})
		.catch(function(e) {
			// Catch if fetch request fails

			dbPromise.then(function(db) {
				var tx = db.transaction('restaurants', 'readwrite');
				var keyValStore = tx.objectStore('restaurants');

				return keyValStore.getAll();
			}).then(function(restaurants) {
				// Return idb response to callback
				callback(null, restaurants);
			}).catch(function() {
				// idb response fails -> return error to callback
				callback('Request failed', null);
			});

		});

	}


  /**
   * Fetch a restaurant by its ID.
   */
	static fetchRestaurantById(id, callback) {
	    // fetch all restaurants with proper error handling.
	    DBHelper.fetchRestaurants((error, restaurants) => {
	      if (error) {
	        callback(error, null);
	      } else {
	        const restaurant = restaurants.find(r => r.id == id);
	        if (restaurant) { // Got the restaurant
	          callback(null, restaurant);
	        } else { // Restaurant does not exist in the database
	          callback('Restaurant does not exist', null);
	        }
	      }
	    });
	}

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, img) {
  		// const img = document.createElement('img');
  		img.className = 'restaurant-img';

  		// Check if restaurant has corresponding photograph
  		if (typeof restaurant.photograph == "undefined") {
  			img.alt = `Image of ${restaurant.name}`;
  			return;
  		}

  		var srcBaseName = `${restaurant.photograph}`;
  		if (srcBaseName.endsWith('.jpg')) {
  			srcBaseName = srcBaseName.slice(0, -4);
  		}
  		const smallImgUrl = (`/images/${srcBaseName}-400w.jpg`);
  		const largeImgUrl = (`/images/${srcBaseName}-800w.jpg`);

  		img.src = largeImgUrl;
  		img.alt = `Image of ${restaurant.name}`;
  		img.sizes = '(max-width: 450px) 50vw, 50vw';
  		img.srcset = (`${smallImgUrl} 400w, ${largeImgUrl} 800w`);

    // return img;
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

