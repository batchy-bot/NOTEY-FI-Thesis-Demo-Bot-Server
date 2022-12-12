'use strict';

require('dotenv').config();

const
    request = require('request'),
    express = require('express'),
    { urlencoded, json } = require('body-parser'),
    mongoose = require('mongoose'),
    app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

mongoose.connect('mongodb://localhost:27017/noteyfi_data', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', () => console.log('Error in Connecting to Database'));
db.once('open', () => console.log('Connected to Database'));

app.post('/check_user', (req, res) => {

    const userPSID = req.body.userPSID;
    db.collection('noteyfi_users').findOne({
        userPSID: userPSID
    }, (err, result) => {
        if (err) throw err

        if (result != null) {
            res.send(true)
        } else {
            res.send(false)
            //console.log(`USER: ${userPSID} has not yet subscribed!`)
        }

    })

});

app.post('/store_new_user', (req, res) => {

    db.collection('noteyfi_users').insertOne(req.body)
});

app.get('/get_lastmsg', (req, res) => {
    console.log(req.body)
})

function addNewUser(newUser) {
    request({
        url: `http://localhost:8080/store_new_user`,
        method: 'POST',
        json: true,
        body: newUser
    }, (err, res, body) => {
        if (err) throw err;
    }
    )
}

function promptSubscribe(participantPSID) {

    const subscribeBody = {
        "recipient": {
            "id": participantPSID
        },
        "messaging_type": "RESPONSE",
        "message": {
            "text": "Choose:",
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "Subscribe",
                    "payload": "<POSTBACK_PAYLOAD>",
                    "image_url": "https://img.icons8.com/emoji/344/blue-circle-emoji.png"
                }
            ]
        }
    }

    request({
        uri: `https://graph.facebook.com/v15.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        method: 'POST',
        json: true,
        body: subscribeBody
    }, (err, res, body) => {
        if (err) throw err;
    })
}

function verifyUser(participantPSID, participantID) {

    request(
        {
            url: `http://localhost:8080/check_user`,
            method: 'POST',
            json: true,
            body: { userPSID: participantPSID }
        }, (err, res, body) => {
            if (err) throw err;

            // if not yet subscribed
            if (body == false) {
                promptSubscribe(participantPSID)
                // get last message
                request(
                    {
                        url: `https://graph.facebook.com/v15.0/${participantID}?fields=messages{message}&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
                        method: 'GET',
                        json: true
                    }, (err, res, body) => {
                        if (err) throw err;
                        const lastMsg = body.messages.data[0].message
                        if (lastMsg.toLowerCase() == 'subscribe') {
                            addNewUser({ userPSID: participantPSID, userID: participantID })
                        }
                    }
                )
            }
            // if already subscribed
            else {
                console.log(participantID + ' is already subscirbed')
            }
        }
    )
}

function allconv() {
    setInterval(() => {
        request(
            {
                url: `https://graph.facebook.com/v15.0/105752072252865/conversations?fields=participants&access_token=${process.env.PAGE_ACCESS_TOKEN}&`,
                method: 'GET',
                json: true
            }, (err, res, body) => {
                if (err) throw err;

                // iterate every participant
                for (let participantData of body.data) {
                    // participant
                    console.log(participantData)
                    const participantPSID = participantData.participants.data[0].id;
                    const participantID = participantData.id;
                    verifyUser(participantPSID, participantID)
                }
            }
        )
    }, 2500);
}

allconv()
app.listen(8080, console.log('Server is listening to 8080'))