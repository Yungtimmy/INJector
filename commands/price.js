const axios = require("axios");
const { coingeckoIds, api } = require("../config");

module.exports = async (ctx, token) => {
  try {
    if (!token) {
      return ctx.reply(
        `❓ *Usage:* \`/t <token>\`\n\n` +
        `*Examples:*\n` +
        "`/t inj`\n" +
        "`/t btc`\n" +
        "`/t eth`",
        { parse_mode: "Markdown" }
      );
    }

    const coinId = coingeckoIds[token.toLowerCase()];

    if (!coinId) {
      return ctx.reply(
        `⚠️ *"${token.toUpperCase()}"* is not supported yet.\n\n` +
        `*Supported tokens:* ${Object.keys(coingeckoIds).join(", ").toUpperCase()}`,
        { parse_mode: "Markdown" }
      );
    }

    const response = await axios.get(
      `${api.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );

    const data = response.data[coinId];
    const price = data.usd.toLocaleString("en-US", { minimumFractionDigits: 2 });
    const change = data.usd_24h_change.toFixed(2);
    const marketCap = (data.usd_market_cap / 1e9).toFixed(2);
    const trend = change >= 0 ? "📈" : "📉";

    ctx.reply(
      `*${token.toUpperCase()} Price*\n\n` +
      `Price: *$${price}*\n` +
      `24h Change: *${change}%* ${trend}\n` +
      `Market Cap: *$${marketCap}B*`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    ctx.reply(
      `Could not fetch price for *${token?.toUpperCase()}* right now. Try again later.`,
      { parse_mode: "Markdown" }
    );
  }
};