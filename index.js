const express = require("express");

const config = require("./configurations.json");
const db = require('./Models');
const Test = require('./Models/test');
const app = express();

//Middleware
app.use(express.json());

app.get("/hello/:name/:age", async (req, res,next) => {
    try{
        const test = new Test({name: req.params.name });
        const result = await test.save()
        res.json(result);
    }
    catch(error){
        next(error)
    }
});

//Default Error Handler
app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(500).send('Server Error!!');
})

//Setting up Server
const PORT = process.env.PORT || parseInt(config.PORT);

db.once('open',() => {
    console.log('MongoDB Database connected!!');
    app.listen(PORT, () => {
        console.log(`Server started at port ${PORT}`);
    });
})
