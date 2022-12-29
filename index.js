const cron = require('node-cron');
const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config()

// Create an instance of Express
app = express();

let cache = new Set([17075, 16740, 16741, 16956, 16724, 17056, 16945, 17049, 16995]);

let mailOptions = {
    from: process.env.USER_EMAIL,
    to: '',
    subject: "I wan't to be a judje",
    text: `Dear Hackathon Committee,

I am writing to express my interest in serving as a judge for your upcoming hackathon. As a front-end developer, I have a strong understanding of the technical skills and concepts that are relevant to the hackathon, and I believe that my background and experience make me uniquely qualified to evaluate and provide constructive feedback to the participants.
    
In my current role, I have had the opportunity to work on a variety of web development projects, including designing and implementing user interfaces, developing responsive layouts, and optimizing user experience. I have also participated in several hackathons as a participant, which has given me insight into the challenges and opportunities that teams face when working on a project under time pressure.
    
I am excited about the opportunity to be a part of your hackathon and to help foster the development of new ideas and technologies. Thank you for considering my application.
    
Evgenii Kravtsov`,
};

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

const parseDevPost = async () => {
    let res = await axios.get('https://devpost.com/api/hackathons?order_by=recently-added&status[]=upcoming')
    return res.data
}

cron.schedule(`*/${process.env.MAIL_PERIOD} * * * *`, async() =>{
    let data = await parseDevPost();
    data.hackathons.forEach(async ({url, id}) => {
        if(cache.has(id)){
            console.log('id in cache =>>>>>', id);
            console.log('url in cache =>>>>>', url);
            return;
        } 
        let page = await axios.get(url);
        const $ = cheerio.load(page.data);
        const mail = $('a[href^="mailto:"]').attr("href").replace("mailto:", "") || "";

        if(mail && typeof mail === 'string') {
            console.log('отсылаем по адресу ', mail);
            transporter.sendMail({...mailOptions , to: mail }, (error, info) => {
                cache.add(id);
                if (error) console.log(error);
                else console.log('Email sent: ' + info.response);
            })
        } else return;
    });
}
);

app.listen(3000, function(){
    console.log("Server listening");
});