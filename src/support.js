const Telegraf = require("telegraf");
const { Extra } = Telegraf;
const config = require("../config.js");
const handler = require("./ticket_handler.js");
const cache = require("./cache.js");
const dbhandler = require("./dbhandler.js");
const WizardScene = require("telegraf/scenes/wizard");
const Stage = require("telegraf/stage");
const excel = require("./excel");
const session = require("telegraf/session");

const bot = new Telegraf(config.bot_token);

// eslint-disable-next-line new-cap
cache.html = Extra.HTML();
cache.markdown = Extra.markdown();
cache.noSound = Extra
    // eslint-disable-next-line new-cap
    .HTML()
    .notifications(false);

bot.use(session());
bot.use((ctx, next) => {
    ctx.getChat().then(function(chat) {
        if (chat.type === "private") {
            ctx.session.admin = false;
            return next();
        } else {
            ctx.getChatAdministrators().then(function(admins) {
                admins = JSON.stringify(admins);
                if (ctx.message.reply_to_message !== undefined) {
                    // admin
                    ctx.session.admin = true;
                } else {
                    // no admin
                    ctx.session.admin = false;
                }
                return next();
            });
        }
    });
});

// on start reply with chat bot rules
bot.command("start", (ctx) => {
    if (ctx.message.chat.id > 0)
        ctx.reply(config.startCommandText, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Оставить рекомендации", callback_data: "recommendation" },
                        { text: "Оставить жалобу", callback_data: "complaint" },
                    ],
                    [{ text: "Узнать больше...", callback_data: "more_info" }],
                ],
            },
        });
    else ctx.reply("Бот запустился");
});

const shikoyat = new WizardScene(
    "complaints",
    (ctx) => {
        ctx.reply("Отправьте жалобу: ");
        ctx.wizard.next();
    },
    (ctx) => {
        try {
            handler.ticket(bot, ctx, "жалоба");
        } catch (err) {
            ctx.reply("Что-то пошло не так. Попробуйте снова нажав /start");
        }

        ctx.scene.leave();
    }
);

const taklif = new WizardScene(
    "recommendations",
    (ctx) => {
        ctx.reply("Отправьте рекомендации: ");
        ctx.wizard.next();
    },
    (ctx) => {
        try {
            handler.ticket(bot, ctx, "рекомендация");
        } catch (err) {
            ctx.reply("Что-то пошло не так. Попробуйте снова нажав /start");
        }
        ctx.scene.leave();
    }
);

// id
bot.command("id", ({ reply, from, chat }) => {
    reply("ИД вашего чата: " + chat.id);
});

// faq
bot.command("faq", (ctx) => {
    ctx.reply(config.faqCommandText, cache.html);
});

// help
bot.command("help", (ctx) => {
    ctx.reply(config.helpCommandText, cache.html);
});

bot.command("manage", (ctx) => {
    let keyboard = [];
    let i = 0;
    for (let company in config.other_staff) {
        if (i % 2 == 0) keyboard.push([{ text: company, callback_data: company }]);
        else
            keyboard[Math.floor(i / 2)].push({
                text: company,
                callback_data: company,
            });
        i++;
    }
    ctx.reply("Выберите куда отправить", {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
});

// enable for groups (get own username)
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
});

// download photos
const downloadPhotoMiddleware = (ctx, next) => {
    return bot.telegram.getFileLink(ctx.message.photo[0]).then((link) => {
        ctx.state.fileLink = link;
        return next();
    });
};

// download videos
const downloadVideoMiddleware = (ctx, next) => {
    return bot.telegram.getFileLink(ctx.message.video).then((link) => {
        ctx.state.fileLink = link;
        return next();
    });
};

// download documents
const downloadDocumentMiddleware = (ctx, next) => {
    return bot.telegram.getFileLink(ctx.message.document).then((link) => {
        ctx.state.fileLink = link;
        return next();
    });
};

