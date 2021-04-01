const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const config = require("../configurations.json");
const db = require("../Models");
const users = require("../Models/Users");
const auth = require("../Authentication");
const fetchUserCredentials = require("../Authentication/fetchPass");

const router = express.Router();

router.post("/", async (req, res, next) => {
  if (req.body.role && req.body.reg_id && req.body.password) {
    const role = req.body.role;
    const reg_id = req.body.reg_id;
    const password = req.body.password;

    let model, gpModel;
    switch (role) {
      case "customer":
        model = users.Customer;
        gpModel = users.GpCustomer;
        break;
      case "SP":
        model = users.Supplier;
        gpModel = users.GpSupplier;
        break;
      case "DA":
        model = users.Distributor;
        gpModel = users.GpDistributor;
        break;
      default:
        res
          .status(400)
          .json({ error: "Role must be either customer or SP or DA" });
        break;
    }

    try {
      let gpUserDoc = await gpModel.findById(reg_id);

      //Checking if user is valid
      if (gpUserDoc) {
        //user found in gpTable so valid
        let userDoc = await model.findById(reg_id);
        //Checking if user has already registered
        if (userDoc) {
          //User has already registered
          //Check password and then
          //Provide the token

          let hashedPass = crypto
            .createHash("SHA256")
            .update(password)
            .digest("hex");

          if (hashedPass === userDoc.password) {
            let token = await auth.getToken(role, reg_id);
            res.json({ status: "User Logged In", token });
          } else {
            res.status(400).json({ error: "Invalid password" });
          }
        } else {
          //user has not registered. First register the user by fetching relay_password
          //from the TTP Server
          let [errMsg, relayPass] = await fetchUserCredentials(role, reg_id);
          if (errMsg) {
            res.status(errMsg.status).json({ error: errMsg.data });
          } else {
            //We've received the Relay Password
            //Creating new document from the user model i.e. Registering
            if (password === relayPass) {
              //password matched
              let hashedPass = crypto
                .createHash("SHA256")
                .update(relayPass)
                .digest("hex");

              let userDoc = new model({
                _id: reg_id,
                regDateTime: new Date(),
                password: hashedPass,
              });
              //Saving password in user collection
              await userDoc.save();

              let token = await auth.getToken(role, reg_id);

              res.json({ status: "User Logged In", token });
            } else {
              res.status(400).json({ error: "Invalid password" });
            }
          }
        }
      } else {
        //User not found in GP table so invalid
        res.status(400).json({ error: "Invalid user" });
      }
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
          error: "Validation Error",
          response: err.errors,
        });
      } else {
        next(err);
      }
    }
  } else {
    res
      .status(400)
      .json({ error: "Request must include role, reg_id and password" });
  }
});

router.get("/check", auth.verifyUser, (req, res) => {
  res.json(req.user);
});

module.exports = router;
