function verifyCustomer(req,res,next) {
    if(req.user.role === "customer"){
        next()
    }
    else{
        res.status(403);
        res.json({error: "Invalid Role"})
    }
}

module.exports = verifyCustomer;