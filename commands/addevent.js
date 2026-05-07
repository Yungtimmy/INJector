const { db } = require("../services/firebase");

const ADMIN_ID = 6090484839;

module.exports = async (ctx) => {
  try {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.reply(" You are not authorized to use this command.");
    }

    const args = ctx.message.text.split("/padmin addevent")[1]?.trim();

    if (!args) {
      return ctx.reply(
        ` *Usage:*\n\n` +
        "`/padmin addevent <name> | <date> | <description> | <link>`\n\n" +
        `*Example:*\n` +
        "`/padmin addevent Community Call | May 20, 2026 | Monthly update from Injective team | https://twitter.com/injective`",
        { parse_mode: "Markdown" }
      );
    }

    const parts = args.split("|").map(p => p.trim());

    if (parts.length !== 4) {
      return ctx.reply(
        " Invalid format. Make sure you have 4 parts separated by `|`",
        { parse_mode: "Markdown" }
      );
    }

    const [name, date, description, link] = parts;

    await db.collection("events").add({
      name,
      date,
      description,
      link,
      createdAt: new Date().toISOString(),
    });

    ctx.reply(
      ` *Event added successfully!*\n\n` +
      ` *${name}*\n` +
      `🗓 ${date}\n` +
      `${description}\n` +
      ` ${link}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error(error);
    ctx.reply(" Failed to add event. Try again.");
  }
};