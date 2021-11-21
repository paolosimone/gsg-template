# GSheets Site Generator

Sample project that uses Github Actions to statically generate a website starting 
from the content of a GSheet and then host it on Github Pages.

See the result [here](https://paolosimone.github.io/gsg-template/)

## Instructions

Requirements:
- Google account (free)
- Github account (free)

### Get Google Credentials 

1. Login to [Google Cloud Platform](https://console.cloud.google.com/home/dashboard)
1. Create a new project
1. In "API & Services"->"Library" enable Google Sheets API
1. In "API & Services"->"Credentials" create a new API Key (`API_KEY`)
    - restrict access to the Google Sheets API
1. In "API & Services"->"Credentials" create a new Service Account
    - IMPORTANT: safely store the JSON file containing the account private key `PRIVATE_KEY`

### Create the GSheet

1. Create a new Google Sheet
    - take note of the sheet id `spreadsheetId` from the url 
1. Click "Share" and provide read access to the Service Account
1. Insert data as you want (manually, with GForms, scripting...)

### Build Script

1. Read `API_KEY` and `PRIVATE_KEY` from environment variables
1. Use those secrets to retrieve the spreadsheet content
    1. Authenticate using OAuth 2.0 and obtain a JWT token ([API docs](https://developers.google.com/identity/protocols/oauth2/service-account#authorizingrequests))
    1. Use JWT token to get spreadsheet values ([API docs](https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get))
1. Build the website resources and write them in the `docs` folder

Take a look at the simple example `build.js` on how to perform those steps using vanilla NodeJS.

### Setup Github Actions

1. Create a new branch `gh-pages`
1. Create a workflow that
    1. Checkout repository
    1. Run the build script
    1. Commit and push the `docs` folder
1. Add `API_KEY` and `PRIVATE_KEY` as Github Actions secrets ([Github documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets))

Take a look at the `.github/workflows/build-and-publish.yaml` as a sample reference.

### Enable Github Pages

1. Publish the website by enabling Github Pages on `gh-pages` branch ([Github documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site))
1. ???
1. Profit... actually, don't! Please respect Github Pages [Terms & Conditions](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#prohibited-uses)