const express = require("express");

const config = require("./configurations.json");
const db = require("./Models");

//Routers
const login = require("./Routes/login");

const app = express();

//Middleware
app.use(express.json());

//Setting up routes
app.use("/login", login);

//Default Error Handler
app.use((err, req, res, next) => {
  console.log(err.message);
  console.error(err.stack);
  res.status(500).send("Server Error!!");
});

//Setting up Server
const PORT = process.env.PORT || parseInt(config.PORT);

db.once("open", () => {
  console.log("MongoDB Database connected!!");
  app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
  });
});
