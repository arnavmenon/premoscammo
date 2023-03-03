require("dotenv").config({ path: ".env" });

const express = require("express");
const cors = require("cors");
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

let startdate = "2023-02-20T16:17:26.493Z";

const app = express();
app.use(cors());

app.listen(port, () => {
  console.log(`Server started on port ${port}`);

  axios
    .get(url)
    .then((response) => {
      let newenddate = startdate;
      let newlinks = [];
      const dom = new JSDOM(response.data);
      const links = dom.window.document.querySelectorAll(
        "article.post-card > a"
      );
      const dts = dom.window.document.querySelectorAll(
        "footer.post-card__footer > time"
      );
      for (let i = 0; i < links.length; i++) {
        if (dts[i].dateTime > startdate) {
          newlinks.push(links[i].href);
          newenddate = dts[i].dateTime;
        } else {
          break;
        }
      }
      startdate = newenddate;
      console.log("New startdate: " + startdate + "\n");
      return newlinks;
    })

    .then(async (links) => {
      let linkstomail = [],
        promises = [];
      links.forEach((link) => {
        const url = "https://kemono.party" + link;
        promises.push(axios.get(url));
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
          console.log(filelink);
          linkstomail.push(filelink);
        });
      });

      return linkstomail;
    })

    .then((links) => {
      let mailcontent = "Links to new Episodes:\n\n";
      links.forEach((link) => {
        mailcontent += link + "\n";
      });
      mailcontent += "\n" + "Enjoy :)";
      let mailOptions = {
        from: "gordonmcjordan@gmail.com",
        to: "gordonmcjordan@gmail.com",
        subject: "New podcast just dropped!!",
        text: mailcontent,
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
});
