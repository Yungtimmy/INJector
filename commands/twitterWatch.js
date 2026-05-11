// commands/twitterWatch.js
const Parser = require("rss-parser");

const parser        = new Parser();
const TARGET_HANDLE = "INJAfrica";
const TARGET_GROUP  = process.env.TELEGRAM_GROUP_ID;
const POLL_INTERVAL = 2 * 60 * 1000; // every 2 minutes

// Public Nitter instances — rotates if one is down
const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.lunar.icu",
];

let lastTweetLink = null;
let instanceIndex  = 0;

function currentInstance() {
  return NITTER_INSTANCES[instanceIndex % NITTER_INSTANCES.length];
}

function rotateInstance() {
  instanceIndex++;
  console.warn(`🔄 Rotating to Nitter instance: ${currentInstance()}`);
}

async function fetchFeed() {
  const url = `${currentInstance()}/${TARGET_HANDLE}/rss`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (err) {
    rotateInstance();
    // Try next instance immediately
    const fallbackUrl = `${currentInstance()}/${TARGET_HANDLE}/rss`;
    const feed = await parser.parseURL(fallbackUrl);
    return feed.items || [];
  }
}

function extractXLink(nitLink) {
  // Convert nitter URL → x.com URL
  // e.g. https://nitter.poast.org/injafrica/status/123 → https://x.com/injafrica/status/123
  return nitLink.replace(/https?:\/\/[^/]+/, "https://x.com");
}

function startTwitterWatch(bot) {
  if (!TARGET_GROUP) {
    console.warn("⚠️  TELEGRAM_GROUP_ID not set — Twitter watcher disabled.");
    return;
  }

  const poll = async () => {
    try {
      const items = await fetchFeed();
      if (!items.length) return;

      // On first run, just seed the cursor — don't send anything
      if (lastTweetLink === null) {
        lastTweetLink = items[0].link;
        console.log("🐦 Twitter watcher seeded. Watching @" + TARGET_HANDLE);
        return;
      }

      // Find all tweets newer than our cursor
      const newItems = [];
      for (const item of items) {
        if (item.link === lastTweetLink) break;
        newItems.push(item);
      }

      if (!newItems.length) return;

      // Update cursor
      lastTweetLink = newItems[0].link;

      // Send newest-last so they appear in chronological order in group
      for (const item of newItems.reverse()) {
        const xLink = extractXLink(item.link);
        const text =
          `🟦 *@${TARGET_HANDLE}* just posted:\n` +
          `${xLink}`;

        await bot.telegram.sendMessage(TARGET_GROUP, text, {
          parse_mode: "Markdown",
        });
      }
    } catch (err) {
      console.error("Twitter watcher error:", err.message);
    }
  };

  // Seed immediately, then start polling
  poll().then(() => {
    setInterval(poll, POLL_INTERVAL);
  });
}

module.exports = startTwitterWatch;