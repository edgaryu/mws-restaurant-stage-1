/* Adapted from MWS Restaurant Reviews walkthrough:
   https://alexandroperez.github.io/mws-walkthrough/?3.2.upgrading-idb-for-restaurant-reviews
*/

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

const dbPromise = {
  db: idb.open('restaurantdb', 2, function(upgradeDb) {
	 switch (upgradeDb.oldVersion) {
		case 0:
		  upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
		case 1:
		  upgradeDb.createObjectStore('reviews', { keyPath: 'id' })
			 .createIndex('restaurant_id', 'restaurant_id');
	 }
  }),


  /**
	* Add event listeners so that the appropriate dbPromise functions are called when there is online functionality.
	*/
  sendDataWhenOnline(offline_obj) {
  	if (offline_obj.reqtype === 'favorite') {
  		const reqKeyName = 'favdata' + offline_obj.restaurantId;

  		localStorage.setItem(reqKeyName, JSON.stringify(offline_obj));
  		window.addEventListener('online', (event) => {
  			let data = JSON.parse(localStorage.getItem(reqKeyName));
  			if (data !== null) {
  				// console.log(data);
  				if (offline_obj.reqtype === 'favorite') {
  					dbPromise.changeFavorite(offline_obj.restaurantId, offline_obj.fav, offline_obj.buttonId);
  				}
  				localStorage.removeItem(reqKeyName);
  			}
  		})	
  	}
  	else if (offline_obj.reqtype === 'review') {
  		const reqKeyName = 'revdata' + offline_obj.timestamp;

  		localStorage.setItem(reqKeyName, JSON.stringify(offline_obj));
  		window.addEventListener('online', (event) => {
  			let data = JSON.parse(localStorage.getItem(reqKeyName));
  			if (data !== null) {
  				if (offline_obj.reqtype === 'review') {
  					dbPromise.addReview(offline_obj.review);
  				}
  				localStorage.removeItem(reqKeyName);
  			}
  		})	
  	}
  	else {
  		console.log('Wrong req type');
  	}
  	

  },

  /**
	* Change favorite status of a restaurant and save in idb. If offline, delay the request until online.
	*/
  changeFavorite(restaurant_id, fav, button_id) {
	 // Check if online. If offline, delay the req until online.
   if (!navigator.onLine) {
   	const offline_fav_req = {
   		restaurantId : restaurant_id,
   		fav: fav,
   		buttonId: button_id,
   		reqtype: 'favorite'
   	}
		dbPromise.sendDataWhenOnline(offline_fav_req);
		return;
	}

	 // Put request to change favorite status for a restaurant
	 const url = `${DBHelper.API_URL}/restaurants/${restaurant_id}/?is_favorite=${!fav}`;
	 const PUT = {method: 'PUT'};

	 return fetch(url, PUT).then(response => {
	    if (!response.ok) return Promise.reject("We couldn't mark restaurant as favorite.");
	    return response.json();
	  }).then(updatedRestaurant => {
	    // update restaurant on idb
	    dbPromise.putRestaurants(updatedRestaurant, true);
	    // change state of toggle button
	    document.getElementById(button_id).setAttribute('aria-pressed', !fav);
	  }).catch(error => {
	  	// fetch request failed (probably due to lack of network connection)
	  		return Promise.reject("We couldn't mark restaurant as favorite");
	  });  		
  },

  /**
	* Add a review to a restaurant and save in idb. If offline, delay the request until online.
	@params: `review` is a JSON object
	*/
  addReview(review) {
	  // Check if online. If offline, delay the req until online.
     if (!navigator.onLine) {
   	 const offline_fav_req = {
   	 	review: review,
   	 	reqtype: 'review',
   	 	timestamp: Date.now()
   	 }
		 dbPromise.sendDataWhenOnline(offline_fav_req);
		 return;
	  }  	

	  const url = `${DBHelper.API_URL}/reviews/`;
	  const POST = {
	    method: 'POST',
	    body: JSON.stringify(review)
	  };

	  // TODO: use Background Sync to sync data with API server
	  return fetch(url, POST).then(response => {
	    if (!response.ok) return Promise.reject("We couldn't post review to server.");
	    return response.json();
	  }).then(newNetworkReview => {
	    // save new review on idb
	    dbPromise.putReviews(newNetworkReview);
	    // post new review on page
	    const reviewList = document.getElementById('reviews-list');
	    const review = createReviewHTML(newNetworkReview);
	    reviewList.appendChild(review);
	    // clear form
	    clearForm();
	  });
  },

  /**
	* Save a restaurant or array of restaurants into idb, using promises. If second argument
	* is passed a boolean true, data will be forcibly updated.
	*/
  putRestaurants(restaurants, forceUpdate = false) {
	 if (!restaurants.push) restaurants = [restaurants];
	 
	 return this.db.then(db => {
		const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
		Promise.all(restaurants.map(networkRestaurant => {
		  return store.get(networkRestaurant.id).then(idbRestaurant => {
		  	 //update updatedAt property for restaurant
		  	 // networkRestaurant.updatedAt = new Date(networkRestaurant.updatedAt).toISOString;
			 if (forceUpdate) return store.put(networkRestaurant);
			 if (!idbRestaurant || new Date(networkRestaurant.updatedAt) > new Date(idbRestaurant.updatedAt)) {
				return store.put(networkRestaurant);
			 }
		  });
		})).then(function () {
		  return store.complete;
		});
	 });
  },

  /**
	* Get a restaurant, by its id, or all stored restaurants in idb using promises.
	* If no argument is passed, all restaurants will returned.
	*/
  getRestaurants(id = undefined) {
	 return this.db.then(db => {
		const store = db.transaction('restaurants').objectStore('restaurants');
		if (id) return store.get(Number(id));
		return store.getAll();
	 });
  },

  /**
	* Save a review or array of reviews into idb, using promises
	*/
  putReviews(reviews) {
	 if (!reviews.push) reviews = [reviews];
	 return this.db.then(db => {
		const store = db.transaction('reviews', 'readwrite').objectStore('reviews');
		Promise.all(reviews.map(networkReview => {
		  return store.get(networkReview.id).then(idbReview => {
			 if (!idbReview || new Date(networkReview.updatedAt) > new Date(idbReview.updatedAt)) {
				return store.put(networkReview);
			 }
		  });
		})).then(function () {
		  return store.complete;
		});
	 });
  },

  /**
	* Get all reviews for a specific restaurant, by its id, using promises.
	*/
  getReviewsForRestaurant(id) {
	 return this.db.then(db => {
		const storeIndex = db.transaction('reviews').objectStore('reviews').index('restaurant_id');
		return storeIndex.getAll(Number(id));
	 });
  },

};


