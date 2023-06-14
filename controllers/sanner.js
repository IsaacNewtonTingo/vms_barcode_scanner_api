const { Expo } = require("expo-server-sdk");
const connection = require("../config/mysql-db");
const pool = require("../config/mysql-db");
const firebaseAdmin = require("../config/firebase-admin");
const expo = new Expo();

exports.initiateScanner = async (req, res) => {
  try {
    console.log("----------Scan initiated---------");
    const { deviceToken, soldierFirstName, soldierLastName, soldierID } =
      req.body;

    //delete all existing soldier id records
    const deleteQuery = `DELETE FROM temp_serial_numbers WHERE soldier_id = ?`;

    connection.query(deleteQuery, [soldierID], async (err, results) => {
      if (err) {
        console.error("Error deleteing records: ", err);
        res.status(500).json({
          status: "Failed",
          message: "An error occurred while deleting existing records",
          error: err.message,
        });
      } else {
        const message = {
          token: deviceToken,
          notification: {
            title: "Scanner initiated",
            body: `${soldierFirstName} ${soldierLastName} has initiated a scan process in the VMS portal. Click to open Scanner`,
          },
        };
        await firebaseAdmin
          .messaging()
          .send(message)
          .then((response) => {
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
                            const query = `DELETE FROM temp_serial_numbers WHERE soldier_id = ?`;
                            connection.query(
                              query,
                              [soldierID],
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
                                    "------------Scan completed------------"
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
                console.log("-----Timeout reached------");
                res.json({
                  status: "Failed",
                  message: "You have not scanned any device",
                });
                clearInterval(interval);
                clearTimeout(timeout);

                checkComplete = true;
              }, 300000);
            }
          })
          .catch((error) => {
            console.log("Error sending notification:", error);
          });
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

//create a function that stores the serial number temporarily
exports.storeSerialNumber = async (req, res) => {
  try {
    //store with soldier id and serial number
    const { soldierID, serialNumber } = req.body;

    //delete existing record first
    const deleteQuery = `DELETE FROM temp_serial_numbers WHERE soldier_id = ?`;
    connection.query(deleteQuery, [soldierID], (err, results) => {
      if (err) {
        console.error("Error deleteing records: ", err);
        res.status(500).json({
          status: "Failed",
          message: "An error occurred while deleting existing records",
          error: err.message,
        });
      } else {
        //perform store
        const insertQuery = `INSERT INTO temp_serial_numbers (soldier_id, serial_number) VALUES (?, ?)`;
        connection.query(
          insertQuery,
          [soldierID, serialNumber],
          (err, results) => {
            if (err) {
              console.error("Error storing temporary records: ", err);
              res.status(500).json({
                status: "Failed",
                message: "An error occurred while deleting existing records",
                error: err.message,
              });
            } else {
              // Send a success response
              res.status(200).json({
                status: "Success",
                message: "Serial number stored successfully",
              });
            }
          }
        );
      }
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
