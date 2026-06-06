const axios = require('axios')

module.exports = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1)
    const amount = parseFloat(args[0])

    if (!amount || isNaN(amount)) {
      return ctx.reply(
        `❓ *Usage:* \`/inj <amount>\`\n\n` +
        `*Example:*\n` +
        '`/inj 5`\n' +
        '`/inj 100`',
        { parse_mode: 'Markdown' }
      )
    }

    const res = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd,ngn'
    )

    const data = res.data['injective-protocol']
    const usdPrice = data.usd
    const ngnPrice = data.ngn

    const usdValue = (amount * usdPrice).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const ngnValue = (amount * ngnPrice).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    ctx.reply(
      `💱 *INJ Converter*\n\n` +
      `*${amount} INJ* is worth:\n\n` +
      `🇺🇸 *$${usdValue} USD*\n` +
      `🇳🇬 *₦${ngnValue} NGN*\n\n` +
      `_Powered by CoinGecko_ 📊`,
      { parse_mode: 'Markdown' }
    )
  } catch (err) {
    console.error('INJ converter error:', err.message)
    ctx.reply(
      `⚠️ Could not fetch INJ price right now. Try again later.`,
      { parse_mode: 'Markdown' }
    )
  }
}
