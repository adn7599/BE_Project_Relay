const express = require("express");
const fs = require("fs");
const path = require('path');
 
const assetPath = "./Assets/Commodities";

const router = express.Router();

router.get("/:img_id", async (req, res, next) => {
  const imagePath = assetPath + "/" + req.params.img_id + ".jpeg";

  if (fs.existsSync(imagePath)) {
    res.sendFile(path.resolve(imagePath)); //resolve absolute path
  } else {
    res.status(400).json({ error: "Invalid ID" });
  }
});

module.exports = router;
