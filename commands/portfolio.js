const axios = require('axios')

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

    // Fetch balance + INJ price in parallel
    const [balanceRes, priceRes] = await Promise.all([
      axios.get(
        `https://sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}`
      ),
      axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd`
      ),
    ])

    const injBalance = balanceRes.data.balances?.find(b => b.denom === 'inj')
    const inj = injBalance ? parseFloat(injBalance.amount) / 1e18 : 0
    const balance = inj.toFixed(4)
    const injPrice = priceRes.data['injective-protocol'].usd
    const usdValue = (inj * injPrice).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    // Fetch transactions from Injective indexer
    let txList = '_No recent transactions found_'
    try {
      const txRes = await axios.get(
        `https://sentry.exchange.grpc-web.injective.network/api/explorer/v1/accountTxs/${address}?limit=5`
      )

      const txs = txRes.data.data ?? []

      if (txs.length > 0) {
        txList = txs.map((tx, i) => {
          const shortHash = `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`
          const status = tx.code === 0 ? '✅' : '❌'
          const type = tx.messages?.[0]?.type?.split('.').pop() ?? 'Unknown'
          return `${i + 1}. ${status} \`${shortHash}\`\n   Type: ${type}\n   Block: ${tx.blockNumber}`
        }).join('\n\n')
      }
    } catch (txErr) {
      console.error('TX fetch failed:', txErr.message)
      txList = '_Could not fetch transactions_'
    }

    const shortAddr = `${address.slice(0, 10)}...${address.slice(-6)}`

    ctx.reply(
      `👛 *Portfolio Tracker*\n\n` +
      `📍 Address: \`${shortAddr}\`\n` +
      `💰 INJ Balance: *${balance} INJ*\n` +
      `💵 USD Value: *$${usdValue}*\n\n` +
      `📜 *Last 5 Transactions:*\n\n` +
      `${txList}`,
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