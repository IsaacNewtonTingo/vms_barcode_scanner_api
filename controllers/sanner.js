const { Expo } = require("expo-server-sdk");
const connection = require("../config/mysql-db");
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
          //wait for serial number from scanner
          //keep checking for serial number availability in db
          //if serial number exists,get records, delete the serial number
          //we can set a timeout of 5 minutes then deletes the serial number
          //after the timeout elapses, you will need to initiate another sequence
          //scan one device at a time
          //when storing the serial number, store the identifier of the user that needs that serial number
          //user identifier can be passed through notification
          let checkComplete = false;
          let storedSerialNumber = null;

          if (!checkComplete && !storedSerialNumber) {
            //keep checking

            const interval = setInterval(() => {
              //run our check in here. Hit db endpoint
              //check if record with soldierID exists
              /*
               * if record exists, hit endpoint to check user records
               * clear interval and timeout
               * set check complete to true and update storedSerialNumber
               * return the record as response to vms portal
               * Delete serial number record
               *
               */

              console.log("---------Checking---------");
              connection.query(
                "SELECT * FROM temp_serial_number WHERE soldier_id = ?",
                [soldierID],
                (err, results) => {
                  if (results?.length > 0) {
                    checkComplete = true;
                    storedSerialNumber = results;
                    res.send(results);
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
    // Define the SQL query to create the table
    const createTableQuery = `CREATE TABLE IF NOT EXISTS temp_serial_number (
        soldier_id INT,
        serial_number VARCHAR(255)
      );`;

    connection.query(createTableQuery, (err, results) => {
      if (err) {
        console.error("Error creating table: ", err);
        res.status(500).json({
          status: "Failed",
          message: "An error occurred while creating the table",
          error: err.message,
        });
        return;
      }
      console.log("Table created successfully");

      // Define the SQL query to insert the values
      const insertQuery = `INSERT INTO temp_serial_number (soldier_id, serial_number) VALUES (?, ?)`;

      // Execute the query to insert the values
      connection.query(
        insertQuery,
        [soldierID, serialNumber],
        (err, results) => {
          if (err) {
            console.error("Error inserting values: ", err);
            res.status(500).json({
              status: "Failed",
              message: "An error occurred while inserting values",
              error: err.message,
            });
            return;
          }
          console.log("Values inserted successfully");

          // Send a success response
          res.json({
            status: "Success",
            message: "Table created, and values inserted successfully",
          });
        }
      );
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
