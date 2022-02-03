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