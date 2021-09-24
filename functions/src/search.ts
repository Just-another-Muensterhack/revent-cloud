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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line camelcase,max-len
      const {organizer, title, description, date, genre, price_class} = snapshot.after.data();

      const data = {
        organizer,
        title,
        description,
        date,
        genre,
        price_class,
      };

      if (data?.date) {
        const date = new Date(data.date._seconds * 1000);
        data.date = date.toISOString();
      }

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
      const {solr} = functions.config();
      const {term, startDate, endDate, genre, priceClass} = req.body;

      const authHeader = Buffer.from(`${solr.user}:${solr.pass}`)
          .toString("base64");

      const body: { query: string, filter: string[] } = {
        query: `search_text: ${term}`,
        filter: [],
      };

      if (startDate && endDate) {
        body.filter.push(`date: [${startDate} TO ${endDate}]`);
      }

      if (genre) {
        body.filter.push(`genre: (${genre.join(" OR ")})`);
      }

      if (priceClass) {
        body.filter.push(`price_class: ${priceClass}`);
      }

      const response = await fetch(`${solr.base_url}/solr/revent/query`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      console.log(res.status, response.statusText, JSON.stringify(text));

      res.send(text.response);
    });
