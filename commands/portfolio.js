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
    coingeckoId: 'injective-quants',
    category: 'meme',
  },
  'factory/inj1fnkhu0wrva9a7vgsf6ek5e6dvvkaf2pvvdn5um/talis': {
    symbol: 'TALIS',
    decimals: 6,
    coingeckoId: 'talis-protocol',
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

// ── Transaction helpers ─────────────────────────────────────────────────
const IBC_CHANNELS = {
  'channel-141': 'Ethereum (Peggy)',
  'channel-1': 'Osmosis',
  'channel-220': 'Cosmos Hub',
  'channel-148': 'Axelar',
  'channel-84': 'Kava',
  'channel-177': 'Secret Network',
  'channel-222': 'Stride',
}

function truncateMiddle(s, left = 14, right = 6) {
  if (!s || s.length <= left + right + 3) return s
  return `${s.slice(0, left)}…${s.slice(-right)}`
}

function formatDenom(denom) {
  if (!denom) return 'unknown'
  const known = KNOWN_TOKENS[denom]
  if (known) return known.symbol
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/')
    return parts[2]?.toUpperCase() || truncateMiddle(denom, 14, 6)
  }
  if (denom.startsWith('ibc/')) return truncateMiddle(denom, 12, 6)
  if (denom.startsWith('peggy')) return truncateMiddle(denom, 18, 6)
  return denom
}

// Recursively flatten messages; unwraps authz MsgExec so multisig-wrapped
// inner messages are categorized on their own. Returns `{ msg, wasMultisig }`
// pairs so renderers can flag tx that arrived through an external wrapper.
function extractInnerMessages(msg, wasMultisig = false) {
  if (!msg) return []
  if (msg.type === '/cosmos.authz.v1beta1.MsgExec' && Array.isArray(msg.value?.msgs)) {
    return msg.value.msgs.flatMap(m => extractInnerMessages(m, true))
  }
  return [{ msg, wasMultisig }]
}

