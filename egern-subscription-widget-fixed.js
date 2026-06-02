/**
 * Claude Style Subscription Widget
 * Equal Grid Edition
 *
 * 核心规则
 * - 所有卡片竖向间距 = 横向间距
 * - 同一个显示面里的卡片高度一致
 * - 3 个：上方双卡 + 下方全宽卡，第三个只变宽，不变高
 * - 4 个：稳定 2x2 等高网格
 * - 5 个：2x2 + 底部全宽卡，全部等高
 * - 错误状态也保持同样结构和高度
 */

export default async function (ctx) {
  const MAX = 10;
  const slots = [];

  for (let i = 1; i <= MAX; i++) {
    const url = (ctx.env[`URL${i}`] || "").trim();
    if (!url) continue;

    const rawReset = (ctx.env[`RESET${i}`] || "").trim();
    let resetDay = null;

    if (/^\d+$/.test(rawReset)) {
      const num = Number(rawReset);
      if (num >= 1 && num <= 31) {
        resetDay = num;
      }
    }

    slots.push({
      name: (ctx.env[`NAME${i}`] || "").trim() || `Subscription ${i}`,
      url,
      resetDay,
    });
  }

  const refreshTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const now = new Date();

  const timeStr =
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}`;

  const colors = {
    bg: {
      light: "#F7F4EF",
      dark: "#23211F",
    },
    card: {
      light: "#EEE7DD",
      dark: "#2C2A28",
    },
    primary: {
      light: "#262522",
      dark: "#ECE4DA",
    },
    secondary: {
      light: "#706B64",
      dark: "#8B857F",
    },
    tertiary: {
      light: "#9A948B",
      dark: "#67635E",
    },
    accent: {
      light: "#D97757",
      dark: "#D97757",
    },
    track: {
      light: "#D8CEC4",
      dark: "#383532",
    },
  };

  if (!slots.length) {
    return {
      type: "widget",
      backgroundColor: colors.bg,
      padding: 18,
      children: [
        {
          type: "stack",
          direction: "column",
          alignItems: "center",
          gap: 6,
          children: [
            {
              type: "text",
              text: "No Subscription",
              font: {
                size: 13,
                weight: "medium",
              },
              textColor: colors.primary,
            },
            {
              type: "text",
              text: "Configure URL1",
              font: {
                size: 10,
                weight: "regular",
              },
              textColor: colors.secondary,
            },
          ],
        },
      ],
    };
  }

  const results = await Promise.all(slots.map((s) => fetchInfo(ctx, s)));

  const family = ctx.widgetFamily;

  let maxDisplay = 1;
  if (family === "systemMedium") maxDisplay = 4;
  if (family === "systemLarge") maxDisplay = 10;

  const displayResults = results.slice(0, maxDisplay);

  const dense = family === "systemLarge" && displayResults.length > 5;
  const medium = family === "systemMedium";

  return {
    type: "widget",
    backgroundColor: colors.bg,
    padding:
      family === "systemSmall"
        ? 12
        : medium
        ? 14
        : dense
        ? 14
        : 16,
    refreshAfter: refreshTime,
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "stack",
            direction: "row",
            alignItems: "center",
            gap: 5,
            children: [
              {
                type: "text",
                text: "✺",
                font: {
                  size: dense ? 9 : 10,
                  weight: "medium",
                },
                textColor: colors.accent,
              },
              {
                type: "text",
                text: "Subscriptions",
                font: {
                  size: dense ? 12 : 13,
                  weight: "medium",
                },
                textColor: colors.primary,
              },
            ],
          },
          { type: "spacer" },
          {
            type: "text",
            text: timeStr,
            font: {
              size: dense ? 9 : 10,
              weight: "regular",
            },
            textColor: colors.tertiary,
          },
        ],
      },

      {
        type: "stack",
        height:
          family === "systemSmall"
            ? 6
            : medium
            ? 8
            : dense
            ? 8
            : 10,
      },

      buildAdaptiveLayout(displayResults, colors, family),
    ],
  };
}

/**
 * Adaptive Layout
 */

function buildAdaptiveLayout(results, colors, family) {
  const count = results.length;

  const MEDIUM_GAP = 8;
  const GAP = 10;

  if (family === "systemSmall") {
    return buildCenteredCard(results[0], colors, "small");
  }

  /**
   * Medium
   */

  if (family === "systemMedium") {
    if (count === 1) {
      return buildCenteredCard(results[0], colors, "mediumHero");
    }

    if (count === 2) {
      return buildSingleColumnLayout(results, colors, "mediumWide", MEDIUM_GAP);
    }

    return buildGridLayout(results, colors, "mediumCompact", MEDIUM_GAP);
  }

  /**
   * Large
   */

  if (count === 1) {
    return buildCenteredCard(results[0], colors, "hero");
  }

  if (count === 2) {
    return buildSingleColumnLayout(results, colors, "roomy", GAP);
  }

  if (count <= 5) {
    return buildGridLayout(results, colors, "compact", GAP);
  }

  return buildGridLayout(results, colors, "dense", GAP);
}

function buildCenteredCard(result, colors, mode) {
  return {
    type: "stack",
    direction: "column",
    flex: 1,
    children: [
      { type: "spacer" },
      buildCard(result, colors, mode),
      { type: "spacer" },
    ],
  };
}

function buildSingleColumnLayout(results, colors, mode, gap) {
  return {
    type: "stack",
    direction: "column",
    flex: 1,
    gap,
    children: results.map((r) => buildCard(r, colors, mode, true)),
  };
}

function buildGridLayout(results, colors, mode, gap) {
  const rows = [];

  for (let i = 0; i < results.length; i += 2) {
    const first = buildCard(results[i], colors, mode, true);
    const second = results[i + 1]
      ? buildCard(results[i + 1], colors, mode, true)
      : null;

    rows.push(buildTwoColumnRow([first, second], gap));
  }

  return {
    type: "stack",
    direction: "column",
    flex: 1,
    gap,
    children: rows,
  };
}

function buildTwoColumnRow(cards, gap) {
  const visibleCards = cards.filter(Boolean);

  return {
    type: "stack",
    direction: "row",
    flex: 1,
    gap: visibleCards.length > 1 ? gap : 0,
    children: visibleCards.map((card) => ({
      type: "stack",
      direction: "column",
      flex: 1,
      children: [card],
    })),
  };
}

/**
 * Card
 */

function buildCard(result, colors, mode = "balanced", fill = false) {
  const {
    name,
    error,
    used,
    totalBytes,
    percent,
    expire,
    remainDays,
  } = result;

  const config = getCardConfig(mode);

  const progress = error ? 0 : Math.min(Math.max(percent || 0, 0), 100);

  const usedStr = error ? "—" : formatBytes(used);
  const totalStr = error ? "—" : formatBytes(totalBytes);

  const remainBytes =
    !error && totalBytes > 0 ? Math.max(totalBytes - used, 0) : null;

  const remainStr = remainBytes != null ? formatBytes(remainBytes) : "未知";

  const statusText = error
    ? "稍后重试"
    : buildStatusText(remainDays, expire, config);

  const card = {
    type: "stack",
    direction: "column",
    gap: config.innerGap,
    padding: config.padding,
    backgroundColor: colors.card,
    borderRadius: config.radius,
    children: [
      buildCardHeader(name, progress, error, config, colors),
      buildProgressBar(progress, error, config, colors),
      fill ? { type: "spacer" } : null,
      error
        ? buildErrorFooterRow(config, colors)
        : buildFooterRow(
            config,
            colors,
            usedStr,
            totalStr,
            statusText,
            remainStr
          ),
    ].filter(Boolean),
  };

  if (fill) {
    card.flex = 1;
  } else if (config.height) {
    card.height = config.height;
  }

  return card;
}

function getCardConfig(mode) {
  const configs = {
    /**
     * Medium
     */

    mediumHero: {
      padding: [13, 14],
      innerGap: 7,
      title: 12,
      percent: 10,
      footer: 9,
      progress: 5,
      radius: 13,
      footerMode: "three",
      shortStatus: false,
      height: 64,
      precision: 0,
    },

    mediumWide: {
      padding: [6, 12],
      innerGap: 3,
      title: 10,
      percent: 8,
      footer: 8,
      progress: 4,
      radius: 12,
      footerMode: "three",
      shortStatus: false,
      height: 46,
      precision: 0,
    },

    mediumCompact: {
      padding: [6, 9],
      innerGap: 3,
      title: 9,
      percent: 8,
      footer: 7,
      progress: 3,
      radius: 10,
      footerMode: "two",
      shortStatus: true,
      height: 43,
      precision: 0,
    },

    /**
     * Large / General
     */

    hero: {
      padding: [15, 16],
      innerGap: 8,
      title: 13,
      percent: 11,
      footer: 10,
      progress: 5,
      radius: 14,
      footerMode: "three",
      shortStatus: false,
      height: 72,
      precision: 0,
    },

    roomy: {
      padding: [11, 14],
      innerGap: 6,
      title: 12,
      percent: 10,
      footer: 9,
      progress: 5,
      radius: 13,
      footerMode: "three",
      shortStatus: false,
      height: 68,
      precision: 0,
    },

    balanced: {
      padding: [9, 11],
      innerGap: 5,
      title: 10,
      percent: 8,
      footer: 8,
      progress: 4,
      radius: 11,
      footerMode: "two",
      shortStatus: true,
      height: 52,
      precision: 0,
    },

    compact: {
      padding: [8, 10],
      innerGap: 5,
      title: 10,
      percent: 8,
      footer: 8,
      progress: 4,
      radius: 11,
      footerMode: "two",
      shortStatus: true,
      height: 52,
      precision: 0,
    },

    dense: {
      padding: [8, 9],
      innerGap: 5,
      title: 9,
      percent: 8,
      footer: 7,
      progress: 3,
      radius: 10,
      footerMode: "two",
      shortStatus: true,
      height: 45,
      precision: 1,
    },

    small: {
      padding: [10, 11],
      innerGap: 6,
      title: 11,
      percent: 10,
      footer: 8,
      progress: 5,
      radius: 12,
      footerMode: "three",
      shortStatus: false,
      height: null,
      precision: 0,
    },
  };

  return configs[mode] || configs.balanced;
}

function buildCardHeader(name, progress, error, config, colors) {
  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          {
            type: "text",
            text: "✺",
            font: {
              size: Math.max(config.title - 3, 6),
              weight: "medium",
            },
            textColor: colors.accent,
          },
          {
            type: "text",
            text: name,
            maxLines: 1,
            font: {
              size: config.title,
              weight: "medium",
            },
            textColor: colors.primary,
          },
        ],
      },
      { type: "spacer" },
      {
        type: "text",
        text: error ? "—" : `${progress.toFixed(config.precision)}%`,
        maxLines: 1,
        font: {
          size: config.percent,
          weight: "medium",
        },
        textColor: error ? colors.secondary : colors.primary,
      },
    ],
  };
}

function buildProgressBar(progress, error, config, colors) {
  if (error) {
    return {
      type: "stack",
      direction: "row",
      height: config.progress,
      borderRadius: 99,
      backgroundColor: colors.track,
    };
  }

  return {
    type: "stack",
    direction: "row",
    height: config.progress,
    borderRadius: 99,
    children: [
      {
        type: "stack",
        flex: Math.max(progress, 1),
        height: config.progress,
        borderRadius: 99,
        backgroundColor: colors.accent,
      },
      {
        type: "stack",
        flex: Math.max(100 - progress, 1),
        height: config.progress,
        borderRadius: 99,
        backgroundColor: colors.track,
      },
    ],
  };
}

function buildStatusText(remainDays, expire, config) {
  if (remainDays != null) {
    return config.shortStatus ? `${remainDays}天` : `重置 ${remainDays}天`;
  }

  const expireText = formatExpire(expire);

  return config.shortStatus ? expireText : `到期 ${expireText}`;
}

/**
 * Footer
 */

function buildFooterRow(config, colors, usedStr, totalStr, statusText, remainStr) {
  if (config.footerMode === "two") {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      children: [
        {
          type: "text",
          text: `${usedStr}/${totalStr}`,
          maxLines: 1,
          font: {
            size: config.footer,
            weight: "regular",
          },
          textColor: colors.primary,
        },
        { type: "spacer" },
        {
          type: "text",
          text: statusText,
          maxLines: 1,
          font: {
            size: config.footer,
            weight: "regular",
          },
          textColor: colors.secondary,
        },
      ],
    };
  }

  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "text",
        text: `${usedStr}/${totalStr}`,
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "regular",
        },
        textColor: colors.primary,
      },
      { type: "spacer" },
      {
        type: "text",
        text: statusText,
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "regular",
        },
        textColor: colors.secondary,
      },
      { type: "spacer" },
      {
        type: "text",
        text: `剩${remainStr}`,
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "medium",
        },
        textColor: colors.accent,
      },
    ],
  };
}

function buildErrorFooterRow(config, colors) {
  if (config.footerMode === "two") {
    return {
      type: "stack",
      direction: "row",
      alignItems: "center",
      children: [
        {
          type: "text",
          text: "Unable",
          maxLines: 1,
          font: {
            size: config.footer,
            weight: "regular",
          },
          textColor: colors.secondary,
        },
        { type: "spacer" },
        {
          type: "text",
          text: "稍后重试",
          maxLines: 1,
          font: {
            size: config.footer,
            weight: "regular",
          },
          textColor: colors.tertiary,
        },
      ],
    };
  }

  return {
    type: "stack",
    direction: "row",
    alignItems: "center",
    children: [
      {
        type: "text",
        text: "Unable to fetch",
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "regular",
        },
        textColor: colors.secondary,
      },
      { type: "spacer" },
      {
        type: "text",
        text: "—",
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "regular",
        },
        textColor: colors.tertiary,
      },
      { type: "spacer" },
      {
        type: "text",
        text: "稍后重试",
        maxLines: 1,
        font: {
          size: config.footer,
          weight: "regular",
        },
        textColor: colors.tertiary,
      },
    ],
  };
}

/**
 * Cache
 */

const CACHE_TIME = 60 * 60 * 1000;

/**
 * Fetch
 */

async function fetchInfo(ctx, slot) {
  const cacheKey = `sub_cache_${slot.url}`;

  let cache = await ctx.storage.get(cacheKey);
  let cacheData = null;

  if (cache) {
    try {
      const parsed = JSON.parse(cache);

      if (Date.now() - parsed.time < CACHE_TIME) {
        return {
          ...parsed.data,
          name: slot.name,
          remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
        };
      }

      cacheData = parsed.data;
    } catch {}
  }

  const urls = buildVariants(slot.url);

  for (const method of ["head", "get"]) {
    for (const url of urls) {
      for (const headers of UA_LIST) {
        try {
          const resp = await ctx.http[method](url, { headers });

          const raw = resp.headers.get("subscription-userinfo") || "";

          const info = parseUserInfo(raw);

          if (info) {
            const used = (info.upload || 0) + (info.download || 0);
            const totalBytes = info.total || 0;
            const percent = totalBytes > 0 ? (used / totalBytes) * 100 : 0;

            const result = {
              error: null,
              used,
              totalBytes,
              percent,
              expire: info.expire || null,
              remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
            };

            await ctx.storage.set(
              cacheKey,
              JSON.stringify({
                time: Date.now(),
                data: result,
              })
            );

            return {
              ...result,
              name: slot.name,
            };
          }
        } catch (_) {}
      }
    }
  }

  if (cacheData) {
    return {
      ...cacheData,
      name: slot.name,
      remainDays: slot.resetDay ? getRemainingDays(slot.resetDay) : null,
    };
  }

  return {
    name: slot.name,
    error: true,
  };
}

const UA_LIST = [
  {
    "User-Agent": "Quantumult%20X/1.5.2",
  },
  {
    "User-Agent": "clash-verge-rev/2.3.1",
    Accept: "application/x-yaml,text/plain,*/*",
  },
  {
    "User-Agent": "mihomo/1.19.3",
    Accept: "application/x-yaml,text/plain,*/*",
  },
];

/**
 * Utils
 */

function buildVariants(url) {
  const seen = new Set();
  const out = [];

  const add = (u) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  };

  add(url);
  add(withParam(url, "flag", "clash"));
  add(withParam(url, "flag", "meta"));

  return out;
}

function withParam(url, key, value) {
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(
    value
  )}`;
}

