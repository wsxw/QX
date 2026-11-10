/**
 * Mihomo (Clash.Meta) 全局复写脚本 (Override Script)
 * 适用客户端：Clash Verge Rev / Mihomo Party / FlClash / Clash Mi / Stash (Mihomo 内核) 等
 * 功能说明：
 *   1. 保留机场订阅原有的节点（自动过滤“剩余流量/到期时间/官网”等垃圾信息节点）
 *   2. 注入自定义直连节点与自建洛杉矶 VLESS 节点
 *   3. 全面覆盖 DNS（Fake-IP + 国内外分流防污染 + Apple AI 专属解析）、Hosts（屏蔽 B 站 PCDN）
 *   4. 全面覆盖精简策略组（含自建置顶、美国故障转移、Apple AI / AI / Google / TG / TikTok 等）
 *   5. 全面覆盖 Rule Providers 规则集与分流路由规则（含 Apple Intelligence / Siri 专项代理）
 */

// ==================== 1. 自定义节点配置 ====================

// 自建节点名称（修改此处会自动同步到所有策略组与故障转移组）
const SELF_NODE_NAME = "自建1 | 洛杉矶";

// 是否启用自建节点（如暂时不填写真实参数，可设为 false，脚本会自动从策略组中移除该节点防止报错）
const ENABLE_SELF_NODE = true;

// 自建节点详细配置（请替换 server、port、uuid、public-key 等为你自己的真实参数）
const SELF_NODE = {
  name: SELF_NODE_NAME,
  type: "vless",
  server: "xxxxx",
  port: 443, // 注意：端口必须是数字类型
  uuid: "xxxxx",
  network: "tcp",
  udp: true,
  tls: true,
  flow: "xtls-rprx-vision",
  servername: "www.amazon.com",
  "client-fingerprint": "chrome",
  "reality-opts": {
    "public-key": "xxxxx",
    "short-id": "",
  },
};

// 直连细分节点
const DIRECT_PROXIES = [
  { name: "🇨🇳 直连 | 双栈", type: "direct" },
  { name: "🇨🇳 直连 | IPv4优先", type: "direct", "ip-version": "ipv4-prefer" },
  { name: "🇨🇳 直连 | IPv6优先", type: "direct", "ip-version": "ipv6-prefer" },
  { name: "🇨🇳 直连 | 仅IPv4", type: "direct", "ip-version": "ipv4" },
  { name: "🇨🇳 直连 | 仅IPv6", type: "direct", "ip-version": "ipv6" },
];

// ==================== 2. 过滤器正则定义 ====================

// 全局无效节点过滤（剔除机场流量提示、到期时间、官网、群组等说明性节点）
const GLOBAL_EXCLUDE_FILTER =
  "(?i)(群|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|电报|频道|无法|说明|提示|访问|支持|教程|关注|更新|作者|加入|超时|收藏|优惠|福利|邀请|好友|失联|选择|剩余|公益|发布|DIZTNA|通路|登录|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|建议|重置|以下|⚠️|@|t\\.me\\/\\+|\\bexpire\\b|\\bhttps?:\\/\\/|\\.com|\\btraffic\\b)";

const REGION_FILTERS = {
  HK: "(?i)(🇭🇰|香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\\s*kong)",
  JP: "(?i)(🇯🇵|日本|东京|大阪|京都|(?<![A-Za-z])JPN?(?![A-Za-z])|japan)",
  US: "(?i)(🇺🇸|美国|纽约|洛杉矶|旧金山|芝加哥|休斯顿|迈阿密|西雅图|波士顿|华盛顿|拉斯维加斯|圣何塞|圣地亚哥|(?<![A-Za-z])USA?(?![A-Za-z])|america|united\\s*states)",
  SG: "(?i)(🇸🇬|新加坡|狮城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore)",
  TW: "(?i)(🇹🇼|台湾|台北|高雄|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan)",
};

// ==================== 3. 主入口函数 ====================

