const functions = require("firebase-functions");
const admin = require('firebase-admin')

admin.initializeApp()

const express = require('express');
const app = express()

app.get('/screams', (req, res) => {
    admin
    .firestore()
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

    admin.firestore()
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

exports.api = functions.https.onRequest(app);