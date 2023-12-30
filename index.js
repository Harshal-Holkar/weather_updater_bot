const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const weather_Token = process.env.WEATHER_API_TOKEN;

mongoose.connect(process.env.MONGODB_CONNECTION_STRING);

const bot = new TelegramBot(TOKEN, { polling: true });
const UserModel = require('./models/userModel');

// Schedule a job to run every day at 8 am
const dailyJob = schedule.scheduleJob('0 8 * * *', () => {
    console.log('Job executed daily at 8 am', new Date());
    sendWeatherUpdatesToAll();
});

async function sendWeatherUpdatesToAll() {
    const users = await UserModel.find();

    users.forEach(async (user) => {
        const chatId = user.chatId;
        if (await isSubscribed(chatId)) {
            getWeatherUpdates(chatId);
        }
    });
}

async function isBlocked(chatId) {
    const user = await UserModel.findOne({ chatId });
    if (user && user.isBlocked) {
        bot.sendMessage(chatId, "You are blocked by the admin. Please contact for help.");
        return true;
    }
    return false;
}

async function isSubscribed(chatId) {
    if (await isBlocked(chatId)) {
        return false;
    }

    const user = await UserModel.findOne({ chatId });
    return user !== null;
}

async function getWeatherUpdates(chatId) {
    const user = await UserModel.findOne({ chatId });
    const city = user.city;
    const params = {
        access_key: weather_Token,
        query: city,
    };

    try {
        const response = await axios.get('http://api.weatherstack.com/current', { params });
        const apiResponse = response.data;

        const cityInfo = `${apiResponse.location.name}, ${apiResponse.location.country}`;
        const temperature = apiResponse.current.temperature;
        const humidity = apiResponse.current.humidity;
        const pressure = apiResponse.current.pressure;
        const visibility = apiResponse.current.visibility;
        const weatherDescriptions = apiResponse.current.weather_descriptions;

        const returnMessage = `Weather Report:
            City: ${cityInfo}
            Weather Descriptions: ${weatherDescriptions}
            Temperature: ${temperature}°C
            Humidity: ${humidity}%
            Pressure: ${pressure}hPa
            Visibility: ${visibility}km`;

        bot.sendMessage(chatId, returnMessage);
    } catch (error) {
        bot.sendMessage(chatId, "No such city exists");
        console.error(error.message);
    }
}

async function updateUserCity(chatId, newCity) {
    if (!await isSubscribed(chatId)) {
        bot.sendMessage(chatId, "Please subscribe first");
    } else {
        await UserModel.updateOne({ chatId }, { $set: { city: newCity } });
        bot.sendMessage(chatId, `Your city has been updated to ${newCity}`);
    }
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = 'Welcome! \n Here are the commands to use this weather bot \n 1. /subscribe - receive daily weather updates at 8 am \n 2. /unsubscribe - stop receiving updates \n 3. /weather - for current weather updates of your city \n 4. /update - set or update your city for daily updates';
    bot.sendMessage(chatId, welcomeMessage);
});

// Handle /subscribe command
bot.onText(/\/subscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.chat.first_name;
    const userName = msg.chat.username;

    if (!await isSubscribed(chatId)) {
        createUser(chatId, firstName, userName);
        const message = "Here we go with daily updates sharp at 8 am, \n please set your city for updates using */updateCity _cityName_* command";
        bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
    } else {
        bot.sendMessage(chatId, "You have already subscribed");
    }
});

async function removeUser(chatId) {
    if (await isSubscribed(chatId)) {
        await UserModel.deleteOne({ chatId });
        bot.sendMessage(chatId, "Sorry to see you go! \n You have successfully unsubscribed from our service");
    } else {
        bot.sendMessage(chatId, "Please subscribe first");
    }
}

// Handle /unsubscribe command
bot.onText(/\/unsubscribe/, (msg) => {
    const chatId = msg.chat.id;
    removeUser(chatId);
});

// Handle /update command
bot.onText(/\/update/, (msg) => {
    const chatId = msg.chat.id;
    const city = msg.text.substring(8);

    if (!city) {
        bot.sendMessage(chatId, "Please try again with a city name");
    } else {
        updateUserCity(chatId, city);
    }
});

// Handle /weather command
bot.onText(/\/weather/, async (msg) => {
    const chatId = msg.chat.id;
    if (await isSubscribed(chatId)) {
        getWeatherUpdates(chatId);
    } else {
        bot.sendMessage(chatId, "Please subscribe first");
    }
});

// Express routes
app.get('/', (req, res) => {
    res.send('Hello, please use given this telegram bot for daily weather updates: @daily_weather_updater_bot');
});

// Start Express server
app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
