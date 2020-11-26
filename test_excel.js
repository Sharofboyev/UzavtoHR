/*
const Telegraf = require('telegraf');
const config = require('./config')

const bot = new Telegraf(config.bot_token)

bot.start((ctx) => {
    ctx.reply('sad', {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Оставить рекомендации", callback_data: "recommendation" },
                    { text: "Оставить жалобу", callback_data: "complaint" },
                ],
                [{ text: "Узнать больше...", callback_data: "more_info" }]
            ]
        }
    })
})

bot.command('type', (ctx) => {
    console.log(ctx.message)
})
bot.action('recommendation', (ctx) => {
    console.log(ctx.message ? ctx.message : ctx.update.callback_query.message.from);
})

bot.startPolling()
    /*
    const Telegraf = require('telegraf');
    const fs = require('fs')
    const buffer = require('buffer');
    const config = require('./config');

    const bot = new Telegraf(config.bot_token);
    bot.start((ctx) => {
        fs.readFile('./Excel.xlsx', (err, data) => {
            if (err) return console.log(err.message);
            ctx.telegram.sendDocument(config.staffchat_id, { source: data, filename: "База.xlsx" }).then(() => {
                console.log('File sent successfully')
            }).catch((err) => {
                console.log(err.message);
            });
        })

    })

    bot.startPolling();*/