// Categorize a single (already-unwrapped) protobuf message into a renderer-friendly entry.
// `wasMultisig` is true if the message reached us through an external wrapper (authz MsgExec).
function categorizeMessage(tx, msg, address, wasMultisig = false) {
  const type = msg.type ?? ''
  const v = msg.value ?? {}

  // SENT / RECEIVED — bank MsgSend (handles multi-denom sends)
  if (type.includes('MsgSend')) {
    const from = v.from_address ?? v.fromAddress
    const to = v.to_address ?? v.toAddress
    const amounts = v.amount ?? []
    if (!amounts.length) return null
    const parts = amounts.map(a => {
      const info = KNOWN_TOKENS[a.denom] ?? { decimals: 18 }
      return { value: formatAmount(a.amount, info.decimals), symbol: formatDenom(a.denom) }
    })
    const first = parts[0]
    const isSent = from === address
    const amountLabel = parts.length > 1
      ? `${first.value.toFixed(4)} ${first.symbol} +${parts.length - 1} more`
      : `${first.value.toFixed(4)} ${first.symbol}`
    return {
      kind: isSent ? 'sent' : 'received',
      icon: isSent ? '➡️' : '⬅️',
      action: isSent ? 'Sent' : 'Received',
      counterparty: isSent ? to : from,
      tokenCA: null,
      amount: first.value,
      denomLabel: first.symbol,
      amountLabel,
      wasMultisig,
      timestamp: tx.block_unix_timestamp,
      status: tx.code === 0,
    }
  }

  // BRIDGED — IBC MsgTransfer
  if (type.includes('MsgTransfer')) {
    const sender = v.sender
    const receiver = v.receiver
    const channel = v.source_channel ?? 'unknown'
    const token = v.token ?? {}
    const info = KNOWN_TOKENS[token.denom] ?? { decimals: 18 }
    const amount = formatAmount(token.amount ?? '0', info.decimals)
    const destChain = IBC_CHANNELS[channel] ?? `IBC (${channel})`
    return {
      kind: 'bridged',
      icon: '🌉',
      action: 'Bridged',
      counterparty: sender === address ? receiver : sender,
      tokenCA: `${destChain} · ${channel}`,
      amount,
      denomLabel: formatDenom(token.denom),
      amountLabel: `${amount.toFixed(4)} ${formatDenom(token.denom)}`,
      wasMultisig,
      timestamp: tx.block_unix_timestamp,
      status: tx.code === 0,
    }
  }

  // CONTRACT — CW20 / wasm MsgExecuteContract (covers DEX swaps + Peggy); handles multi-denom funds
  if (type.includes('MsgExecuteContract')) {
    const sender = v.sender
    const contract = v.contract ?? ''
    const funds = v.funds ?? []
    let inner = {}
    try {
      inner = typeof v.msg === 'string' ? JSON.parse(v.msg) : (v.msg ?? {})
    } catch {}
    const isSwap = Object.keys(inner).some(k => k.toLowerCase().includes('swap'))
    let amount = null
    let denom = ''
    let amountLabel = null
    if (funds.length > 0) {
      denom = funds[0].denom
      const info = KNOWN_TOKENS[denom] ?? { decimals: 18 }
      amount = formatAmount(funds[0].amount, info.decimals)
      const head = `${amount.toFixed(4)} ${formatDenom(denom)}`
      amountLabel = funds.length > 1
        ? `${head} +${funds.length - 1} more`
        : head
    }
    const counterpartyAddr = sender === address ? contract : sender
    return {
      kind: isSwap ? 'swapped' : 'contract',
      icon: isSwap ? '🔁' : '🧾',
      action: isSwap ? 'Swapped' : 'Contract',
      counterparty: counterpartyAddr || 'unknown',
      tokenCA: contract || null,
      amount,
      denomLabel: denom ? formatDenom(denom) : null,
      amountLabel,
      wasMultisig,
      timestamp: tx.block_unix_timestamp,
      status: tx.code === 0,
    }
  }

  // NATIVE SPOT — Helix native orderbook
  if (
    type.includes('MsgCreateSpotMarketOrder') ||
    type.includes('MsgBatchUpdateOrders') ||
    type.includes('MsgCreateDerivativeMarketOrder') ||
    type.includes('MsgBatchUpdateDerivativeOrders')
  ) {
    const sender = v.sender ?? ''
    const orderInfo = v.order?.order_info ?? v.order ?? {}
    const marketId = orderInfo.market_id ?? ''
    return {
      kind: 'swapped',
      icon: '🔁',
      action: 'Spot Trade',
      counterparty: marketId ? `Helix · ${marketId}` : 'Helix',
      tokenCA: marketId || null,
      amount: null,
      denomLabel: null,
      amountLabel: null,
      wasMultisig,
      timestamp: tx.block_unix_timestamp,
      status: tx.code === 0,
    }
  }

  return null
}

function renderTx(entry, idx) {
  const status = entry.status ? '✅' : '❌'
  const date = entry.timestamp ? formatDate(entry.timestamp) : 'Unknown date'
  const lines = [`${idx}. ${status} ${entry.icon} *${entry.action}*`]
  if (entry.amountLabel) {
    lines.push(`   💰 *${entry.amountLabel}*`)
  } else if (entry.amount !== null && entry.denomLabel) {
    lines.push(`   💰 *${entry.amount.toFixed(4)} ${entry.denomLabel}*`)
  }
  lines.push(`   🔗 \`${entry.counterparty}\``)
  if (entry.tokenCA) {
    lines.push(`   📝 ${entry.tokenCA}`)
  }
  if (entry.wasMultisig) {
    lines.push(`   🔐 Multisig`)
  }
  lines.push(`   🕐 ${date}`)
  return lines.join('\n')
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

    // ── Fetch + categorize recent transactions (sent/swapped/bridged/received) ───
    let txList = '_No recent transactions found_'
    try {
      const txRes = await axios.get(
        `https://sentry.exchange.grpc-web.injective.network/api/explorer/v1/accountTxs/${address}?limit=100`
      )
      const txs = txRes.data.data ?? []

      // Walk newest-first; recursively unwrap multisig/authz; take first 5 categorizable entries.
      const entries = []
      outer: for (const tx of txs) {
        const inner = (tx.messages ?? []).flatMap(m => extractInnerMessages(m))
        for (const item of inner) {
          const entry = categorizeMessage(tx, item.msg, address, item.wasMultisig)
          if (entry) {
            entries.push(entry)
            if (entries.length >= 5) break outer
          }
        }
      }

      if (entries.length > 0) {
        txList = entries.map((e, i) => renderTx(e, i + 1)).join('\n\n')
      } else {
        txList = '_No recent activity found_'
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