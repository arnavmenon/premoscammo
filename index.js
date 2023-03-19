require("dotenv").config({ path: ".env" });

const express = require("express");
const cors = require("cors");
const nodeCron = require("node-cron");
const {LocalStorage} = require('node-localstorage'); 
const axios = require("axios");
const jsdom = require("jsdom");
const nodemailer = require("nodemailer");
const { JSDOM } = jsdom;

const port = process.env.PORT || 3000;
const url = process.env.URL;

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

let initStartDate = "2023-02-20 16:17:26";          // Replace with Date.now().toISOString() to get current date and time at the time of deployment
let localStorage = new LocalStorage('./scratch');
localStorage.setItem('startDate', initStartDate) 

const app = express();
app.use(cors());

async function mailerFunc () {
  axios
    .get(url)
    .then((response) => {
      let oldStartDate = localStorage.getItem('startDate');
      let newEndDate = oldStartDate;
      let newLinks = [];

      //console.log("Old startdate: " + oldStartDate + "\n");
      
      const dom = new JSDOM(response.data);
      const links = dom.window.document.querySelectorAll(
        "article.post-card > a"
      );
      const dts = dom.window.document.querySelectorAll(
        "footer.post-card__footer > time"
      );
      for (let i = 0; i < links.length; i++) {
        if (dts[i].dateTime > oldStartDate) {
          newLinks.push(links[i].href);
          newenddate = dts[i].dateTime;
          if(i==0){
            newEndDate = dts[i].dateTime;
          }
        } else {
          break;
        }
      }
      localStorage.setItem('startDate', newEndDate);
      //console.log("New starting date: " + newEndDate + "\n");

      return newLinks;
    })

    .then(async (links) => {
      if(links == undefined || links.length == 0){
        return links;
      }
      let linksToMail = [],
        promises = [];
      links.forEach((link) => {
        promises.push(axios.get("https://kemono.party" + link));
      });

      await Promise.all(promises).then(function (results) {
        results.forEach(function (response) {
          const dom = new JSDOM(response.data);
          let filelink = dom.window.document.querySelectorAll(
            "a.post__attachment-link"
          );
          if (filelink.length > 0) {
            filelink = filelink[0].href;
          } else {
            filelink = filelink.href;
          }
          //console.log(filelink);
          linksToMail.push(filelink);
        });
      });

      return linksToMail;
    })

    .then((links) => {
      if(links == undefined || links.length == 0){
        return;
      }
      let mailContent = "Links to new episodes:\n\n";
      links.forEach((link) => {
        mailContent += link + "\n";
      });
      mailContent += "\n" + "Enjoy :)";
      let mailOptions = {
        from: process.env.EMAIL,
        to: process.env.TOMAIL,
        subject: "New podcast just dropped!!",
        text: mailContent,
      };

      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          console.log("Error: " + err.message);
        }
        console.log("Email sent!!!");
      });
    })

    .catch((error) => {
      console.log(error);
    });
}

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


const  mailerJob = nodeCron.schedule("* */4 * * *", mailerFunc); // runs every 4 hours