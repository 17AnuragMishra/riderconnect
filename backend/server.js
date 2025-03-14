import express from "express";
// const bodyParser = require("body-parser");

const app = express();
const port = 3000;


app.get('/', (req, res) => {
    res.send(`server is working on port ${port}`);
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});