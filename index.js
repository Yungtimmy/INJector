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
const addevent = require("./commands/addevent");
const events = require("./commands/events");


bot.command("p", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  const command = args[0]?.toLowerCase();
  const param = args[1]?.toLowerCase();
  if (command?.startsWith("$")) {
    const token = command.slice(1);
    return price(ctx, token);
  }

  switch (command) {
    case "swap":    return swap(ctx);
    case "bridge":  return bridge(ctx);
    case "stake":   return stake(ctx);
    case "price":   return price(ctx, param);
    case "game":    return game(ctx);
    case "nft":    return NFT(ctx);
    case "predict": return predict(ctx);
    case "events":  return events(ctx);
    default:
      return ctx.reply(
        " *INJector Commands*\n\n" +
        "`/p swap` — Swap on Injective\n" +
        "`/p bridge` — Bridge assets\n" +
        "`/p stake` — Stake INJ\n" +
        "`/p $<token>` — Token price\n" +
        "`/p game` — Injective games\n" +
        "`/p nft` — Injective NFTs\n" +
        "`/p predict` — Prediction markets\n" +
        "`/p events` — Upcoming events\n",
        { parse_mode: "Markdown" }
      );
  }
});

bot.launch();
console.log("INJector is live");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));