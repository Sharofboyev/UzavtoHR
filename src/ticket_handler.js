const config = require("../config.js");
const cache = require("./cache.js");
const dbhandler = require("./dbhandler.js");

/**
 * Decide whether to forward or stop the message.
 * @param {bot} bot Bot object.
 * @param {context} ctx Bot context.
 */
function ticketHandler(bot, ctx, type) {
    ctx.getChat().then(async function(chat) {
        if (chat.id.toString() === config.staffchat_id) {
            // let staff handle that
            staffChat(ctx, bot, chat);
        } else if (chat.type === "private") {
            // create a ticket and send to staff
            // check db for user status
            try {
                await dbhandler.add(ctx.message, "open", type);
                customerChat(ctx, bot, chat, type);
            } catch (err) {
                ctx.reply("Что-то пошло не так. Попробуйте снова нажав /start");
            }
        }
    });
}

/**
 * Reply to tickets in staff chat.
 * @param {context} ctx Bot context.
 * @param {bot} bot Bot object.
 */
function staffChat(ctx, bot) {
    // check whether person is an admin
    if (!ctx.session.admin) {
        return;
    }
    // try whether a text or an image/video is replied to
    try {
        // replying to non-ticket
        if (ctx.message === undefined) {
            return;
        }
        replyText = ctx.message.reply_to_message.text;
        if (replyText === undefined) {
            replyText = ctx.message.reply_to_message.caption;
        }

        let userid = replyText.match(
            new RegExp("#П" + "(.*)" + " " + config.lang_from)
        );
        if (userid === null || userid === undefined) {
            return;
        }

        dbhandler.check(userid[1], function(ticket) {
            if (ticket == null || ticket == undefined) {
                ctx.reply(config.lang_wrong_close, {
                    reply_to_message_id: ctx.message.message_id,
                });
                return;
            }
            const name = replyText.match(
                new RegExp(config.lang_from + " " + "(.*)" + " " + config.lang_language)
            );
            if (ctx.message.text !== undefined && ctx.message.text === "me") {
                // accept ticket
                // Get Ticket ID from DB
                bot.telegram.sendMessage(
                    config.staffchat_id,
                    "<b>" +
                    config.lang_ticket +
                    " #П" +
                    user.id.toString().padStart(6, "0") +
                    "</b> " +
                    config.lang_acceptedBy +
                    " " +
                    ctx.message.from.first_name +
                    " -> /open",
                    cache.noSound
                );
            } else {
                // replying to non-ticket
                if (userid === null) {
                    return;
                }
                cache.ticketStatus[userid[1]] = false;
                bot.telegram
                    .sendMessage(
                        ticket.userid,
                        config.lang_dear +
                        " <b>" +
                        name[1] +
                        "</b>,\n\n" +
                        ctx.message.text +
                        "\n\n" +
                        config.lang_regards,
                        cache.html
                    )
                    .then(() => {
                        bot.telegram.sendMessage(
                            config.staffchat_id,
                            config.lang_msg_sent +
                            ' <a href="tg://user?id=' +
                            userid[1] +
                            '">' +
                            name[1] +
                            "</a>" +
                            "\nОтзыв закрыт.",
                            cache.noSound
                        );
                        console.log(
                            "Answer: " +
                            config.lang_ticket +
                            " #П" +
                            ticket.id.toString().padStart(6, "0") +
                            " " +
                            config.lang_dear +
                            " " +
                            name[1] +
                            " " +
                            ctx.message.text +
                            " " +
                            config.lang_from +
                            " " +
                            ctx.message.from.first_name
                        );
                        dbhandler.add(userid, "close", ctx.message.text);
                    })
                    .catch((err) => {
                        console.log(err.message);
                        bot.telegram.sendMessage(
                            config.staffchat_id,
                            "Ответ не отправлен! Возможно, бот был заблокирован клиентом",
                            cache.noSound
                        );
                    });
            }
            cache.ticketSent[userid[1]] = undefined;
            // close ticket
            dbhandler.add(userid[1], "closed", ctx.message.text);
        });
    } catch (e) {
        console.log(e);
        bot.telegram.sendMessage(
            config.staffchat_id,
            `An error occured, please 
          report this to your admin: \n\n` + e,
            cache.noSound
        );
    }
}

/**
 * Ticket handling and spam protection.
 * @param {context} ctx Bot context.
 * @param {bot} bot Bot object.
 * @param {chat} chat Bot chat.
 */
