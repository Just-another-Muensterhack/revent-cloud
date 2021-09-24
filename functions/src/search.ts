import * as functions from "firebase-functions";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fetch from "node-fetch";

export const index = functions
    .region("europe-west3")
    .firestore
    .document("events/{eventId}")
    .onWrite(async (snapshot, context) => {
      const {solr} = functions.config();

      const authHeader = Buffer.from(`${solr.user}:${solr.pass}`)
          .toString("base64");

      const data = snapshot.after.data();
      if (data?.date) delete data.date; // TOOD: to iso

      const body = {
        add: {
          doc: {
            id: snapshot.after.id,
          },
        },
        commit: {},
      };
      Object.assign(body.add.doc, data);

      console.log(JSON.stringify(body));

      const res = await fetch(`${solr.base_url}/solr/revent/update`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log(res.status, res.statusText, JSON.stringify(text));

      return true;
    });

export const search = functions
    .region("europe-west3")
    .https
    .onRequest(async (req, res) => {
      res.sendStatus(418);
    });
