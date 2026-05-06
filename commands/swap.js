const axios = require("axios");
const { links, coingeckoIds, api } = require("../config");

module.exports = async (ctx) => {
  try {
    const response = await axios.get(
      `${api.coingecko}/simple/price?ids=${coingeckoIds.inj}&vs_currencies=usd&include_24hr_change=true`
    );

    const data = response.data[coingeckoIds.inj];
    const price = data.usd.toLocaleString("en-US", { minimumFractionDigits: 2 });
    const change = data.usd_24h_change.toFixed(2);
    const trend = change >= 0 ? "📈" : "📉";

    ctx.reply(
      ` *Swap on Injective*\n\n` +
      `INJ Price: *$${price}* ${trend} ${change}%\n\n` +
      ` [Open Helix](${links.swap})`,
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      ` *Swap on Injective*\n\n` +
      `[Open Helix](${links.swap})\n\n` +
      `_Could not fetch live price right now_`,
      { parse_mode: "Markdown" }
    );
  }
};