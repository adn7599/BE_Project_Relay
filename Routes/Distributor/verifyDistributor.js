function verifyDistributor(req, res, next) {
  if (req.user.role === "DA") {
    next();
  } else {
    res.status(403);
    res.json({ error: "Invalid Role" });
  }
}

module.exports = verifyDistributor;
