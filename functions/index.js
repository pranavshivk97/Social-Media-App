const functions = require("firebase-functions");
const admin = require('firebase-admin')
const app = require('express')();

admin.initializeApp()

// from Firebase docs
const firebaseConfig = {
    apiKey: "AIzaSyCKN3WATG9t9Ps49sIv3u2O6j0gF6BH7Tc",
    authDomain: "socialapp-7f8a3.firebaseapp.com",
    projectId: "socialapp-7f8a3",
    storageBucket: "socialapp-7f8a3.appspot.com",
    messagingSenderId: "59613456677",
    appId: "1:59613456677:web:a2be7e9d4a69485039d2cc",
    measurementId: "G-JS6EFBLB7Q"
  };

const firebase = require('firebase')
firebase.initializeApp(firebaseConfig)


const db = admin.firestore()

app.get('/screams', (req, res) => {
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
        let screams = [];
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });

        return res.json(screams)
    })
    .catch(error => console.error(error))
})

app.post('/scream', (req, res) => {
    // // Handles cases where methods other than POST are sent for firebase
    // if (req.method != 'POST') {
    //     return res.status(400).json({ message: 'Method not allowed' })
    // }
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db
    .collection('screams')
    .add(newScream)
    .then((doc) => {
        return res.json({ message: `document ${doc.id} created successfully`});
    })
    .catch(error => {
        res.status(500).json({ error: "Something went wrong"})
        console.error(error)
    })
})

// Sign up route

app.post('/register', (req, res) => {
    // form data
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    // TODO: validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'This handle is already in use' })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId 
            }

            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ message: 'Email is already in use' })
            } else {
                return res.status(500).json({ error: err.code })
            }
        })
})

exports.api = functions.https.onRequest(app);