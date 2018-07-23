const functions = require('firebase-functions');
const axios = require('axios');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("(╯°□°）╯︵ ┻━┻");
});

exports.get_addresses = functions.https.onRequest((request, response) => {
    const firestore = admin.firestore();
    const collection = firestore.collection("public_addresses");
    const user_id = request.query.user_id;

    collection.doc(user_id).get()
        .then((doc) => {
            console.log('Query done')
            if(doc.exists) {
                return response.send(doc.data());
            } else {
                console.log('No results')
                return response.send('No results');
            }
        })
        .catch((error) => {
            console.log("Error getting public addresses: ", error);
            response.send("Error");
        });
});

exports.setup_addresses = functions.https.onRequest((request, response) => {
    console.log(request.body)
    const stellar_service = {
        url: "https://stellar.services.rehive.io/api/1/user/account/",
        service_name: "stellar"
    }
    const bitcoin_service = "https://bitcoin.services.rehive.io/api/1/user/"
    const services_array = [
        stellar_service
    ]
    const token = request.body.token;
    const user_id = request.body.user_id;
    var response_array = [];
    var has_errored = false;

    for (serv in services_array) {
        service = services_array[serv];
        console.log(service);
        console.log(service['url']);
        axios.get(
            service['url'],
            {
                headers: {
                    'Authorization': 'Token ' + token
                }
            }
        ).then(
            (response) => {
                console.log('GOT A RESPONSE!');
                console.log(response.data);
                console.log(user_id);
                // Write data to database
                data = {};
                data[service['service_name']] = response.data['details'];
                response_array.push(data);
                console.log('GOING TO BE WRITING TO DATABASE');
                const firestore = admin.firestore();
                const collection = firestore.collection("public_addresses");
                console.log('WRITING TO DATABASE');
                const document = collection.doc(user_id).set(data);
                return true;
            }
        ).catch((error) => {
            console.log(error);
            var has_errored = true;
        });
    }

    if(has_errored) {
        response.send("Error");
    } else {
        response.send("Success");
    }
});
