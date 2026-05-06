const { links } = require("../config");

module.exports = async (ctx) => {
  try {
    ctx.reply(
      *Bridge Assets to Injective*\n\n +
      Transfer assets across chains seamlessly via the official Injective Bridge.\n\n +
      Supported: Ethereum, Cosmos, Solana & more\n\n +
       [Open Injective Bridge](${links.bridge}),
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      *Bridge Assets to Injective*\n\n +
      [Open Injective Bridge](${links.bridge})\n\n +
      _Something went wrong, try again_,
      { parse_mode: "Markdown" }
    );
  }
};
