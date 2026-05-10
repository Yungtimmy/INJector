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

          // Determine sent or received + amount
          const msg = tx.messages?.[0]
          let direction = '➡️ Sent'
          let amount = 'N/A'

          if (msg) {
            const msgType = msg.type ?? ''
            const value = msg.value ?? {}

            if (msgType.includes('MsgSend')) {
              const fromAddress = value.from_address ?? value.fromAddress ?? ''
              direction = fromAddress === address ? '➡️ Sent' : '⬅️ Received'
              const amountArr = value.amount ?? []
              const injAmt = Array.isArray(amountArr)
                ? amountArr.find(a => a.denom === 'inj')
                : amountArr.denom === 'inj' ? amountArr : null
              if (injAmt) {
                amount = `${(parseFloat(injAmt.amount) / 1e18).toFixed(4)} INJ`
              }
            } else if (msgType.includes('MsgDelegate') || msgType.includes('MsgUndelegate')) {
              direction = msgType.includes('MsgDelegate') ? '🥩 Staked' : '🔓 Unstaked'
              const injAmt = value.amount
              if (injAmt && injAmt.denom === 'inj') {
                amount = `${(parseFloat(injAmt.amount) / 1e18).toFixed(4)} INJ`
              }
            } else if (msgType.includes('MsgWithdrawDelegator')) {
              direction = '🎁 Claimed Rewards'
              amount = 'Rewards'
            } else {
              direction = '🔄 Swap/Other'
            }
          }

          const status = tx.code === 0 ? '✅' : '❌'
          return `${i + 1}. ${status} ${direction}\n   Amount: *${amount}*\n   Hash: \`${shortHash}\``
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