const axios = require("axios");
const connection = require("../config/mysql-db");
const bcrypt = require("bcrypt");

require("dotenv").config();
async function sendSMS(phoneNumber, rawOtp) {
  try {
    // check if the user has a pending code
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpChekerQuery = `SELECT * FROM temp_otp WHERE phoneNumber = ${phoneNumber}`;

    // Wrap the entire function in a Promise
    return new Promise((resolve, reject) => {
      connection.query(otpChekerQuery, (error, results) => {
        if (error) {
          reject(error.message); // Reject the promise with the error
        } else {
          if (results.length > 0) {
            // delete existing then store
            const deleteQuery = `DELETE FROM temp_otp WHERE phoneNumber = ${phoneNumber}`;
            connection.query(deleteQuery, (err, results) => {
              if (err) {
                reject(err.message); // Reject the promise with the error
              } else {
                // store
                storeOtp(phoneNumber, rawOtp, hashedOtp)
                  .then(() => resolve()) // Resolve the promise without a value
                  .catch((err) => reject(err)); // Reject the promise with the error
              }
            });
          } else {
            // just store
            storeOtp(phoneNumber, rawOtp, hashedOtp)
              .then(() => resolve()) // Resolve the promise without a value
              .catch((err) => reject(err)); // Reject the promise with the error
          }
        }
      });
    });
  } catch (error) {
    return Promise.reject({ error }); // Reject the promise with the error
  }
}

async function storeOtp(phoneNumber, rawOtp, hashedOtp) {
  try {
    const storeQuery = `INSERT INTO temp_otp (phoneNumber, otp) VALUES (?, ?)`;
    return new Promise((resolve, reject) => {
      connection.query(storeQuery, [phoneNumber, hashedOtp], (error, res) => {
        if (error) {
          console.log(error);
          reject(error.message); // Reject the promise with the error
        } else {
          sendOtp(phoneNumber, rawOtp)
            .then(() => resolve()) // Resolve the promise without a value
            .catch((err) => reject(err)); // Reject the promise with the error
        }
      });
    });
  } catch (error) {
    return Promise.reject({ error: error.message }); // Reject the promise with the error
  }
}

async function sendOtp(phoneNumber, rawOtp) {
  try {
    const url = process.env.INFOBIP_SMS_URL;
    const payload = {
      messages: [
        {
          destinations: [
            {
              to: phoneNumber,
            },
          ],
          from: process.env.INFOBIP_SENDER,
          text: rawOtp,
        },
      ],
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "App " + process.env.INFOBIP_API_KEY,
      },
    });

    return { response: response.data };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  sendSMS,
};
