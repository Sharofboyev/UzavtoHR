module.exports = {
    // bot settings
    bot_token: "", // support bot token
    staffchat_id: "-1001390665858", // eg. -123456789
    other_staff: {
        MAN: { id: "-428786147", child: {} },
        Chevrolet: { id: "65446", child: {} },
        UzTrailer: { id: "6468464", child: {} },
        Daewoo: { id: "54848", child: {} },
        Ravon: { id: "41978854", child: {} },
    },
    owner_id: "346686979",
    spam_time: 5 * 60 * 1000, // time (in MS) in which user may send 5 messages

    // customize your language
    startCommandText: "Здравствуйте! Я принимаю рекомендации и жалобы от сотрудников UzAuto.\nПожалуйста, выберите:",
    faqCommandText: 'Наш сайт: <a href="https://uzautomotors.com/">uzautomotors.com</a>',
    helpCommandText: "<b>Доступные команды: </b>\n/help\n/faq\n/id",
    lang_contactMessage: `Спасибо за отзыв! Скоро я отвечу на ваше письмо.\n\nНажмите /start чтобы вернуться в главное меню.`,
    lang_blockedSpam: `Вы задаёте слишком много вопросов в последнее время. Пожалуйста, дождитесь пока администратор рассмотрит ваши письма!`,
    lang_ticket: "Отзыв",
    lang_acceptedBy: "был одобрен",
    lang_dear: "Уважаемый",
    lang_regards: "С наилучшими пожеланиями,\nUzAutoSanoat",
    lang_from: "от",
    lang_language: "Язык",
    lang_msg_sent: "Ответ отправлен пользователю",
    lang_usr_with_ticket: "Пользователь с отзывом",
    lang_banned: "заблокирован",
    lang_wrong: "Неправильный запрос",
    lang_wrong_close: "Неправильный запрос. Возможно отзыв был закрыт или нету отзыва с таким ID",
    btn_leave_recommendation: "Оставьте рекомендации:",
    btn_leave_complaint: "Оставьте жалобу:",
    btn_more_info: 'Акционерное общество "Узавтосаноат"',
};