// ========================================================

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

  static get API_URL() {
	 // const port = 8000 // Change this to your server port
	 // return `http://localhost:${port}/data/restaurants.json`;

	 const port = 1337;
	 return `http://localhost:${port}`;
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
			// Occurs when data server fails to respond to fetch request
			if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");

			var restaurants = response.clone();
			
			// // update idb with new data
	  // 		dbPromise.then(function(db) {
			// 	restaurants.json().then(function(allRestaurants) {
			// 		var tx = db.transaction('restaurants', 'readwrite');
			// 		var keyValStore = tx.objectStore('restaurants');
			// 		allRestaurants.forEach(function (restaurant) {
			// 			keyValStore.put(restaurant);
			// 		})
			// 		return tx.complete;
			// 	});
			// })

			restaurants.json().then(function(allRestaurants) {
				dbPromise.putRestaurants(allRestaurants);
			})

			return response.json();
		}).then(function(json) {
			// Return fetch response to callback
			callback(null, json);
		})
		.catch(function(e) {
			// Catch if fetch request fails

			dbPromise.getRestaurants().then(idbRestaurants => {
			 // if we get back more than 1 restaurant from idb, return idbRestaurants
			 if (idbRestaurants.length > 0) {
				callback(null, idbRestaurants)
			 } else { // if we got back 0 restaurants return an error
				callback('No restaurants found in idb', null);
			 }
			});

			// dbPromise.then(function(db) {
			// 	var tx = db.transaction('restaurants', 'readwrite');
			// 	var keyValStore = tx.objectStore('restaurants');

			// 	return keyValStore.getAll();
			// }).then(function(restaurants) {
			// 	// Return idb response to callback
			// 	callback(null, restaurants);
			// }).catch(function() {
			// 	// idb response fails -> return error to callback
			// 	callback('Request failed', null);
			// });

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
	* Fetch the reviews of a restaurant by its ID.
	*/
	static fetchReviewsByRestaurantId(restaurant_id) {
		return fetch(`${DBHelper.API_URL}/reviews/?restaurant_id=${restaurant_id}`).then(response => {
			// console.log(response);
			if (!response.ok) return Promise.reject("Reviews couldn't be fetched from network");
			return response.json();
		}).then(fetchedReviews => {
			// if reviews could be fetched from network:
			// store reviews on idb
			// console.log(fetchedReviews);
			dbPromise.putReviews(fetchedReviews);
			return fetchedReviews;
		}).catch(networkError => {
			// if reviews couldn't be fetched from network:
			// try to get reviews from idb
			console.log(`${networkError}, trying idb.`);
			return dbPromise.getReviewsForRestaurant(restaurant_id).then(idbReviews => {
				// if no reviews were found on idb return null
				if (idbReviews.length < 1) return null;
				return idbReviews;
			});
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