function customerChat(ctx, bot, chat, type) {
    cache.ticketID = ctx.message.from.id;
    if (cache.ticketIDs[cache.ticketID] === undefined) {
        cache.ticketIDs.push(cache.ticketID);
    }
    cache.ticketStatus[cache.ticketID] = true;
    userInfo = "";
    userInfo +=
        " " +
        config.lang_from +
        ' <a href="tg://user?id=' +
        cache.ticketID +
        '">' +
        ctx.message.from.first_name +
        "</a>" +
        " ";
    userInfo +=
        config.lang_language + ": " + ctx.message.from.language_code + "\n\n";
    if (cache.ticketSent[cache.ticketID] === undefined) {
        // Get Ticket ID from DB
        bot.telegram.sendMessage(chat.id, config.lang_contactMessage, cache.html);
        // Get Ticket ID from DB
        dbhandler.check(chat.id, function(ticket) {
            bot.telegram.sendMessage(
                config.staffchat_id,
                "" +
                config.lang_ticket +
                " #П" +
                ticket.id.toString().padStart(6, "0") +
                userInfo +
                " Тип: " +
                type +
                "\n\nТекст сообщения: " +
                ctx.message.text,
                cache.html
            );
        });
        // wait 5 minutes before this message appears again and do not
        // send notificatoin sounds in that time to avoid spam
        setTimeout(function() {
            cache.ticketSent[cache.ticketID] = undefined;
        }, config.spam_time);
        cache.ticketSent[cache.ticketID] = 0;
    } else if (cache.ticketSent[cache.ticketID] < 4) {
        cache.ticketSent[cache.ticketID]++;
        dbhandler.check(cache.ticketID, function(ticket) {
            bot.telegram.sendMessage(
                config.staffchat_id,
                config.lang_ticket +
                " #П" +
                ticket.id.toString().padStart(6, "0") +
                userInfo +
                " Тип: " +
                type +
                "\n\nТекст сообщения: " +
                ctx.message.text,
                cache.html
            );
        });
    } else if (cache.ticketSent[cache.ticketID] === 4) {
        cache.ticketSent[cache.ticketID]++;
        bot.telegram.sendMessage(chat.id, config.lang_blockedSpam, cache.html);
    }
    dbhandler.check(cache.ticketID, function(ticket) {
        //if (ticket == undefined || ticket == null) return ctx.reply(config.lang_wrong_close, { reply_to_message_id: ctx.message.message_id })
        console.log(
            `Ticket: ` +
            " #П" +
            ticket.id.toString().padStart(6, "0") +
            userInfo
            .replace("\n\n", ": ")
            .replace('<a href="tg://user?id=' + cache.ticketID + '">', "")
            .replace("</a>", "") +
            " Тип: " +
            type +
            "\n\nТекст сообщения: " +
            ctx.message.text
        );
    });
}

/**
 * Forward video files to staff.
 * @param {string} type document, photo, video.
 * @param {bot} bot Bot object.
 * @param {context} ctx Bot context.
 */
function fileHandler(type, bot, ctx) {
    // replying to non-ticket
    let userid;
    if (ctx.message !== undefined && ctx.message.reply_to_message !== undefined) {
        replyText = ctx.message.reply_to_message.text;
        if (replyText === undefined) {
            replyText = ctx.message.reply_to_message.caption;
        }
        userid = replyText.match(
            new RegExp("#П" + "(.*)" + " " + config.lang_from)
        );
        if (userid === null || userid === undefined) {
            userid = replyText.match(
                new RegExp("#П" + "(.*)" + "\n" + config.lang_from)
            );
        }
    }
    forwardFile(bot, ctx, function(userInfo) {
        let receiverId = config.staffchat_id;
        console.log(ctx.message.chat.id);
        dbhandler.check(ctx.message.chat.id, function(ticket) {
            let captionText =
                config.lang_ticket +
                "#П" +
                ticket.id.toString().padStart(6, "0") +
                " " +
                userInfo +
                "\n" +
                (ctx.message.caption || "");
            if (ctx.session.admin && userInfo === undefined) {
                receiverId = userid[1];
                captionText = ctx.message.caption || "";
            }
            switch (type) {
                case "document":
                    bot.telegram.sendDocument(receiverId, ctx.message.document.file_id, {
                        caption: captionText,
                    });
                    break;
                case "photo":
                    bot.telegram.sendPhoto(receiverId, ctx.message.photo[0].file_id, {
                        caption: captionText,
                    });
                    break;
                case "video":
                    bot.telegram.sendVideo(receiverId, ctx.message.video.file_id, {
                        caption: captionText,
                    });
                    break;
            }
        });
    });
}

/**
 * Handle caching for sent files.
 * @param {bot} bot Bot object.
 * @param {context} ctx Bot context.
 * @param {callback} callback Bot callback.
 */
function forwardFile(bot, ctx, callback) {
    dbhandler.check(ctx.message.from.id, function(user) {
        let ok = true;
        dbhandler.add(ctx.message, "open", "неопределенный");
        if (ok || (user !== undefined && user.status !== "banned")) {
            if (cache.ticketSent[cache.ticketID] === undefined) {
                fowardHandler(ctx, function(userInfo) {
                    callback(userInfo);
                });
                // wait 5 minutes before this message appears again and do not
                // send notificatoin sounds in that time to avoid spam
                setTimeout(function() {
                    cache.ticketSent[cache.ticketID] = undefined;
                }, config.spam_time);
                cache.ticketSent[cache.ticketID] = 0;
            } else if (cache.ticketSent[cache.ticketID] < 5) {
                cache.ticketSent[cache.ticketID]++;
                // TODO: add cache.noSound property for silent notifications
                fowardHandler(ctx, function(userInfo) {
                    callback(userInfo);
                });
            } else if (cache.ticketSent[cache.ticketID] === 5) {
                cache.ticketSent[cache.ticketID]++;
                bot.telegram.sendMessage(chat.id, config.lang_blockedSpam, cache.html);
            }
        }
    });
}

/**
 * Check if msg comes from user or admin.
 * @param {context} ctx Bot context.
 * @param {callback} callback Bot callback.
 */
function fowardHandler(ctx, callback) {
    ctx.getChat().then(function(chat) {
        if (chat.type === "private") {
            cache.ticketID = ctx.message.from.id;
            userInfo = "";
            userInfo += config.lang_from + " " + ctx.message.from.first_name + " ";
            if (ctx.message.from.username) {
                userInfo += "@" + ctx.message.from.username;
            }
            userInfo +=
                " " +
                config.lang_language +
                ": " +
                ctx.message.from.language_code +
                "\n\n";
            callback(userInfo);
        } else {
            callback();
        }
    });
}

module.exports = {
    ticket: ticketHandler,
    file: fileHandler,
};