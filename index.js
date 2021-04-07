const express = require("express");
const morgan = require("morgan");

const config = require("./configurations.json");
const db = require("./Models");

//Routers
const login = require("./Routes/login");
const productImage = require("./Routes/productImage");

const customer = require("./Routes/Customer");
const supplier = require("./Routes/Supplier");
const distributor = require("./Routes/Distributor");

//Declaring the application
const app = express();

//Middleware
app.use(morgan("tiny"));
app.use(express.json());

//Setting up routes
app.use("/login", login);
app.use("/productImage", productImage);

app.use("/customer", customer);
app.use("/supplier", supplier);
app.use("/distributor", distributor);

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
