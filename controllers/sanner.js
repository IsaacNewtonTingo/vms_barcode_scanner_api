const { Expo } = require("expo-server-sdk");
const connection = require("../config/mysql-db");
const pool = require("../config/mysql-db");
const expo = new Expo();

exports.initiateScanner = async (req, res) => {
  try {
    const { deviceTokens, soldierID } = req.body;

    let notifications = [];
    const title = "Scanner initiated";
    const body = "Watch magic";
    //check if it's a valid expo token

    for (let token of deviceTokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.log(`Push token ${token} is not a valid Expo push token`);
      } else {
        // Construct the notification to send
        notifications.push({
          to: token,
          sound: "default",
          title: title,
          body: body,
          data: {
            soldierID,
          },
        });
      }
    }

    let chunks = expo.chunkPushNotifications(notifications);

    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);

        if (receipts[0].id) {
          let checkComplete = false;
          let storedSerialNumber = null;

          if (!checkComplete && !storedSerialNumber) {
            //keep checking

            const interval = setInterval(() => {
              console.log("---------Checking---------");
              connection.query(
                "SELECT serial_number FROM temp_serial_numbers WHERE soldier_id = ?",
                [soldierID],
                (err, results) => {
                  if (results?.length > 0) {
                    checkComplete = true;
                    storedSerialNumber = results[0].serial_number;

                    clearInterval(interval);
                    clearTimeout(timeout);

                    //check user details
                    connection.query(
                      "SELECT * FROM devices INNER JOIN users ON devices.user_id = users.id WHERE devices.serial_number = ?",
                      [storedSerialNumber],
                      (err, results) => {
                        if (err) {
                          console.error("Error executing query: ", err);
                          res.json({
                            status: "Failed",
                            message:
                              "An error occurred while getting user data associated with the serial number",
                            error: err,
                          });
                        } else {
                          res.json({
                            status: "Success",
                            message: "User data retrieved successfully",
                            data: results,
                          });

                          //delete the temp_serial record
                          const query = `DELETE FROM temp_serial_numbers WHERE serial_number = ?`;
                          connection.query(
                            query,
                            [storedSerialNumber],
                            (err, results) => {
                              if (err) {
                                console.error("Error executing query: ", err);
                                res.json({
                                  status: "Failed",
                                  message:
                                    "An error occurred while deleting serial number",
                                  error: err,
                                });
                              } else {
                                console.log(
                                  "Temporary serial number deleted successfully"
                                );
                              }
                            }
                          );
                        }
                      }
                    );
                  } else if (err) {
                    console.error("Error executing query: ", err);
                    return;
                  }
                }
              );
            }, 1000);

            const timeout = setTimeout(() => {
              clearInterval(interval);
              clearTimeout(timeout);
            }, 300000);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while trying to send notification",
      error: error.message,
    });
  }
};

//create a function that stores the serial number temporarily
exports.storeSerialNumber = async (req, res) => {
  try {
    //store with soldier id and serial number
    const { soldierID, serialNumber } = req.body;
    //perform store
    const insertQuery = `INSERT INTO temp_serial_numbers (soldier_id, serial_number) VALUES (?, ?)`;
    // Execute the query to insert the values
    connection.query(insertQuery, [soldierID, serialNumber], (err, results) => {
      if (err) {
        console.error("Error inserting values: ", err);
        res.status(500).json({
          status: "Failed",
          message: "An error occurred while inserting values",
          error: err.message,
        });
        return;
      }
      // Send a success response
      res.json({
        status: "Success",
        message: "Serial number stored successfully",
      });
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "An error occured while trying to store serialNumber",
      error: error.message,
    });
  }
};
