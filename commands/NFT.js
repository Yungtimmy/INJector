const { links } = require("../config");

module.exports = async (ctx) => {
  try {
    ctx.reply(
      ` *Injective NFT Marketplace*\n\n` +
      `Discover, buy and sell NFTs built on Injective.\n\n` +
      ` *Talis* — The leading NFT marketplace on Injective\n` +
      ` [Open Talis](${links.nft})\n\n` +
      `_Collect. Trade. Own._ ⚡`,
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      ` *Injective NFT Marketplace*\n\n` +
      ` [Open Talis](${links.nft})\n\n` +
      `_Something went wrong, try again_`,
      { parse_mode: "Markdown" }
    );
  }
};