// display open tickets
bot.command("open", (ctx) => {
    ctx.getChat().then(function(chat) {
        if (chat.id.toString() === config.staffchat_id) {
            ctx.getChatAdministrators().then(function(admins) {
                admins = JSON.stringify(admins);
                dbhandler.open(function(userList) {
                    let openTickets = "";
                    for (const i in userList) {
                        if (
                            userList[i]["userid"] !== null &&
                            userList[i]["userid"] !== undefined
                        ) {
                            openTickets +=
                                "#П" +
                                userList[i]["id"].toString().padStart(6, "0").toString() +
                                "\n";
                        }
                    }
                    setTimeout(function() {
                        bot.telegram.sendMessage(
                            chat.id,
                            "<b>Open Tickets:\n\n</b>" + openTickets,
                            cache.noSound
                        );
                    }, 10);
                });
            });
        }
    });
});

// close ticket
bot.command("close", (ctx) => {
    ctx.getChat().then(function(chat) {
        if (chat.id.toString() === config.staffchat_id) {
            if (ctx.message.reply_to_message !== undefined) {
                let replyText = ctx.message.reply_to_message.text;
                if (replyText == undefined) {
                    replyText = ctx.message.reply_to_message.caption;
                }
                const userid = replyText.match(
                    new RegExp("#П" + "(.*)" + " " + config.lang_from)
                );
                try {
                    dbhandler.check(userid[1], async function(ticket) {
                        if (ticket != undefined || ticket != null) {
                            await dbhandler.add(userid[1], "closed");
                            bot.telegram.sendMessage(
                                chat.id,
                                "Отзыв #П" + ticket.id.toString().padStart(6, "0") + " закрыт",
                                cache.noSound
                            );
                        } else {
                            await ctx.reply(config.lang_wrong_close, {
                                reply_to_message_id: ctx.message.message_id,
                            });
                        }
                    });
                } catch (err) {
                    ctx.reply(config.lang_wrong, {
                        reply_to_message_id: ctx.message.message_id,
                    });
                }
            }
        }
    });
});

// ban user
bot.command("ban", (ctx) => {
    ctx.getChat().then(function(chat) {
        if (chat.id.toString() === config.staffchat_id) {
            ctx.getChatAdministrators().then(async function(admins) {
                admins = JSON.stringify(admins);
                if (ctx.message.reply_to_message !== undefined) {
                    const replyText = ctx.message.reply_to_message.text;
                    const userid = replyText.match(
                        new RegExp("#П" + "(.*)" + " " + config.lang_from)
                    );

                    await dbhandler.add(userid[1], "banned", null);
                    bot.telegram.sendMessage(
                        chat.id,
                        config.lang_usr_with_ticket +
                        " <code>#П" +
                        userid[1] +
                        "</code> " +
                        config.lang_banned,
                        cache.noSound
                    );
                }
            });
        }
    });
});

bot.command("excel", (ctx) => {
    excel.excel(ctx);
});

// handle photo input
bot.on("photo", downloadPhotoMiddleware, (ctx, next) => {
    handler.file("photo", bot, ctx);
});

// handle video input
bot.on("video", downloadVideoMiddleware, (ctx, next) => {
    handler.file("video", bot, ctx);
});

// handle file input
bot.on("document", downloadDocumentMiddleware, (ctx, next) => {
    handler.file("document", bot, ctx);
});

const stage = new Stage();
stage.register(shikoyat);
stage.register(taklif);

bot.use(stage.middleware());

// recommendation button
let rec = "recommendation";
bot.action(rec, (ctx) => {
    ctx.deleteMessage();
    ctx.scene.enter("recommendations");
});

// complaint button
bot.action("complaint", (ctx) => {
    ctx.deleteMessage();
    ctx.scene.enter("complaints");
});

// more_info button
bot.action("more_info", (ctx) => {
    ctx.deleteMessage();
    return ctx.reply(config.btn_more_info);
});

bot.hears(/(.+)/, (ctx) => handler.ticket(bot, ctx, "undefined"));

// telegraf error handling

bot.catch((err) => {
    console.log("Error: ", err.message);
});

bot.startPolling();
/*
If you receive Error: 409: Conflict: can't use getUpdates method while
webhook is active, comment bot.startPolling() out, remove // of the following
commands, run your bot once and undo the changes. This will disable the
webhook by setting it to empty.

bot.telegram.setWebhook("");
bot.startWebhook("")
*/