const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const schedule = require('node-schedule');

const TOKEN = "";
const weather_Token = "";

const bot = new TelegramBot(TOKEN, {polling:true});

// Schedule a job to run every 8am
const everySixHoursJob = schedule.scheduleJob('* 8 * * *', () => {
    console.log('Job executed daily 8am at', new Date());
});

function getUpdates(chatId){
    let city = "pune" // get form db by chatId
    let params = {
        access_key: weather_Token,
        query: userInput
        }
    
    axios.get('http://api.weatherstack.com/current', {params})
    .then(response => {
        const apiResponse = response.data;
        const city = apiResponse.location.name + ", " + apiResponse.location.country;
        const temperature = apiResponse.current.temperature;
        const humidity = apiResponse.current.humidity;
        const pressure = apiResponse.current.pressure;
        const visibility = apiResponse.current.visibility;
        const weather_descriptions = apiResponse.current.weather_descriptions;

        const returnMessage = `Weather Report:
        city name: ${city}
        weather_descriptions: ${weather_descriptions}
        temperature: ${temperature}°C
        humidity: ${humidity}%
        pressure: ${pressure}hPa
        visibility: ${visibility}km`;

        bot.sendMessage(chatId, returnMessage);
    }).catch(error => {
        bot.sendMessage(chatId, "No such city exists");
        console.log(error);
    });
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = 'Welcome! \n Here are the commands to use this weather bot \n 1. /subscribe - receive daily weather updates at 8am \n 2. /unsubscribe - stop receiving our useful updates \n 3. /weather - for current weather updates of your city \n 4. /update - to set or update your current city for getting daily updates of that city';
    bot.sendMessage(chatId, welcomeMessage);
});
bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;
    // add user
    const message = "Here we go with daily updates sharp at 8am, \n please set your city for updates using */updateCity _cityName_* command"
    bot.sendMessage(chatId, message, {parse_mode: 'MarkdownV2'});
});
bot.onText(/\/unsubscribe/, (msg) => {
    const chatId = msg.chat.id;
    // remove user
    bot.sendMessage(chatId, "Sorry to see you go! \n you have successfully unsubscribed to our service");
});
bot.onText(/\/update/, (msg) => {
    const chatId = msg.chat.id;
    const city = msg.text.substring(8);

    if(city == ""){
        bot.sendMessage(chatId, "please try again with city name");
    }
    else{
        // update city of user    
        getUpdates(chatId);
    }
});
bot.onText(/\/weather/, (msg) => {
    const chatId = msg.chat.id;   
    getUpdates(chatId);
});









// bot.on("message", async (msg)=>{
//     console.log(msg);
//     let chatId = msg.chat.id;
//     let userInput = msg.text;

//     let params = {
//     access_key: weather_Token,
//     query: userInput
//     }

//     axios.get('http://api.weatherstack.com/current', {params})
//     .then(response => {
//         const apiResponse = response.data;
//         const city = apiResponse.location.name + ", " + apiResponse.location.country;
//         const temperature = apiResponse.current.temperature;
//         const humidity = apiResponse.current.humidity;
//         const pressure = apiResponse.current.pressure;
//         const visibility = apiResponse.current.visibility;
//         const weather_descriptions = apiResponse.current.weather_descriptions;

//         const returnMessage = `Weather Report:
//         city name: ${city}
//         weather_descriptions: ${weather_descriptions}
//         temperature: ${temperature}°C
//         humidity: ${humidity}%
//         pressure: ${pressure}hPa
//         visibility: ${visibility}km`;

//         bot.sendMessage(chatId, returnMessage);
//     }).catch(error => {
//         bot.sendMessage(chatId, "No such city exists");
//         console.log(error);
//     });   
// });

