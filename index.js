require("./server");
require("dotenv").config();
const { Telegraf } = require("telegraf");
const portfolio = require('./commands/portfolio')
const addevent = require("./commands/addevent");
const swap = require("./commands/swap");
const bridge = require("./commands/bridge");
const stake = require("./commands/stake");
const price = require("./commands/price");
const game = require("./commands/game");
const NFT = require("./commands/NFT");
const convert = require('./commands/convert');
const predict = require("./commands/predict");
const events = require("./commands/events");

const bot = new Telegraf(process.env.BOT_TOKEN);

const HELP_TEXT =
  "*Welcome to INJector* 🟦\n\n" +
  "*Commands*\n" +
  "`/swap` — Swap on Injective\n" +
  "`/bridge` — Bridge assets\n" +
  "`/stake` — Stake INJ\n" +
  "`/t inj` — INJ token price\n" +
  "`/t <token>` — Any token price\n" +
  "`/game` — Injective games\n" +
  "`/nft` — Injective NFTs\n" +
  "`/predict` — Prediction markets\n" +
  "`/events` — Upcoming events\n" +
  "`/port <address>` — Portfolio tracker";

// ── Start & Help ───────────────────────────────────────────────────────────
bot.command("start", (ctx) => ctx.reply(HELP_TEXT, { parse_mode: "Markdown" }));


// ── INJ price shorthand ────────────────────────────────────────────────────
bot.command("$inj", (ctx) => price(ctx, "inj"));

// ── Individual slash commands ──────────────────────────────────────────────
bot.command("swap",    (ctx) => swap(ctx));
bot.command("bridge",  (ctx) => bridge(ctx));
bot.command("stake",   (ctx) => stake(ctx));
bot.command("game",    (ctx) => game(ctx));
bot.command("nft",     (ctx) => NFT(ctx));
bot.command("predict", (ctx) => predict(ctx));
bot.command("events",  (ctx) => events(ctx));
bot.command("port",    (ctx) => portfolio(ctx));

// Register all token converters
['inj', 'btc', 'eth', 'sol', 'xion', 'pi'].forEach(token => {
  bot.command(token, (ctx) => convert(ctx))
})

// ── Token price: /t <token>  or  /t inj ───────────────────────────────────
bot.command("t", (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const token = args[0]?.toLowerCase();
  return price(ctx, token);
});

// ── Admin ──────────────────────────────────────────────────────────────────
bot.command("padmin", (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  if (args[0]?.toLowerCase() === "addevent") return addevent(ctx);
});

bot.launch();
console.log("INJector is live");

process.once("SIGINT",  () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
