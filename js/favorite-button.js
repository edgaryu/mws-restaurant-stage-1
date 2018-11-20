/* Adapted from MWS Restaurant Reviews walkthrough:
   https://alexandroperez.github.io/mws-walkthrough/?3.3.favorite-restaurants-using-accessible-toggle-buttons
*/


function handleClick() {
  const restaurantId = this.dataset.id;
  // check if this restaurant has been favorited by user
  const fav = this.getAttribute('aria-pressed') == 'true';

  dbPromise.changeFavorite(restaurantId, fav, this.id);

}


function favoriteButton(restaurant) {
  const button = document.createElement('button');
  button.id = 'favbutton' + restaurant.id;
  button.innerHTML = "&#x2764;"; // this is the heart symbol in hex code
  button.className = "fav"; // you can use this class name to style your button
  button.dataset.id = restaurant.id; // store restaurant id in dataset for later
  button.setAttribute('aria-label', `Mark ${restaurant.name} as a favorite`);
  button.setAttribute('aria-pressed', restaurant.is_favorite);
  button.onclick = handleClick;

  return button;
}