function main(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  // --- 3.1 基础全局配置覆盖 ---
  Object.assign(config, {
    "mixed-port": config["mixed-port"] || 7890,
    "allow-lan": true,
    ipv6: true,
    mode: "rule",
    "log-level": "info",
    "bind-address": "*",
    "unified-delay": true,
    "tcp-concurrent": true,
    "keep-alive-interval": 60,
    "find-process-mode": "strict",
    profile: {
      "store-selected": true,
      "store-fake-ip": true,
    },
    ntp: {
      enable: true,
      "write-to-system": false,
      server: "ntp.aliyun.com",
      port: 123,
      interval: 60,
    },
    tun: {
      enable: true,
      stack: "system",
      "auto-route": true,
      "strict-route": true,
      "auto-redirect": true,
      "auto-detect-interface": true,
      "dns-hijack": ["any:53", "tcp://any:53"],
    },
  });

  // --- 3.2 Hosts 覆盖 ---
  config.hosts = {
    ...(config.hosts || {}),
    "cloudflare-dns.com": ["1.1.1.1", "1.0.0.1"],
    "dns.google": ["8.8.8.8", "8.8.4.4"],
    // 解决谷歌商店无法下载的问题
    "services.googleapis.cn": ["services.googleapis.com"],
    // 屏蔽哔哩哔哩 PCDN，解决访问视频卡顿/直播问题
    "+.mcdn.bilivideo.com": ["0.0.0.0"],
    "+.mcdn.bilivideo.cn": ["0.0.0.0"],
    "+.edge.mountaintoys.cn": ["0.0.0.0"],
    "+.h2.smtcdns.net": ["0.0.0.0"],
  };

  // --- 3.3 DNS 配置覆盖 ---
  const chinaDNS = ["223.5.5.5", "119.29.29.29"];
  const chinaDohDNS = [
    "https://223.5.5.5/dns-query#DIRECT",
    "https://1.12.12.12/dns-query#DIRECT",
  ];
  const foreignDNS = [
    "https://cloudflare-dns.com/dns-query#默认代理",
    "https://dns.google/dns-query#默认代理",
  ];

  config.dns = {
    enable: true,
    ipv6: true,
    "use-hosts": true,
    "cache-algorithm": "arc",
    "use-system-hosts": true,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/15",
    "fake-ip-range6": "2001:2::1/48",
    "fake-ip-filter": [
      "rule-set:private",
      "rule-set:fakeip_filter",
      "rule-set:geolocation-cn",
    ],
    "proxy-server-nameserver": chinaDohDNS,
    "default-nameserver": chinaDNS,
    nameserver: foreignDNS,
    "nameserver-policy": {
      "+.gateway.icloud.com,+.apple-relay.apple.com,+.apple-relay.fastly-edge.com,+.apple-relay.cloudflare.com,+.guzzoni.apple.com,+.cp4.cloudflare.com,+.gspe1-ssl.ls.apple.com,+.smoot.apple.com,+.apple-relay.akamaized.net,+.apple-relay.mask.apple-dns.net,+.api-siri-prod.apple.com":
        foreignDNS,
      "rule-set:private,cn,cn_additional,geolocation-cn": chinaDNS,
    },
    "direct-nameserver": ["system", "223.5.5.5", "119.29.29.29"],
  };

  // --- 3.4 节点与订阅提供者处理 ---
  // 转换全局过滤正则用于 JS 层直接清洗机场 proxies 列表
  const jsExcludeRegex = new RegExp(
    GLOBAL_EXCLUDE_FILTER.replace(/^\(\?i\)/, ""),
    "i"
  );

  const rawProxies = Array.isArray(config.proxies) ? config.proxies : [];
  const filteredAirportProxies = rawProxies.filter((p) => {
    if (!p || !p.name) return false;
    const type = String(p.type || "").toLowerCase();
    if (["direct", "reject", "rematch"].includes(type)) return false;
    if (jsExcludeRegex.test(p.name)) return false;
    return true;
  });

  // 合并直连节点、自建节点与清洗后的机场节点
  const injectedProxies = [...DIRECT_PROXIES];
  if (ENABLE_SELF_NODE && SELF_NODE && SELF_NODE.name) {
    injectedProxies.push(SELF_NODE);
  }
  config.proxies = [...injectedProxies, ...filteredAirportProxies];

  // 如果订阅中包含 proxy-providers，为其统一注入健康检查与垃圾节点过滤
  if (
    config["proxy-providers"] &&
    typeof config["proxy-providers"] === "object"
  ) {
    for (const key of Object.keys(config["proxy-providers"])) {
      const provider = config["proxy-providers"][key];
      if (provider && typeof provider === "object") {
        provider["exclude-type"] =
          provider["exclude-type"] || "direct|reject|rematch";
        provider["exclude-filter"] =
          provider["exclude-filter"] || GLOBAL_EXCLUDE_FILTER;
        provider["health-check"] = provider["health-check"] || {
          enable: true,
          url: "https://g.cn/generate_204",
          interval: 600,
          lazy: true,
        };
      }
    }
  }

  // --- 3.5 策略组 (Proxy Groups) 覆盖 ---
  const selectCommon = {
    type: "select",
    interval: 600,
    timeout: 3000,
    "max-failed-times": 3,
    "empty-fallback": "REJECT",
    url: "https://g.cn/generate_204",
    lazy: true,
  };

  const autoCommon = {
    type: "url-test",
    interval: 600,
    timeout: 3000,
    "max-failed-times": 3,
    "empty-fallback": "REJECT",
    url: "https://g.cn/generate_204",
    lazy: true,
    tolerance: 50,
    "include-all": true,
    "exclude-type": "DIRECT",
    "exclude-filter": GLOBAL_EXCLUDE_FILTER,
    icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",
    hidden: true,
  };

  const loadBalanceCommon = {
    type: "load-balance",
    interval: 600,
    timeout: 3000,
    "max-failed-times": 3,
    "empty-fallback": "REJECT",
    url: "https://g.cn/generate_204",
    lazy: true,
    strategy: "sticky-sessions",
    "include-all": true,
    "exclude-type": "DIRECT",
    "exclude-filter": GLOBAL_EXCLUDE_FILTER,
    icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Round_Robin.png",
    hidden: true,
  };

  const selfNodeList = ENABLE_SELF_NODE ? [SELF_NODE_NAME] : [];

  const proxiesDefault = [
    "默认代理",
    ...selfNodeList,
    "美国",
    "香港",
    "日本",
    "新加坡",
    "台湾省",
    "手动选择",
    "自动选择",
    "负载均衡",
  ];

  const proxiesDirect = [
    "默认代理",
    "直连",
    ...selfNodeList,
    "美国",
    "香港",
    "日本",
    "新加坡",
    "台湾省",
    "手动选择",
    "自动选择",
    "负载均衡",
  ];

  const usGroupProxies = ENABLE_SELF_NODE
    ? ["美国-故障转移", "美国-自动选择"]
    : ["美国-自动选择"];

  const usFallbackGroup = ENABLE_SELF_NODE
    ? [
        {
          name: "美国-故障转移",
          type: "fallback",
          url: "https://g.cn/generate_204",
          interval: 180,
          timeout: 3000,
          lazy: false,
          proxies: [SELF_NODE_NAME, "美国-自动选择"],
          icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png",
          hidden: true,
        },
      ]
    : [];

  config["proxy-groups"] = [
    {
      ...selectCommon,
      name: "默认代理",
      proxies: [
        ...selfNodeList,
        "美国",
        "香港",
        "日本",
        "新加坡",
        "台湾省",
        "手动选择",
        "自动选择",
        "负载均衡",
      ],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png",
    },
    {
      ...selectCommon,
      name: "手动选择",
      "include-all": true,
      "exclude-type": "DIRECT",
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png",
    },
    {
      ...autoCommon,
      name: "自动选择",
    },
    {
      ...loadBalanceCommon,
      name: "负载均衡",
    },
    {
      ...selectCommon,
      name: "Apple AI",
      proxies: proxiesDefault,
      "default-selected": "美国",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png",
    },
    {
      ...selectCommon,
      name: "AI",
      proxies: proxiesDefault,
      "default-selected": "美国",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png",
    },
    {
      ...selectCommon,
      name: "Google",
      proxies: proxiesDefault,
      "default-selected": "美国",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png",
    },
    {
      ...selectCommon,
      name: "Telegram",
      proxies: proxiesDefault,
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png",
    },
    {
      ...selectCommon,
      name: "TikTok",
      proxies: proxiesDefault,
      "default-selected": "美国",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png",
    },
    {
      ...selectCommon,
      name: "Apple",
      proxies: proxiesDirect,
      "default-selected": "直连",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png",
    },
    {
      ...selectCommon,
      name: "Microsoft",
      proxies: proxiesDirect,
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png",
    },
    {
      ...selectCommon,
      name: "AdBlock",
      proxies: ["REJECT", "REJECT-DROP", "PASS"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png",
    },
    {
      ...selectCommon,
      name: "漏网之鱼",
      proxies: ["默认代理", "直连"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Stack.png",
    },
    {
      ...selectCommon,
      name: "直连",
      proxies: DIRECT_PROXIES.map((p) => p.name),
      url: "https://connectivitycheck.platform.hicloud.com/generate_204",
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/China_Map.png",
    },

    // --- 地区策略组 ---
    {
      ...selectCommon,
      name: "香港",
      filter: REGION_FILTERS.HK,
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      "include-all": true,
      proxies: ["香港-自动选择"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png",
    },
    {
      ...autoCommon,
      name: "香港-自动选择",
      filter: REGION_FILTERS.HK,
    },
    {
      ...selectCommon,
      name: "日本",
      filter: REGION_FILTERS.JP,
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      "include-all": true,
      proxies: ["日本-自动选择"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png",
    },
    {
      ...autoCommon,
      name: "日本-自动选择",
      filter: REGION_FILTERS.JP,
    },
    {
      ...selectCommon,
      name: "美国",
      filter: REGION_FILTERS.US,
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      "default-selected": ENABLE_SELF_NODE ? "美国-故障转移" : "美国-自动选择",
      "include-all": true,
      proxies: usGroupProxies,
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png",
    },
    ...usFallbackGroup,
    {
      ...autoCommon,
      name: "美国-自动选择",
      filter: REGION_FILTERS.US,
      "exclude-filter": "自建",
    },
    {
      ...selectCommon,
      name: "新加坡",
      filter: REGION_FILTERS.SG,
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      "include-all": true,
      proxies: ["新加坡-自动选择"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png",
    },
    {
      ...autoCommon,
      name: "新加坡-自动选择",
      filter: REGION_FILTERS.SG,
    },
    {
      ...selectCommon,
      name: "台湾省",
      filter: REGION_FILTERS.TW,
      "exclude-filter": GLOBAL_EXCLUDE_FILTER,
      "include-all": true,
      proxies: ["台湾省-自动选择"],
      icon: "https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png",
    },
    {
      ...autoCommon,
      name: "台湾省-自动选择",
      filter: REGION_FILTERS.TW,
    },
  ];

  // --- 3.6 规则集 (Rule Providers) 覆盖 ---
  const domainProviderCommon = {
    type: "http",
    format: "mrs",
    interval: 86400,
    behavior: "domain",
  };

  const ipProviderCommon = {
    type: "http",
    format: "mrs",
    interval: 86400,
    behavior: "ipcidr",
  };

  config["rule-providers"] = {
    // 直连规则集
    private: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/private.mrs",
      path: "./ruleset/private.mrs",
      "path-in-bundle": "geo/geosite/private.mrs",
    },
    private_ip: {
      ...ipProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/private.mrs",
      path: "./ruleset/private_ip.mrs",
      "path-in-bundle": "geo/geoip/private.mrs",
    },
    games_cn: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-games@cn.mrs",
      path: "./ruleset/category-games@cn.mrs",
      "path-in-bundle": "geo/geosite/category-games@cn.mrs",
    },
    epicgames: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/epicgames.mrs",
      path: "./ruleset/epicgames.mrs",
      "path-in-bundle": "geo/geosite/epicgames.mrs",
    },
    nvidia_cn: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/nvidia@cn.mrs",
      path: "./ruleset/nvidia@cn.mrs",
      "path-in-bundle": "geo/geosite/nvidia@cn.mrs",
    },
    apple_cn: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple@cn.mrs",
      path: "./ruleset/apple@cn.mrs",
      "path-in-bundle": "geo/geosite/apple@cn.mrs",
    },
    microsoft_cn: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft@cn.mrs",
      path: "./ruleset/microsoft@cn.mrs",
      "path-in-bundle": "geo/geosite/microsoft@cn.mrs",
    },
    "geolocation-cn": {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/geolocation-cn.mrs",
      path: "./ruleset/geolocation-cn.mrs",
      "path-in-bundle": "geo/geosite/geolocation-cn.mrs",
    },
    cn_ip: {
      ...ipProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/cn.mrs",
      path: "./ruleset/cn_ip.mrs",
      "path-in-bundle": "geo/geoip/cn.mrs",
    },

    // 代理规则集
    youtube: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/youtube.mrs",
      path: "./ruleset/youtube.mrs",
      "path-in-bundle": "geo/geosite/youtube.mrs",
    },
    google: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/google.mrs",
      path: "./ruleset/google.mrs",
      "path-in-bundle": "geo/geosite/google.mrs",
    },
    google_ip: {
      ...ipProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/google.mrs",
      path: "./ruleset/google_ip.mrs",
      "path-in-bundle": "geo/geoip/google.mrs",
    },
    ai: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/category-ai-!cn.mrs",
      path: "./ruleset/ai.mrs",
      "path-in-bundle": "geo/geosite/category-ai-!cn.mrs",
    },
    github: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/github.mrs",
      path: "./ruleset/github.mrs",
      "path-in-bundle": "geo/geosite/github.mrs",
    },
    microsoft: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/microsoft.mrs",
      path: "./ruleset/microsoft.mrs",
      "path-in-bundle": "geo/geosite/microsoft.mrs",
    },
    apple: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/apple.mrs",
      path: "./ruleset/apple.mrs",
      "path-in-bundle": "geo/geosite/apple.mrs",
    },
    telegram: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/telegram.mrs",
      path: "./ruleset/telegram.mrs",
      "path-in-bundle": "geo/geosite/telegram.mrs",
    },
    telegram_ip: {
      ...ipProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geoip/telegram.mrs",
      path: "./ruleset/telegram_ip.mrs",
      "path-in-bundle": "geo/geoip/telegram.mrs",
    },
    tiktok: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/tiktok.mrs",
      path: "./ruleset/tiktok.mrs",
      "path-in-bundle": "geo/geosite/tiktok.mrs",
    },
    gfw: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/gfw.mrs",
      path: "./ruleset/gfw.mrs",
      "path-in-bundle": "geo/geosite/gfw.mrs",
    },

    // 其他规则集
    adblockmihomolite: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomolite.mrs",
      path: "./ruleset/adblockmihomolite.mrs",
      "path-in-bundle": "geo/geosite/category-ads-all.mrs",
    },
    fakeip_filter: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/wwqgtxx/clash-rules@release/fakeip-filter.mrs",
      path: "./ruleset/fakeip-filter.mrs",
      "path-in-bundle": "geo/geosite/private.mrs",
    },
    cn_additional: {
      ...domainProviderCommon,
      url: "https://static-file-global.353355.xyz/rules/cn-additional-list.mrs",
      path: "./ruleset/cn-additional-list.mrs",
      "path-in-bundle": "geo/geosite/cn.mrs",
    },
    cn: {
      ...domainProviderCommon,
      url: "https://fastly.jsdelivr.net/gh/wwqgtxx/clash-rules@release/direct.mrs",
      path: "./ruleset/cn.mrs",
      "path-in-bundle": "geo/geosite/cn.mrs",
    },
  };

  // --- 3.7 路由规则 (Rules) 覆盖 ---
  config.rules = [
    // 私有网络直连
    "RULE-SET,private,直连",
    "RULE-SET,private_ip,直连,no-resolve",

    // Apple Intelligence / Siri / Relay 专项代理（必须置于 apple_cn 之前）
    "DOMAIN-SUFFIX,gateway.icloud.com,Apple AI",
    "DOMAIN-SUFFIX,apple-relay.apple.com,Apple AI",
    "DOMAIN-SUFFIX,apple-relay.fastly-edge.com,Apple AI",
    "DOMAIN-SUFFIX,apple-relay.cloudflare.com,Apple AI",
    "DOMAIN-SUFFIX,guzzoni.apple.com,Apple AI",
    "DOMAIN-SUFFIX,cp4.cloudflare.com,Apple AI",
    "DOMAIN-SUFFIX,gspe1-ssl.ls.apple.com,Apple AI",
    "DOMAIN-SUFFIX,smoot.apple.com,Apple AI",
    "DOMAIN-SUFFIX,apple-relay.akamaized.net,Apple AI",
    "DOMAIN-SUFFIX,apple-relay.mask.apple-dns.net,Apple AI",
    "DOMAIN-SUFFIX,api-siri-prod.apple.com,Apple AI",

    // 国内直连
    "RULE-SET,games_cn,直连",
    "RULE-SET,epicgames,直连",
    "RULE-SET,nvidia_cn,直连",
    "RULE-SET,apple_cn,直连",
    "RULE-SET,microsoft_cn,直连",
    "DOMAIN,fsend.cn,直连",
    "DOMAIN,international-gfe.download.nvidia.com,直连",
    "DOMAIN-SUFFIX,hdslb.com,直连",

    // 禁用国外 QUIC 流量
    "AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn_additional),(RULE-SET,geolocation-cn),(RULE-SET,cn_ip,no-resolve)))))),REJECT",

    // 广告拦截
    "RULE-SET,adblockmihomolite,AdBlock",

    // 代理规则
    "RULE-SET,youtube,Google",
    "RULE-SET,google,Google",
    "RULE-SET,google_ip,Google,no-resolve",
    "RULE-SET,ai,AI",
    "RULE-SET,github,默认代理",
    "RULE-SET,microsoft,Microsoft",
    "RULE-SET,apple,Apple",
    "RULE-SET,telegram,Telegram",
    "RULE-SET,telegram_ip,Telegram,no-resolve",
    "RULE-SET,tiktok,TikTok",

    // 兜底规则
    "RULE-SET,gfw,默认代理",
    "RULE-SET,geolocation-cn,直连",
    "RULE-SET,cn_ip,直连,no-resolve",
    "MATCH,漏网之鱼",
  ];

  return config;
}
