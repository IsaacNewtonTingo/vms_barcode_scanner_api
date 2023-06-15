const { Infobip, AuthType } = require("@infobip-api/sdk");

let infobip = new Infobip({
  baseUrl: process.env.INFOBIP_BASE_URL,
  apiKey: process.env.INFOBIP_API_KEY,
  authType: AuthType.ApiKey,
});

module.exports = infobip;
