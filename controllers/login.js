const connection = require("../config/mysql-db");
const { sendSMS } = require("../helpers/send-sms");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const loginQuery = `SELECT *
    FROM loginUsers
    WHERE phoneNumber = '${phoneNumber}'
    `;

    connection.query(loginQuery, async (error, results) => {
      if (error) {
        res.json({
          status: "Failed",
          message: "An error occured while trying to login",
          error: error.message,
        });
      } else {
        if (results.length < 1) {
          res.json({
            status: "Failed",
            message: "User with the given phoneNumber doesn't exist",
          });
        } else {
          //send otp
          const rawOtp = Math.floor(1000 + Math.random() * 9000).toString();

          sendSMS(phoneNumber, rawOtp)
            .then((response) => {
              res.json({
                status: "Success",
                message: "Otp has been sent to your phone number",
              });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "Failed",
                message: "Failed to send SMS",
                error: error.message,
              });
            });
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while trying to send notification",
      error: error.message,
    });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp, phoneNumber, deviceToken } = req.body;
    const checkerQuery = `SELECT * FROM temp_otp WHERE phoneNumber = ${phoneNumber}`;

    connection.query(checkerQuery, async (error, results) => {
      if (error) {
        res.json({
          status: "Failed",
          message: "An error occured while trying to verify otp",
          error: error.message,
        });
      } else {
        if (results.length > 0) {
          const existingRecord = results[0];
          const expiryDate = existingRecord.expiryDate;

          if (new Date(expiryDate) < new Date()) {
            //delete record

            //expired res
            console.log("Has expired");
            res.json({
              status: "Failed",
              message: "Invalid otp entered",
            });
          } else {
            //check if valid
            const storeOtp = existingRecord.otp;
            const validOtp = await bcrypt.compare(otp, storeOtp);
            if (validOtp) {
              //delete
              deleteOtpRecord(phoneNumber);

              //200 res
              //store token/update user record
              if (deviceToken) {
                const updateQuery = `UPDATE loginUsers SET deviceToken = '${deviceToken}' WHERE phoneNumber = '${phoneNumber}'`;
                connection.query(updateQuery, (error, results) => {
                  if (error) {
                    console.log(error);
                    res.json({
                      status: "Failed",
                      message: "An error occured while trying to verify otp",
                      error: error.message,
                    });
                  }
                });
              }
              const userQuery = `SELECT * FROM loginUsers WHERE phoneNumber = ?`;
              connection.query(userQuery, [phoneNumber], (error, results) => {
                if (error) {
                  console.log(error);
                  res.json({
                    status: "Failed",
                    message: "An error occured while getting user data",
                    error: error.message,
                  });
                } else {
                  res.json({
                    status: "Success",
                    message: "Otp verified successfully",
                    data: results[0],
                  });
                }
              });
            } else {
              console.log("Wrong otp");

              res.json({
                status: "Failed",
                message: "Invalid otp entered",
              });
            }
          }
        } else {
          res.json({
            status: "Failed",
            message:
              "No otp record found for your phone number. Please request another",
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while trying to verify otp",
      error: error.message,
    });
  }
};

function deleteOtpRecord(phoneNumber) {
  try {
    const deleteQuery = `DELETE FROM temp_otp WHERE phoneNumber = ${phoneNumber}`;
    connection.query(deleteQuery, (error, results) => {
      if (error) {
        console.log(error.message);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
}

exports.createSoldier = async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, deviceToken } = req.body;

    //check if soldier with the given phone already exists
    const checkQuery = `SELECT * FROM loginUsers WHERE phoneNumber = ?`;

    connection.query(checkQuery, [phoneNumber], (error, results) => {
      if (error) {
        console.log(error);
        res.json({
          status: "Failed",
          message: "An error occured while checking existing records",
          error: error.message,
        });
      } else {
        if (results.length > 0) {
          res.json({
            status: "Failed",
            message: "Soldier with the given phone number already exists",
          });
        } else {
          const storeQuery = `INSERT
            INTO loginUsers (phoneNumber, firstName, lastName, deviceToken)
            VALUES (?, ?, ?, ?)`;

          connection.query(
            storeQuery,
            [phoneNumber, firstName, lastName, deviceToken],
            async (error, results) => {
              if (error) {
                console.log(error);
                res.json({
                  status: "Failed",
                  message: "An error occured while trying to login",
                  error: error.message,
                });
              } else {
                res.json({
                  status: "Success",
                  message: "Soldier created successfully",
                });
              }
            }
          );
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while trying to send notification",
      error: error.message,
    });
  }
};
