const { links } = require("../config");

module.exports = async (ctx) => {
  try {
    ctx.reply(
      ` *Prediction Markets on Injective*\n\n` +
      `Make predictions on crypto, sports & world events.\n\n` +
      ` *MerlinMarkets* — The leading prediction market on Injective\n` +
      ` [Open MerlinMarkets](${links.predict})\n\n` +
      `_Place your bets, trust the chain_ ⚡`,
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      ` *Prediction Markets*\n\n` +
      ` [Open MerlinMarkets](${links.predict})\n\n` +
      `_Something went wrong, try again_`,
      { parse_mode: "Markdown" }
    );
  }
};