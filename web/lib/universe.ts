// 硅基文明消费股 — curated default universe.
// Theme: consumer-facing companies whose top/bottom line is being reshaped
// by the AI / silicon-civilization wave (AI hardware end-products, AI-native
// apps, robotics-enabled consumer goods, AI-enhanced appliances/玩具/eyewear).

export interface UniverseEntry {
  symbol: string;          // pyserver-normalized: e.g. "sh600519", "002475", "hk00700"
  name: string;
  theme: string;           // sub-theme tag
  note?: string;
}

export const DEFAULT_UNIVERSE: UniverseEntry[] = [
  // AI 硬件入口 / AI consumer hardware
  { symbol: "002475", name: "立讯精密", theme: "AI硬件代工", note: "AI眼镜/AI PC 组装" },
  { symbol: "002241", name: "歌尔股份", theme: "AI硬件代工", note: "智能眼镜/声学" },
  { symbol: "300433", name: "蓝思科技", theme: "AI硬件代工", note: "AI 终端玻璃" },
  { symbol: "002600", name: "领益智造", theme: "AI硬件代工" },

  // AI 玩具 / 陪伴
  { symbol: "002292", name: "奥飞娱乐", theme: "AI玩具", note: "IP+AI 玩具" },
  { symbol: "603899", name: "晨光股份", theme: "AI文具/玩具" },

  // AI 家电 / 智能家居
  { symbol: "000333", name: "美的集团", theme: "AI家电", note: "具身智能/机器人" },
  { symbol: "000651", name: "格力电器", theme: "AI家电" },
  { symbol: "002032", name: "苏泊尔", theme: "AI厨电" },

  // 机器人消费 / 扫地机
  { symbol: "688169", name: "石头科技", theme: "消费机器人" },
  { symbol: "603486", name: "科沃斯", theme: "消费机器人" },

  // AI 应用 / 内容消费
  { symbol: "300413", name: "芒果超媒", theme: "AI内容" },
  { symbol: "002624", name: "完美世界", theme: "AI游戏" },
  { symbol: "002555", name: "三七互娱", theme: "AI游戏" },

  // 港股 — AI 消费平台
  { symbol: "hk00700", name: "腾讯控股", theme: "AI平台/内容" },
  { symbol: "hk09988", name: "阿里巴巴-W", theme: "AI电商" },
  { symbol: "hk03690", name: "美团-W", theme: "AI本地生活" },
  { symbol: "hk09618", name: "京东集团-SW", theme: "AI电商" },
];
