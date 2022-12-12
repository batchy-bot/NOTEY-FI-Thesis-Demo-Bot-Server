"use strict";

require("dotenv").config();

const request = require("request"),
  express = require("express"),
  { urlencoded, json } = require("body-parser"),
  mongoose = require("mongoose"),
  app = express();

/** auth vars */
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const { tagmanager } = require("googleapis/build/src/apis/tagmanager");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/classroom.courses.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/** auth vars */

app.use(urlencoded({ extended: true }));
app.use(json());

mongoose.connect("mongodb://localhost:27017/noteyfi_data", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
var db = mongoose.connection;
db.on("error", () => console.log("Error in Connecting to Database"));
db.once("open", () => console.log("Connected to Database"));

const PAGE_ID = process.env.PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

function convoUser() {
  /** GET ALL ACTIVE CONVERSATIONS */

  request(
    {
      url: `https://graph.facebook.com/v15.0/${PAGE_ID}/conversations?fields=participants&access_token=${PAGE_ACCESS_TOKEN}`,
      method: "GET",
      json: true,
    },
    (err, res, body) => {
      try {
        /** for every participant in body.data */
        for (let data of body.data) {
          const conversationID = data["id"];
          const currUser = data.participants.data[0].name;

          /** GET LIST OF MESSAGES IN A CONVERSATION */
          request(
            {
              url: `https://graph.facebook.com/v15.0/${conversationID}?fields=messages&access_token=${PAGE_ACCESS_TOKEN}`,
              method: "GET",
              json: true,
            },
            (err, res, body) => {
              try {
                const messagesData = body.messages.data;
                const lastMessageID = messagesData[0].id;

                /** GET INFORMATION ABOUT THE LAST MESSAGE */
                request(
                  {
                    url: `https://graph.facebook.com/v15.0/${lastMessageID}?fields=id,created_time,from,to,message&access_token=${PAGE_ACCESS_TOKEN}`,
                    method: "GET",
                    json: true,
                  },
                  (err, res, body) => {
                    try {
                      if (body) {
                        if (body.from.name != "Notification Bot Test") {
                          console.log(body.message, "\n");

                          const user_id = body.from.id;
                          const user_name = body.from.name;
                          const user_message = body.message;

                          /** Respond to the user */
                          botRespond(body.from, user_message);
                        }
                      }
                    } catch (error) {
                      console.log(error);
                    }
                  }
                );
              } catch (error) {
                console.log(error);
              }
            }
          );
        }
      } catch (error) {
        console.log(error);
      }
    }
  );
}

function sendQuickReplies(targetPSID, qReps, qRepsText) {
  let quick_replies = [];

  for (let rep of qReps) {
    let newRep = {
      content_type: "text",
      title: `${rep}`,
      payload: "<POSTBACK_PAYLOAD>",
      image_url: "",
    };

    quick_replies.push(newRep);
  }

  let qrBody = {
    recipient: {
      id: "" + targetPSID + "",
    },
    messaging_type: "RESPONSE",
    message: {
      text: qRepsText,
      quick_replies: quick_replies,
    },
  };

  request(
    {
      url: `https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      method: "POST",
      json: true,
      body: qrBody,
    },
    (err, res, body) => {}
  );
}
function sendText(targetPSID, message) {
  try {
    request(
      {
        url: `https://graph.facebook.com/v15.0/${PAGE_ID}/messages?recipient={'id':'${targetPSID}'}&messaging_type=MESSAGE_TAG&message={'text':'${message}'}&tag=CONFIRMED_EVENT_UPDATE&access_token=${PAGE_ACCESS_TOKEN}`,
        method: "POST",
        json: true,
      },
      (err, res, body) => {}
    );
  } catch (error) {
    console.log(error);
  }
}
function sendURLBtn(targetPSID) {
  let btnBody = {
    recipient: {
      id: targetPSID,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Sign in to VLE Platform",
          buttons: [
            {
              type: "web_url",
              url: "https://accounts.google.com/o/oauth2/auth?client_id=717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com&scope=profile+email&redirect_uri=https%3a%2f%2fstackauth.com%2fauth%2foauth2%2fgoogle&state=%7b%22sid%22%3a1%2c%22st%22%3a%2259%3a3%3abbc%2c16%3a97bb9ef87eea3861%2c10%3a1667198002%2c16%3ac4a3de8e3dbfc0fd%2c09db9454c52adde730b6c724934b0091cb3201b3d6355cd0aa308e30005734b3%22%2c%22cid%22%3a%22717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com%22%2c%22k%22%3a%22Google%22%2c%22ses%22%3a%226e60de4450e547118c5b9c158c002e21%22%7d&response_type=code",
              title: "Sign in to Google Classroom",
              webview_height_ratio: "full",
            },
            {
              type: "web_url",
              url: "https://accounts.google.com/o/oauth2/auth?client_id=717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com&scope=profile+email&redirect_uri=https%3a%2f%2fstackauth.com%2fauth%2foauth2%2fgoogle&state=%7b%22sid%22%3a1%2c%22st%22%3a%2259%3a3%3abbc%2c16%3a97bb9ef87eea3861%2c10%3a1667198002%2c16%3ac4a3de8e3dbfc0fd%2c09db9454c52adde730b6c724934b0091cb3201b3d6355cd0aa308e30005734b3%22%2c%22cid%22%3a%22717762328687-iludtf96g1hinl76e4lc1b9a82g457nn.apps.googleusercontent.com%22%2c%22k%22%3a%22Google%22%2c%22ses%22%3a%226e60de4450e547118c5b9c158c002e21%22%7d&response_type=code",
              title: "Sign in to Moodle",
              webview_height_ratio: "full",
            },
          ],
        },
      },
    },
  };

  request(
    {
      url: `https://graph.facebook.com/v2.6/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      method: "POST",
      json: true,
      body: btnBody,
    },
    (err, res, body) => {
      if (err) throw err;
    }
  );
}
function sendMenu(targetPSID) {
  sendQuickReplies(
    targetPSID,
    ["Add VLE Account", "Set Reminders", "Unsubscribe", "Show Courses"],
    "Menu:"
  );
}
function botRespond(targetUserBody, uMsg) {
  const targetPSID = targetUserBody.id;
  const userMsg = uMsg.toLowerCase();

  if (userMsg == "get started") {
    sendQuickReplies(targetPSID, ["Subscribe"], `Press 'Subscribe'`);
  } else if (userMsg == "subscribe") {
    // add the new user to database
    request(
      {
        url: "http://localhost:8080/store_new_user",
        method: "POST",
        json: true,
        body: targetUserBody,
      },
      (err, res, body) => {
        if (err) throw err;
      }
    );
    setTimeout(() => {
      sendText(targetPSID, "You have now subscribed to NOTEY-FI!");
      setTimeout(() => {
        sendMenu(targetPSID);
      }, 600);
    }, 500);
  } else if (userMsg == "unsubscribe") {
    //remove the user from database
    request(
      {
        url: "http://localhost:8080/remove_user",
        method: "POST",
        json: true,
        body: targetUserBody,
      },
      (err, res, body) => {}
    );
    setTimeout(() => {
      sendText(targetPSID, "You have now unsubscribed to NOTEY-FI!");
      setTimeout(() => {
        sendQuickReplies(
          targetPSID,
          ["Subscribe"],
          "Click 'Subscribe' to subscribe again."
        );
      }, 600);
    }, 500);
  } else if (userMsg == "add vle account") {
    async function authorize() {
      let client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });
      const content = await fs.readFile(CREDENTIALS_PATH);
      const keys = JSON.parse(content);
      const key = keys.installed || keys.web;
      const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
      });
      console.log(key);

      await db
        .collection("noteyfi_users")
        .updateOne(
          { id: targetPSID },
          {
            $push: {
              vle_accounts: JSON.parse(payload),
            },
          }
        )
        .then(sendText(targetPSID, "Successfully added VLE account!"))
        .finally(sendMenu(targetPSID));
    }
    sendURLBtn(targetPSID);
    setTimeout(() => {
      setTimeout(() => {
        sendText(targetPSID, "Please wait...");
        authorize();
      }, 600);
    }, 500);
  } else if (userMsg == "menu") {
    sendMenu(targetPSID);
  } else if (userMsg == "show courses") {
    db.collection("noteyfi_users").findOne(
      { id: targetPSID },
      (err, result) => {
        const targetTokens = result.vle_accounts;
        targetTokens.forEach((targetToken) => {
          /**
           * Reads previously authorized credentials from the save file.
           *
           * @return {Promise<OAuth2Client|null>}
           */
          async function loadSavedCredentialsIfExist() {
            try {
              const content = await targetToken;
              const credentials = JSON.parse(JSON.stringify(content));
              return google.auth.fromJSON(credentials);
            } catch (err) {
              return null;
            }
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
          }

          /**
           * Lists the first 10 courses the user has access to.
           *
           * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
           */
          let coursesMsg = "";
          async function listCourses(auth) {
            const classroom = google.classroom({ version: "v1", auth });
            const res = await classroom.courses.list({
              pageSize: 10,
            });
            const courses = res.data.courses;
            if (!courses || courses.length === 0) {
              console.log("No courses found.");
              return;
            }
            console.log("Courses:");
            courses.forEach((course) => {
              //console.log(`${course.name} (${course.id})`);
              coursesMsg += course.name + "\n";
            });

            db.collection("noteyfi_users").findOne(
              {
                id: targetPSID,
              },
              (err, result) => {
                if (err) throw err;
                if (!result.courses) {
                  db.collection("noteyfi_users").updateOne(
                    { id: targetPSID },
                    {
                      $push: {
                        courses: courses,
                      },
                    }
                  );
                }
              }
            );

            db.collection("noteyfi_users").findOne(
              { id: targetPSID },
              (err, result) => {
                if (err) throw err;
                if (result.courses) {
                  const tcourses = result.courses[0];
                  for (let tcourse of tcourses) {
                    console.log(tcourse);
                    sendText(targetPSID, tcourse.name);
                  }
                }
              }
            );
          }
          authorize().then(listCourses).catch(console.error);
        })
        sendMenu(targetPSID);
      }
    );
  } else {
    setTimeout(() => {
      sendText(targetPSID, "Unknown Command");
      setTimeout(() => {
        sendMenu(targetPSID);
      }, 1000);
    }, 0);
  }
}
app.post("/remove_user", (req, res) => {
  db.collection("noteyfi_users").deleteOne(req.body);
});
app.post("/store_new_user", (req, res) => {
  db.collection("noteyfi_users").findOne(req.body, (err, result) => {
    if (result == null) {
      db.collection("noteyfi_users").insertOne(req.body, (err, result) => {});
    }
  });
});

setInterval(() => {
  convoUser();
}, 4500);

app.listen(8080, console.log("Server is listening to 8080"));