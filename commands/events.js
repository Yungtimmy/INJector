const { db } = require("../services/firebase");

module.exports = async (ctx) => {
  try {
    const snapshot = await db.collection("events")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return ctx.reply(
        ` *Injective Events*\n\n` +
        `_No upcoming events right now. Check back soon!_ 👀`,
        { parse_mode: "Markdown" }
      );
    }

    const list = snapshot.docs.map(doc => {
      const e = doc.data();
      return ` *${e.name}*\n` +
        ` ${e.date}\n` +
        `${e.description}\n` +
        ` [More Info](${e.link})`;
    }).join("\n\n");

    ctx.reply(
      ` *Upcoming Injective Events*\n\n${list}`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  } catch (error) {
    console.error(error);
    ctx.reply(" Could not load events right now, try again.");
  }
};