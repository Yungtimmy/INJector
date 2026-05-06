const axios = require("axios");
const { links, api } = require("../config");

module.exports = async (ctx) => {
  try {
    const response = await axios.get(
      `${api.injectiveRest}/cosmos/mint/v1beta1/inflation`
    );

    const inflation = parseFloat(response.data.inflation);
    const apy = (inflation * 100).toFixed(2);

    ctx.reply(
      ` *Stake INJ*\n\n` +
      `Current APY: *${apy}%*\n\n` +
      `Stake your INJ and earn rewards directly on-chain.\n\n` +
      ` [Open Injective Hub](${links.stake})`,
      { parse_mode: "Markdown", disable_web_page_preview: false }
    );
  } catch (error) {
    ctx.reply(
      ` *Stake INJ*\n\n` +
      `Stake your INJ and earn rewards directly on-chain.\n\n` +
      ` [Open Injective Hub](${links.stake})\n\n` +
      `_Could not fetch live APY right now_`,
      { parse_mode: "Markdown" }
    );
  }
};