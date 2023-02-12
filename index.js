require('dotenv').config({ path: '.env' });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const port = process.env.PORT || 3000;
const url= process.env.URL;

const app = express();
app.use(cors());

app.listen(port, ()=>{
    console.log(`Server started on port ${port}`)

    axios.get(url)
    .then(response => {
        const dom = new JSDOM(response.data);
        const links = dom.window.document.querySelectorAll('article.post-card > a');
        links.forEach(link => {
            console.log(link.href);
        });
    })
    .catch(error => {
        console.log(error);
    });
})