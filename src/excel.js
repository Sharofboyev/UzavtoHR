const config = require("../config");
const excel = require("excel4node");
const fs = require("fs");
const dbhandler = require("./dbhandler");

exports.excel = async function(ctx) {
    if (
        ctx.message.chat.id.toString() === config.staffchat_id ||
        ctx.message.chat.id == config.owner_id
    ) {
        dbhandler.all(async(data) => {
            let workbook = new excel.Workbook();
            let worksheet = workbook.addWorksheet("Лист 1");

            let styleC = workbook.createStyle({
                font: {
                    size: 16,
                },
            });
            let style = workbook.createStyle({
                font: {
                    size: 14,
                },
            });
            worksheet.cell(1, 1).string("№").style(styleC);
            worksheet.cell(1, 2).string("ID пользователя").style(styleC);
            worksheet.cell(1, 3).string("Имя пользователя").style(styleC);
            worksheet.cell(1, 4).string("Статус").style(styleC);
            worksheet.cell(1, 5).string("Тип").style(styleC);
            worksheet.cell(1, 6).string("Текст сообщениия").style(styleC);
            worksheet.cell(1, 7).string("Ответ").style(styleC);
            worksheet.cell(1, 8).string("Время").style(styleC);
            try {
                for (let i = 2; i < data.length + 2; i++) {
                    worksheet
                        .cell(i, 1)
                        .number(data[i - 2].id)
                        .style(style);
                    worksheet
                        .cell(i, 2)
                        .string(data[i - 2].userid)
                        .style(style);
                    worksheet
                        .cell(i, 3)
                        .string(data[i - 2].name)
                        .style(style);
                    worksheet
                        .cell(i, 4)
                        .string(data[i - 2].status)
                        .style(style);
                    if (data[i - 2].type)
                        worksheet
                        .cell(i, 5)
                        .string(data[i - 2].type)
                        .style(style);
                    worksheet
                        .cell(i, 6)
                        .string(data[i - 2].message)
                        .style(style);
                    if (data[i - 2].answer)
                        worksheet
                        .cell(i, 7)
                        .string(data[i - 2].answer)
                        .style(style);
                    worksheet
                        .cell(i, 8)
                        .string(data[i - 2].created_time.toLocaleString())
                        .style(style);
                }
            } catch (err) {
                console.log(err.message);
            }
            workbook.write("Excel.xlsx", (res) => {
                fs.readFile("./Excel.xlsx", (err, data) => {
                    if (err) return console.log(err.message);
                    ctx.replyWithDocument({ source: data, filename: "База.xlsx" });
                });
            });
        });
    }
};