function parseUserInfo(header) {
  if (!header) return null;

  const pairs = header.match(/\w+=[\d.eE+-]+/g) || [];
  if (!pairs.length) return null;

  return Object.fromEntries(
    pairs.map((p) => {
      const [k, v] = p.split("=");
      return [k, Number(v)];
    })
  );
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0.00 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / Math.pow(1024, i);

  if (i >= 2) {
    return `${value.toFixed(2)} ${units[i]}`;
  }

  if (i === 1) {
    return `${value.toFixed(1)} ${units[i]}`;
  }

  return `${value.toFixed(0)} ${units[i]}`;
}

function formatExpire(expire) {
  if (!expire) {
    return "未知";
  }

  let ts = Number(expire);

  if (ts < 1e12) {
    ts *= 1000;
  }

  const diff = Math.ceil((ts - Date.now()) / 86400000);

  if (diff <= 0) {
    return "已过期";
  }

  return `${diff}天`;
}

function getRemainingDays(resetDay) {
  const now = new Date();

  const maxDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const safeDay = Math.min(resetDay, maxDay);

  let next = new Date(now.getFullYear(), now.getMonth(), safeDay);

  if (now.getDate() >= safeDay) {
    const nextMonthMax = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      0
    ).getDate();

    const nextSafeDay = Math.min(resetDay, nextMonthMax);

    next = new Date(now.getFullYear(), now.getMonth() + 1, nextSafeDay);
  }

  return Math.max(0, Math.ceil((next - now) / 86400000));
}