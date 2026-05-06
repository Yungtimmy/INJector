const axios = require("axios");
const { api, coingeckoIds } = require("../config");

// Fetch live INJ price from CoinGecko
const getINJPrice = async () => {
  const response = await axios.get(
    `${api.coingecko}/simple/price?ids=${coingeckoIds.inj}&vs_currencies=usd&include_24hr_change=true`
  );
  return response.data[coingeckoIds.inj];
};

// Fetch live price for any supported token
const getTokenPrice = async (coinId) => {
  const response = await axios.get(
    `${api.coingecko}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  );
  return response.data[coinId];
};

// Fetch current INJ staking APY from Injective REST
const getStakingAPY = async () => {
  const response = await axios.get(
    `${api.injectiveRest}/cosmos/mint/v1beta1/inflation`
  );
  const inflation = parseFloat(response.data.inflation);
  return (inflation * 100).toFixed(2);
};

module.exports = {
  getINJPrice,
  getTokenPrice,
  getStakingAPY,
};