import express from "express";

const app = express();

app.get('/', (req, res) => {
    res.send('server is working on port 2000');
});

app.listen('2000', () => {
    console.log('server is running on port 2000');
});