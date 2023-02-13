const TelegramBot = require('node-telegram-bot-api');
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, {polling: true});
const fs = require('fs');
const request = require('request');


bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello, I am a bot, I can help you to store your keys, and get them when you need them.\n\nWhat do you want to do?', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Add key',
                        callback_data: 'addkey'
                    },
                    {
                        text: 'My keys',
                        callback_data: 'mykeys'
                    }
                ]
            ]
        }
    });
});

bot.on('callback_query', (msg) => {
    const chatId = msg.message.chat.id;
    if (msg.data === 'addkey') {
        bot.sendMessage(chatId, 'Enter the name of your key:');
        bot.once('message', (msg) => {
            const keyName = msg.text;
            bot.sendMessage(chatId, 'Enter your key:');
            bot.once('message', (msg) => {
                const key = msg.text;
                fs.readFile(`${chatId}.txt`, 'utf8', (err, data) => {
                    if (err) {
                        fs.writeFile(`${chatId}.txt`, `${keyName} ${key}`, (err) => {
                            if (err) throw err;
                            bot.sendMessage(chatId, 'Key added successfully!', {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: 'Add key',
                                                callback_data: 'addkey'
                                            },
                                            {
                                                text: 'My keys',
                                                callback_data: 'mykeys'
                                            }
                                        ]
                                    ]
                                }
                            });
                        });
                    } else {
                        const keys = data.split('\n');
                        if (keys.length < 5) {
                            fs.appendFile(`${chatId}.txt`, `\n${keyName} ${key}`, (err) => {
                                if (err) throw err;
                                bot.sendMessage(chatId, 'Key added successfully!', {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: 'Add key',
                                                    callback_data: 'addkey'
                                                },
                                                {
                                                    text: 'My keys',
                                                    callback_data: 'mykeys'
                                                }
                                            ]
                                        ]
                                    }
                                });
                            });
                        } else {
                            bot.sendMessage(chatId, 'You have reached the limit of 5 keys!', {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            {
                                                text: 'Add key',
                                                callback_data: 'addkey'
                                            },
                                            {
                                                text: 'My keys',
                                                callback_data: 'mykeys'
                                            }
                                        ]
                                    ]
                                }
                            });
                        }
                    }
                });
            });
        });
    } else if (msg.data === 'mykeys') {
        fs.readFile(`${chatId}.txt`, 'utf8', (err, data) => {
            if (err) {
                bot.sendMessage(chatId, 'You have no keys!', {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Add key',
                                    callback_data: 'addkey'
                                },
                                {
                                    text: 'My keys',
                                    callback_data: 'mykeys'
                                }
                            ]
                        ]
                    }
                });
            } else {
                const keys = data.split('\n');
                const buttons = [];
                for (let i = 0; i < keys.length; i++) {
                    buttons.push([{
                        text: keys[i].split(' ')[0],
                        callback_data: `key${i}`
                    }]);
                }
                buttons.push([{
                    text: 'Add key',
                    callback_data: 'addkey'
                }]);
                bot.sendMessage(chatId, 'Choose a key:', {
                    reply_markup: {
                        inline_keyboard: buttons
                    }
                });
            }
        });
    } else if (msg.data.includes('key')) {
        const keyNumber = msg.data.split('key')[1];
        fs.readFile(`${chatId}.txt`, 'utf8', (err, data) => {
            if (err) throw err;
            const keys = data.split('\n');
            const key = keys[keyNumber].split(' ')[1];
            request(`https://authenticationtest.com/totp/?secret=${key}`, (err, res, body) => {
                if (err) throw err;
                const code = JSON.parse(body).code;
                bot.sendMessage(chatId, `Your code is: ${code}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Refresh',
                                    callback_data: `refresh${keyNumber}`
                                },
                                {
                                    text: 'Go back',
                                    callback_data: 'mykeys'
                                }
                            ]
                        ]
                    }
                });
            });
        });
    } else if (msg.data.includes('refresh')) {
        const keyNumber = msg.data.split('refresh')[1];
        fs.readFile(`${chatId}.txt`, 'utf8', (err, data) => {
            if (err) throw err;
            const keys = data.split('\n');
            const key = keys[keyNumber].split(' ')[1];
            request(`https://authenticationtest.com/totp/?secret=${key}`, (err, res, body) => {
                if (err) throw err;
                const code = JSON.parse(body).code;
                bot.sendMessage(chatId, `Your code is: ${code}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Refresh',
                                    callback_data: `refresh${keyNumber}`
                                },
                                {
                                    text: 'Go back',
                                    callback_data: 'mykeys'
                                }
                            ]
                        ]
                    }
                });
            });
        });
    }
});