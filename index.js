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
const predict = require("./commands/predict");
const events = require("./commands/events");

const bot = new Telegraf(process.env.BOT_TOKEN);

// ── Individual slash commands ──────────────────────────────────────────────
bot.command("swap",    (ctx) => swap(ctx));
bot.command("bridge",  (ctx) => bridge(ctx));
bot.command("stake",   (ctx) => stake(ctx));
bot.command("game",    (ctx) => game(ctx));
bot.command("nft",     (ctx) => NFT(ctx));
bot.command("predict", (ctx) => predict(ctx));
bot.command("events",  (ctx) => events(ctx));
bot.command("port",    (ctx) => portfolio(ctx));

// /price <token>  or  /$token
bot.command("price", (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const token = args[0]?.toLowerCase();
  return price(ctx, token);
});

// Shorthand: /p $token  (kept for convenience)
bot.hears(/^\/p \$(\w+)/i, (ctx) => {
  const token = ctx.match[1].toLowerCase();
  return price(ctx, token);
});

// ── /p  →  help menu ───────────────────────────────────────────────────────
bot.command("p", (ctx) => {
  return ctx.reply(
    "*INJector Commands*\n\n" +
    "`/swap` — Swap on Injective\n" +
    "`/bridge` — Bridge assets\n" +
    "`/stake` — Stake INJ\n" +
    "`/price <token>` — Token price\n" +
    "`/game` — Injective games\n" +
    "`/nft` — Injective NFTs\n" +
    "`/predict` — Prediction markets\n" +
    "`/events` — Upcoming events\n" +
    "`/port <address>` — Portfolio tracker",
    { parse_mode: "Markdown" }
  );
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