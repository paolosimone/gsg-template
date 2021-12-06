/** Build **/

const { readFileSync, mkdirSync, writeFileSync } = require('fs')

const SPREADSHEET = "1AZvxsIN17qptckg-dcFZXaGv3o6GKOX5ukpQpMrojV8";
const RANGE = "A1:A1000";

const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");

function build() {
  getFruits((fruits) => {
    const list = fruits
      .map((fruit) => `<li>${fruit}</li>`)
      .join("");

    const index = readFileSync("index.html")
      .toString()
      .replace("{{content}}", `<ul>${list}</ul>`);

    mkdirSync("docs", {recursive: true});
    writeFileSync("docs/index.html", index);
  })
}

/** Data Retrieval **/

function getFruits(resolve) {
  getJWT((jwt) => {
    getValues(jwt, SPREADSHEET, RANGE, (values) => {
      resolve(values.map(row => row[0]));
    });
  });
}

function getValues(jwt, spreadsheetId, range, resolve) {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`
  );

  const headers = { Authorization: `Bearer ${jwt}` };

  get(url, headers, (res) => {
    resolve(res.values);
  });
}

/** Authentication **/

const { Buffer } = require("buffer");
const { createSign } = require("crypto");

function getJWT(resolve) {
  const url = new URL("https://oauth2.googleapis.com/token");

  const body = {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: buildBearerToken(),
  };

  post(url, body, {}, (res) => {
    resolve(res.access_token);
  });
}

function buildBearerToken() {
  const header = Buffer.from('{"alg":"RS256","typ":"JWT"}', "utf8").toString(
    "base64url"
  );

  const now = Math.floor(Date.now() / 1000);
  const claims = Buffer.from(
    `{
    "iss": "${SERVICE_ACCOUNT}",
    "scope": "https://www.googleapis.com/auth/spreadsheets.readonly",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": ${now + 3600},
    "iat": ${now}
  }`
  ).toString("base64url");

  const sign = createSign("SHA256");
  sign.write(`${header}.${claims}`);
  sign.end();
  const signature = sign.sign(PRIVATE_KEY, "base64url");

  return `${header}.${claims}.${signature}`;
}

/** HTTP requests **/

const https = require("https");

function get(url, headers, resolve) {
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: "GET",
    headers: {
      ...headers,
      ...{
        Accept: "application/json",
      },
    },
  };

  const req = https.request(options, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk.toString()));
    res.on("end", () => resolve(JSON.parse(chunks.join())));
  });

  req.end();
}

function post(url, body, headers, resolve) {
  const data = new TextEncoder().encode(JSON.stringify(body));

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: "POST",
    headers: {
      ...headers,
      ...{
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    },
  };

  const req = https.request(options, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk.toString()));
    res.on("end", () => resolve(JSON.parse(chunks.join())));
  });

  req.write(data);
  req.end();
}

/** MAIN */

build();
