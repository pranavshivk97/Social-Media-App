const functions = require("firebase-functions");

const app = require('express')();

const { getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')
const { register, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');
const { db } = require("./util/admin");

const fbAuth  = require('./util/fbAuth')

// Scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postOneScream);
app.get('/scream/:screamId', getScream);
// TODO: delete scream
app.delete('/scream/:screamId', fbAuth, deleteScream);
// TODO: like a scream
app.get('/scream/:screamId/like', fbAuth, likeScream);
// TODO: unlike scream
app.get('/scream/:screamId/unlike', fbAuth, unlikeScream);
// TODO: comment on scream
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

// User routes 
app.post('/register', register);
app.post('/login', login)
app.post('/user/image', fbAuth, uploadImage)
app.post('/user', fbAuth, addUserDetails);
app.get('/user', fbAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', fbAuth, markNotificationsRead);
    
exports.api = functions.https.onRequest(app);

// from firebase documentation -> database triggers
exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch(err => {
                console.error(err);
            })
    })

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete((snapshot) => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
                return;
            })
    })

exports.createNotificationOnComment = functions.firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`).get()
            .then(doc => {
                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        screamId: doc.id
                    });
                }
            })
            .catch(err => {
                console.error(err);
                return;
            })
    })

// updates user image when new profile pic is uploaded
exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            console.log('Image has changed')
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
                .then(data => {
                    data.forEach(doc => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, {userImage: change.after.data().imageUrl});
                    })
                    return batch.commit();
                })
        } else return true;
    })

exports.onScreamDeletion = functions.firestore.document('/screams/{screamId}')
    .onDelete((snapshot, context) => {
        const screamId = context.params.screamId;
        const batch = db.batch();

        return db.collection('comments').where('screamId', '==', screamId).get()
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                })
                return db.collection('likes').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                })
                return db.collection('notifications').where('screamId', '==', screamId).get()
            })
            .then(data => {
                data.forEach(doc => {
                    batch.delete(db.doc(`/notifications/${doc.id}`));
                })
                return batch.commit()
            })
            .catch(err => {
                console.error(err);
            })
    })