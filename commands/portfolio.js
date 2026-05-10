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

    // Fetch balance first
    const balanceRes = await axios.get(
      `https://sentry.lcd.injective.network/cosmos/bank/v1beta1/balances/${address}`
    )

    const injBalance = balanceRes.data.balances?.find(b => b.denom === 'inj')
    const balance = injBalance
      ? (parseFloat(injBalance.amount) / 1e18).toFixed(4)
      : '0.0000'

    // Fetch transactions separately with encoded address
    let txList = '_No recent transactions found_'
    try {
      const encodedAddress = encodeURIComponent(`'${address}'`)
      const txRes = await axios.get(
        `https://sentry.lcd.injective.network/cosmos/tx/v1beta1/txs?events=message.sender=${encodedAddress}&limit=5&order_by=ORDER_BY_DESC`
      )

      const txs = txRes.data.tx_responses ?? []

      if (txs.length > 0) {
        txList = txs.map((tx, i) => {
          const shortHash = `${tx.txhash.slice(0, 8)}...${tx.txhash.slice(-6)}`
          const status = tx.code === 0 ? '✅' : '❌'
          return `${i + 1}. ${status} \`${shortHash}\`\n   Block: ${tx.height}`
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
      `💰 INJ Balance: *${balance} INJ*\n\n` +
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