const functions = require("firebase-functions");

const app = require('express')();

const { getAllScreams, postOneScream } = require('./handlers/screams')
const { register, login, uploadImage } = require('./handlers/users')

const fbAuth  = require('./util/fbAuth')

// Scream routes
app.get('/screams', getAllScreams);
// POST one scream
app.post('/scream', fbAuth, postOneScream);

// User routes 
app.post('/register', register);
app.post('/login', login)
app.post('/user/image', fbAuth, uploadImage)

exports.api = functions.https.onRequest(app);