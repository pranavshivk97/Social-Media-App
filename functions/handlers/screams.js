const { db } = require('../util/admin')

exports.getAllScreams = (req, res) => {
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
}

exports.postOneScream = (req, res) => {
    // // Handles cases where methods other than POST are sent for firebase
    // if (req.method != 'POST') {
    //     return res.status(400).json({ message: 'Method not allowed' })
    // }
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
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
}

// Haven't added the comment collection yet
exports.getScream = (req, res) => {
    let screamData = {};

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: "Scream not found!" });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', req.params.screamId).get();
        })
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data())
            })
            return res.json(screamData);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err });
        })
}

exports.commentOnScream = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ error: "Must not be empty" })
    }
    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' })
            }
            db.collection('comments').add(newComment);
        })
        .then(() => {
            return res.json(newComment);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: 'Something went wrong' });
        })
}