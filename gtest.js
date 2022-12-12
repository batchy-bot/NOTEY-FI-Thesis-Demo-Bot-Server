const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const request = require('request');
const { urlencoded, json } = require('body-parser')

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

app.use(urlencoded({ extended: true }));
app.use(json());
mongoose.connect('mongodb://localhost:27017/noteyfi_data', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
var db = mongoose.connection;
db.on('error', () => console.log('Error in Connecting to Database'));
db.once('open', () => console.log('Connected to Database'));


/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });

    await db.collection('noteyfi_users').updateOne(
        { name: 'Kyle Revin' },
        {
            $push: {
                vle_accounts: JSON.parse(payload)
            }
        }
    )
}

authorize()