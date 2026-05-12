const axios = require('axios')

// ── Token registry ─────────────────────────────────────────────────────────
const KNOWN_TOKENS = {
  inj: {
    symbol: 'INJ',
    decimals: 18,
    coingeckoId: 'injective-protocol',
    category: 'inj',
  },
  'ibc/B448C0CA358B958301D328CCDC5D5AD642FC30A6D3AE106FF721DB315F3DDE5C': {
    symbol: 'USDT',
    decimals: 6,
    coingeckoId: 'tether',
    category: 'stable',
  },
  'ibc/2CBC2EA121AE42563B08028466F37B600F2D7D4282342DE938283CC3FB2BC00E': {
    symbol: 'USDC',
    decimals: 6,
    coingeckoId: 'usd-coin',
    category: 'stable',
  },
  'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    symbol: 'USDTe',
    decimals: 6,
    coingeckoId: 'tether',
    category: 'stable',
  },
  'factory/inj1xtel2knkt8hmc9dnzpjz6kdmacgcfmlv5f308w/ninja': {
    symbol: 'NINJA',
    decimals: 6,
    coingeckoId: 'dog-wif-nunchucks',
    category: 'meme',
  },
  'factory/inj127l5a2wmkyvucxdlupqyac3y0v6wqfhq03ka64/qunt': {
    symbol: 'QUNT',
    decimals: 6,
    coingeckoId: null,
    category: 'meme',
  },
  'factory/inj1fnkhu0wrva9a7vgsf6ek5e6dvvkaf2pvvdn5um/talis': {
    symbol: 'TALIS',
    decimals: 6,
    coingeckoId: null,
    category: 'meme',
  },
  'factory/inj1maeyvxfamtn8lfyxpjca8kuvauuf2qeu6gtxm7/whd': {
    symbol: 'WHD',
    decimals: 6,
    coingeckoId: null,
    category: 'meme',
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatAmount(raw, decimals) {
  return parseFloat(raw) / Math.pow(10, decimals)
}

function formatUsd(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(timestamp) {
  // timestamp can be seconds or milliseconds
  const ms = String(timestamp).length === 10 ? timestamp * 1000 : timestamp
  const d = new Date(ms)
  return d.toUTCString().replace(' GMT', ' UTC')
}

function buildPriceQuery(tokens) {
  const ids = [...new Set(tokens.map(t => t.coingeckoId).filter(Boolean))]
  return ids.join(',')
}

// ── Main ───────────────────────────────────────────────────────────────────
module.exports = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1)
    const address = args[0]

    if (!address) {
      return ctx.reply(
        `❓ *Usage:* \`/port <injective address>\`\n\n` +
        `*Example:*\n` +
        '`/port inj1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`',
        { parse_mode: 'Markdown' }
      )
    }

    if (!address.startsWith('inj1')) {
      return ctx.reply(
        `⚠️ Invalid address. Injective addresses start with *inj1*`,
        { parse_mode: 'Markdown' }
      )
    }

    // ── Fetch all balances ───────────────────────────────────────────────
    const balanceRes = await axios.get(
      `https://sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}?pagination.limit=100`
    )
    const rawBalances = balanceRes.data.balances ?? []

    const holdings = rawBalances
      .map(b => {
        const info = KNOWN_TOKENS[b.denom]
        if (!info) return null
        const amount = formatAmount(b.amount, info.decimals)
        if (amount < 0.0001) return null
        return { ...info, amount, denom: b.denom }
      })
      .filter(Boolean)

    // ── Fetch prices ─────────────────────────────────────────────────────
    const priceQuery = buildPriceQuery(holdings)
    let prices = {}
    if (priceQuery) {
      const priceRes = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${priceQuery}&vs_currencies=usd`
      )
      prices = priceRes.data
    }

    let totalUsd = 0
    const enriched = holdings.map(h => {
      const usd = h.coingeckoId && prices[h.coingeckoId]
        ? h.amount * prices[h.coingeckoId].usd
        : null
      if (usd) totalUsd += usd
      return { ...h, usd }
    })

    const groups = {
      inj:    enriched.filter(t => t.category === 'inj'),
      stable: enriched.filter(t => t.category === 'stable'),
      meme:   enriched.filter(t => t.category === 'meme'),
    }

    function renderGroup(tokens) {
      if (!tokens.length) return '_None_'
      return tokens.map(t => {
        const amt = t.amount.toFixed(4)
        const usdStr = t.usd !== null ? ` ≈ $${formatUsd(t.usd)}` : ''
        return `• *${t.symbol}:* ${amt}${usdStr}`
      }).join('\n')
    }

    // ── Fetch recent transactions (sent/received only) ────────────────────
    let txList = '_No recent transactions found_'
    try {
      const injPrice = prices['injective-protocol']?.usd ?? 0

      const txRes = await axios.get(
        `https://sentry.exchange.grpc-web.injective.network/api/explorer/v1/accountTxs/${address}?limit=20`
      )
      const txs = txRes.data.data ?? []

      // Filter to MsgSend only, take first 5
      const sendTxs = txs
        .filter(tx => {
          const msgType = tx.messages?.[0]?.type ?? ''
          return msgType.includes('MsgSend')
        })
        .slice(0, 5)

      if (sendTxs.length > 0) {
        txList = sendTxs.map((tx, i) => {
          const msg = tx.messages[0]
          const value = msg.value ?? {}
          const from = value.from_address ?? value.fromAddress ?? ''
          const isSent = from === address
          const direction = isSent ? '➡️ Sent' : '⬅️ Received'

          // Amount
          const amountArr = value.amount ?? []
          const injAmt = Array.isArray(amountArr)
            ? amountArr.find(a => a.denom === 'inj')
            : amountArr.denom === 'inj' ? amountArr : null

          let amountStr = 'N/A'
          let usdStr = ''
          if (injAmt) {
            const injFloat = parseFloat(injAmt.amount) / 1e18
            amountStr = `${injFloat.toFixed(4)} INJ`
            if (injPrice) {
              usdStr = ` ≈ $${formatUsd(injFloat * injPrice)}`
            }
          }

          // Date
          const date = tx.block_unix_timestamp
            ? formatDate(tx.block_unix_timestamp)
            : tx.block_timestamp ?? 'Unknown date'

          const status = tx.code === 0 ? '✅' : '❌'
          return (
            `${i + 1}. ${status} ${direction}\n` +
            `   💰 *${amountStr}*${usdStr}\n` +
            `   🕐 ${date}`
          )
        }).join('\n\n')

        if (sendTxs.length === 0) txList = '_No sent/received transactions found_'
      }
    } catch (txErr) {
      console.error('TX fetch failed:', txErr.message)
      txList = '_Could not fetch transactions_'
    }

    const shortAddr = `${address.slice(0, 10)}...${address.slice(-6)}`

    ctx.reply(
      `👛 *Portfolio Tracker*\n` +
      `📍 \`${shortAddr}\`\n` +
      `💼 Total Value: *$${formatUsd(totalUsd)}*\n\n` +

      `🟦 *INJ*\n${renderGroup(groups.inj)}\n\n` +
      `💵 *Stablecoins*\n${renderGroup(groups.stable)}\n\n` +
      `🐸 *Memes*\n${renderGroup(groups.meme)}\n\n` +

      `📜 *Last 5 Transactions*\n\n${txList}`,
      { parse_mode: 'Markdown' }
    )
  } catch (err) {
    console.error('Portfolio error:', err.message)
    ctx.reply(
      `⚠️ Could not fetch portfolio. Check the address and try again.`,
      { parse_mode: 'Markdown' }
    )
  }
}