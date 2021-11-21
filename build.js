/** Build **/

const { readFileSync, mkdirSync, writeFileSync } = require('fs')

function build() {
  getRows(rows => {
    const list = rows
      .map(row => `<li>${row}</li>`)
      .join("")

    const index = readFileSync("index.html")
      .toString()
      .replace("{{content}}", `<ul>${list}</ul>`)

    mkdirSync("docs", {recursive: true})
    writeFileSync("docs/index.html", index)
  })
}


/** Data Retrieval **/

function getRows(resolve) {
  const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
  const apiKey = process.env.API_KEY

  const spreadsheetId = "1AZvxsIN17qptckg-dcFZXaGv3o6GKOX5ukpQpMrojV8"
  const range = "A1:A1000"

  getJWT(privateKey, jwt => {
    getValues(jwt, apiKey, spreadsheetId, range, values => {
      resolve(values.map(row => row[0]))
    })
  })
}

function getValues(jwt, apiKey, spreadsheetId, range, resolve) {
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`)
  url.searchParams.append('key', apiKey)

  const headers = {'Authorization': `Bearer ${jwt}`}

  get(url, headers, res => {
    resolve(res.values)
  })
}


/** Authentication **/

const { Buffer } = require('buffer')
const { createSign } = require('crypto')

function getJWT(privateKey, resolve) {
  const url = new URL("https://oauth2.googleapis.com/token")

  const body = {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: buildBearerToken(privateKey),
  }

  post(url, body, {}, res => {
    resolve(res.access_token)
  })
}

function buildBearerToken(privateKey) {
  const header = Buffer.from('{"alg":"RS256","typ":"JWT"}', 'utf8').toString('base64url')

  const now = Math.floor(Date.now() / 1000)
  const claims = Buffer.from(`{
    "iss": "gsheet@gsheet-site-generator.iam.gserviceaccount.com",
    "scope": "https://www.googleapis.com/auth/spreadsheets.readonly",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": ${now + 3600},
    "iat": ${now}
  }`).toString('base64url')

  const sign = createSign('SHA256')
  sign.write(`${header}.${claims}`)
  sign.end()
  const signature = sign.sign(privateKey, 'base64url')

  return `${header}.${claims}.${signature}`
}


/** HTTP requests **/

const https = require('https')

function get(url, headers, resolve) {
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'GET',
    headers: {
      ...headers,
      ...{
        'Accept': 'application/json',
      }, 
    },
  }

  const req = https.request(options, res => {
    const chunks = []
    res.on('data', chunk => chunks.push(chunk.toString()))
    res.on('end', () => resolve(JSON.parse(chunks.join())))
  })

  req.end()
}


function post(url, body, headers, resolve) {
  const data = new TextEncoder().encode(JSON.stringify(body))

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      ...headers,
      ...{
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }, 
    },
  }

  const req = https.request(options, res => {
    const chunks = []
    res.on('data', chunk => chunks.push(chunk.toString()))
    res.on('end', () => resolve(JSON.parse(chunks.join())))
  })

  req.write(data)
  req.end()
}


/** MAIN */

build()