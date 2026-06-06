const axios = require('axios')

const TOKENS = {
  inj: { id: 'injective-protocol', symbol: 'INJ', flag: '🔵' },
  btc: { id: 'bitcoin', symbol: 'BTC', flag: '🟠' },
  eth: { id: 'ethereum', symbol: 'ETH', flag: '🔷' },
  sol: { id: 'solana', symbol: 'SOL', flag: '🟣' },
  xion: { id: 'xion-2', symbol: 'XION', flag: '⚪' },
  pi: { id: 'pi-network', symbol: 'PI', flag: '🟡' },
}

module.exports = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ')
    const command = args[0].replace('/', '').toLowerCase()
    const amount = parseFloat(args[1])

    const token = TOKENS[command]

    if (!token) {
      return ctx.reply(
        `❓ Supported tokens:\n\n` +
        Object.keys(TOKENS).map(t => `\`/${t} <amount>\``).join('\n'),
        { parse_mode: 'Markdown' }
      )
    }

    if (!amount || isNaN(amount)) {
      return ctx.reply(
        `❓ *Usage:* \`/${command} <amount>\`\n\n*Example:* \`/${command} 5\``,
        { parse_mode: 'Markdown' }
      )
    }

    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd,ngn&include_24hr_change=true`
    )

    const data = res.data[token.id]
    const usdPrice = data.usd
    const ngnPrice = data.ngn
    const change = data.usd_24h_change?.toFixed(2)
    const trend = change >= 0 ? '📈' : '📉'

    const usdValue = (amount * usdPrice).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const ngnValue = (amount * ngnPrice).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    ctx.reply(
      `${token.flag} *${token.symbol} Converter*\n\n` +
      `*${amount} ${token.symbol}* is worth:\n\n` +
      `🇺🇸 *$${usdValue} USD*\n` +
      `🇳🇬 *₦${ngnValue} NGN*\n\n` +
      `Current Price: *$${usdPrice.toLocaleString()}* ${trend} ${change}%\n\n` +
      `_Powered by CoinGecko_ 📊`,
      { parse_mode: 'Markdown' }
    )
  } catch (err) {
    console.error('Converter error:', err.message)
    ctx.reply(`⚠️ Could not fetch price right now. Try again later.`)
  }
}