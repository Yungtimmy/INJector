require("./server");
require("dotenv").config();
const { Telegraf } = require("telegraf");
const swap = require("./commands/swap");
const bridge = require("./commands/bridge");
const stake = require("./commands/stake");
const price = require("./commands/price");
const game = require("./commands/game");
const NFT = require("./commands/NFT");
const predict = require("./commands/predict");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command("p", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const command = args[0]?.toLowerCase();
  const param = args[1]?.toLowerCase();

  switch (command) {
    case "swap":    return swap(ctx);
    case "bridge":  return bridge(ctx);
    case "stake":   return stake(ctx);
    case "price":   return price(ctx, param);
    case "game":    return game(ctx);
    case "NFT":    return NFT(ctx);
    case "predict": return predict(ctx);
    default:
      return ctx.reply(
        " *INJector Commands*\n\n" +
        "`/p swap` — Swap on Injective\n" +
        "`/p bridge` — Bridge assets\n" +
        "`/p stake` — Stake INJ\n" +
        "`/p price <token>` — Token price\n" +
        "`/p game` — Injective games\n" +
        "`/p NFT` — Injective NFTs\n" +
        "`/p predict` — Prediction markets\n",
        { parse_mode: "Markdown" }
      );
  }
});

bot.launch();
console.log("INJector is live");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));