const express = require("express");

//delete HTTP Method. Router present in ./request.js
async function cancelRequest(req, res, next) {
  res.json(req.body);
}

module.exports = cancelRequest;
