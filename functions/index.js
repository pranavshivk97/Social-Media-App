const functions = require("firebase-functions");

const app = require('express')();

const { getAllScreams, postOneScream, getScream, commentOnScream } = require('./handlers/screams')
const { register, login, uploadImage, addUserDetails, getAuthenticatedUser } = require('./handlers/users')

const fbAuth  = require('./util/fbAuth')

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postOneScream);
app.get('/scream/:screamId', getScream);
// TODO: delete scream
// TODO: like a scream
// TODO: unlike scream
// TODO: comment on scream
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

// User routes 
app.post('/register', register);
app.post('/login', login)
app.post('/user/image', fbAuth, uploadImage)
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);
    
exports.api = functions.https.onRequest(app);