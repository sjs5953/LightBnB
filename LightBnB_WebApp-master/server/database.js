const db = require('../db');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return db
  .query(`
  SELECT * FROM users
  WHERE email = $1`,[email])
  .then(res => {
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0]
  })
  .catch(err => console.log('error: ',err.message));
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);
  return db
  .query(`
  SELECT * FROM users
  WHERE id = $1`,[id])
  .then(res => {
    if (res.rows.length === 0) {
      return null;
    }
    return res.rows[0]
  }) 
  .catch(err => console.log('error: ',err.message));
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return db
  .query(`
  INSERT INTO users (name, email, password) 
  VALUES ($1,$2,$3)
  RETURNING *
  `,[user.name,user.email,user.password])
  .then(res=>res.rows[0])
  .catch(err => console.log('error: ',err.message));
}

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  return db
    .query(`
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM properties
    JOIN reservations
    ON properties.id = property_id
    JOIN property_reviews
    ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1 AND end_date < now():: date
    GROUP BY properties.id,reservations.id
    ORDER BY start_date DESC
    LIMIT $2
    `,[guest_id, limit])
    .then(res => {
      if (res.rows.length === 0) {
        return null;
      }
      return res.rows
    })
    .catch(err => console.log('error: ',err.message));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    if (queryParams.length>1){
      queryString += `AND owner_id = $${queryParams.length}`
    } else {
      queryString += `WHERE owner_id = $${queryParams.length}`
    };
  }
  
  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night)*100);
    if (queryParams.length>1){
      queryString += ` AND cost_per_night >= $${queryParams.length}`
    } else {
      queryString += `WHERE cost_per_night >= $${queryParams.length}`
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night)*100);
    if (queryParams.length>1){
      queryString += ` AND cost_per_night <= $${queryParams.length}`
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length}`
    }
  }

  queryString += `
  GROUP BY properties.id`
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }
  queryParams.push(limit);
  queryString +=`
  ORDER BY cost_per_night 
  LIMIT $${queryParams.length}
  `
  console.log(queryString,queryParams)
  return db.query(queryString,queryParams)
  .then(res=>res.rows);
}

exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
 
  return db
  .query(`
  INSERT INTO properties (
    title, 
    description, 
    owner_id, 
    cover_photo_url, 
    thumbnail_photo_url, 
    cost_per_night, 
    parking_spaces, 
    number_of_bathrooms, 
    number_of_bedrooms, 
    province, 
    city, country, 
    street, 
    post_code) 
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING *
  `,[
    property.title, 
    property.description, 
    property.owner_id, 
    property.cover_photo_url, 
    property.thumbnail_photo_url, 
    property.cost_per_night*100, 
    property.parking_spaces, 
    property.number_of_bathrooms, 
    property.number_of_bedrooms, 
    property.province, 
    property.city, 
    property.country, 
    property.street,
    property.post_code 
  ])
  .then(res=>res.rows[0])
  .catch(err => console.log('error: ',err.message));
}

exports.addProperty = addProperty;