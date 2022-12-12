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




function glassroom_test() {
    
    let payload;

    /**
     * Reads previously authorized credentials from the save file.
     *
     * @return {Promise<OAuth2Client|null>}
     */
    async function loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(TOKEN_PATH);
            const credentials = JSON.parse(content);
            return google.auth.fromJSON(credentials);
        } catch (err) {
            return null;
        }
    }

    /**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
    async function saveCredentials(client) {
        const content = await fs.readFile(CREDENTIALS_PATH);
        const keys = JSON.parse(content);
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: client.credentials.refresh_token,
        });
        // await fs.writeFile(TOKEN_PATH, payload);
        await request({
            url: 'http://localhost:3030/store_usertoken',
            method: 'POST',
            json: true,
            body: JSON.parse(payload)
        }, (err, res, body) => {
            if (err) throw err;
        });
    }

    /**
     * Load or request or authorization to call APIs.
     *
     */
    async function authorize() {
        let client = await loadSavedCredentialsIfExist();
        if (client) {
            return client;
        }
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
            await saveCredentials(client);
        }
        return client;
    }

    /**
     * Lists the first 10 courses the user has access to.
     *
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    async function listCourses(auth) {
        const classroom = google.classroom({ version: 'v1', auth });
        const res = await classroom.courses.list({
            pageSize: 10,
        });
        const courses = res.data.courses;
        if (!courses || courses.length === 0) {
            console.log('No courses found.');
            return;
        }
        console.log('Courses:');
        courses.forEach((course) => {
            //console.log(`${course.name} (${course.id})`);
        });
    }

    authorize().then(listCourses).catch(console.error);

    return payload
}

module.exports.glassroom_test;

app.listen(3030);