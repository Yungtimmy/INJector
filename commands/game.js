const { links } = require("../config");

module.exports = async (ctx) => {
  try {
    ctx.reply(
      ` *Injective Games*\n\n` +
      `Explore games and gaming dapps built on Injective.\n\n` +
      ` *Onikuma* — Play-to-earn gaming on Injective\n` +
      ` [Open Onikuma](${links.game1})\n\n` +
      ' *Blaze Ninja* - Gaming and gambling\n' +
      ` [Open BlazeNinja](${links.game2})\n\n` +
      ' *Injcasino* - Casino games on injective\n' +
      ` [Open Injcasino](${links.game3})\n\n` 
      `_More games coming to Injective soon_ 👀`,
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      ` *Injective Games*\n\n` +
      ` [Open Onikuma](${links.game})\n\n` +
      `_Something went wrong, try again_`,
      { parse_mode: "Markdown" }
    );
  }
};