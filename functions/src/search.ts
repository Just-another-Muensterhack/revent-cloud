import * as functions from "firebase-functions";

export const index = functions
    .region("europe-west3")
    .firestore
    .document("/")
    .onWrite(async (snapshot, update) => {
      console.log(update.eventType);
    });

export const search = functions
    .region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      res.sendStatus(418);
    });
