function verifySupplier(req, res, next) {
  if (req.user.role === "SP") {
    next();
  } else {
    res.status(403);
    res.json({ error: "Invalid Role" });
  }
}

module.exports = verifySupplier;
