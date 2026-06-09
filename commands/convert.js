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
    const input = args[1]

    const token = TOKENS[command]

    if (!token) {
      return ctx.reply(
        `❓ Supported tokens:\n\n` +
        Object.keys(TOKENS).map(t => `\`/${t} <amount>\``).join('\n'),
        { parse_mode: 'Markdown' }
      )
    }

    if (!input) {
      return ctx.reply(
        `❓ *Usage:*\n\n` +
        `\`/${command} 5\` — Convert ${token.symbol} to USD & Naira\n` +
        `\`/${command} $50\` — Convert $50 USD to ${token.symbol}\n` +
        `\`/${command} ₦50000\` — Convert ₦50,000 to ${token.symbol}`,
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

    // ── Reverse: /inj $50 ──────────────────────────────────────────────
    if (input.startsWith('$')) {
      const usdAmount = parseFloat(input.replace('$', ''))
      if (isNaN(usdAmount)) return ctx.reply('⚠️ Invalid amount.')

      const tokenAmount = (usdAmount / usdPrice).toFixed(6)
      const ngnEquiv = (usdAmount * (ngnPrice / usdPrice)).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
      })

      return ctx.reply(
        `${token.flag} *USD → ${token.symbol}*\n\n` +
        `*$${usdAmount} USD* = *${tokenAmount} ${token.symbol}*\n` +
        `🇳🇬 That's roughly *₦${ngnEquiv} NGN*\n\n` +
        `${token.symbol} Price: *$${usdPrice.toLocaleString()}* ${trend} ${change}%\n\n` +
        `_Powered by CoinGecko_ 📊`,
        { parse_mode: 'Markdown' }
      )
    }

    // ── Reverse: /inj ₦50000 ──────────────────────────────────────────
    if (input.startsWith('₦') || input.toLowerCase().startsWith('ngn')) {
      const ngnAmount = parseFloat(input.replace('₦', '').replace(/ngn/i, '').replace(/,/g, ''))
      if (isNaN(ngnAmount)) return ctx.reply('⚠️ Invalid amount.')

      const tokenAmount = (ngnAmount / ngnPrice).toFixed(6)
      const usdEquiv = (ngnAmount / (ngnPrice / usdPrice)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
      })

      return ctx.reply(
        `${token.flag} *NGN → ${token.symbol}*\n\n` +
        `*₦${ngnAmount.toLocaleString()} NGN* = *${tokenAmount} ${token.symbol}*\n` +
        `🇺🇸 That's roughly *$${usdEquiv} USD*\n\n` +
        `${token.symbol} Price: *$${usdPrice.toLocaleString()}* ${trend} ${change}%\n\n` +
        `_Powered by CoinGecko_ 📊`,
        { parse_mode: 'Markdown' }
      )
    }

    // ── Forward: /inj 5 ───────────────────────────────────────────────
    const amount = parseFloat(input)
    if (isNaN(amount)) return ctx.reply('⚠️ Invalid amount.')

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
