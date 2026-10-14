/**
 * 双周日历小组件（Hark 仪表盘版样式）
 * 基于 IBL3ND/CN_Cal.JS 改版
 *
 * 样式：与「油价-Hark」统一（深浅色渐变 + 玻璃拟态 + 金色强调），日期格只显示数字
 * 功能：
 *  • 法定节假日（放假）：日期数字显示红色
 *  • 调休上班日：日期下方小蓝点
 *  • 今日黄历：底部显示农历日期、建除十二神与宜/忌
 *
 * 数据：
 *  • 2026 年节假日依据国务院办公厅《关于2026年部分节假日安排的通知》
 *    （2027 年安排公布后，需在 HOLIDAYS 中追加对应年份）
 *  • 建除十二神按《协纪辨方书》月建起建法推算，宜忌取建除歌诀
 */

// ============ 风格（与油价小组件统一） ============
const C = {
  bgLight: ['#F6F1E8', '#EADFC9'],
  bgDark: ['#2A2A2C', '#17171A'],
  gold: '#FFB340',
  text: { light: '#2B2118', dark: '#F5EFE4' },
  dim: { light: '#8A7B63', dark: '#9A8C78' },
  glass: { light: '#FFFFFFCC', dark: '#3A3A3CCC' },
  glassBorder: { light: '#FFB34055', dark: '#FFB34044' },
  red: { light: '#FF453A', dark: '#FF5A52' },
  blue: { light: '#0A84FF', dark: '#64A8FF' },
};

const now = new Date();
const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();
const isToday = (d) => d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;

function bg() {
  return {
    type: 'stack', direction: 'column', flex: 1,
    padding: [12, 12, 12, 12], borderRadius: 22,
    background: { light: { type: 'linear', colors: C.bgLight }, dark: { type: 'linear', colors: C.bgDark } },
    children: [],
  };
}
const T = (text, size, color, weight = 'regular', extra = {}) =>
  ({ type: 'text', text, font: { size, weight }, color, ...extra });
const row = (children, gap = 4, extra = {}) =>
  ({ type: 'stack', direction: 'row', alignItems: 'center', gap, children, ...extra });
const icon = (name, size = 16, color = C.gold) =>
  ({ type: 'icon', name, size, color });

// ============ 农历（用于黄历日期显示） ============
const lunarInfo = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
];
const lYearDays = (y) => {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
  return sum + leapDays(y);
};
const leapDays = (y) => leapMonth(y) ? ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29) : 0;
const leapMonth = (y) => lunarInfo[y - 1900] & 0xf;
const monthDays = (y, m) => (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
function getLunarDate(date) {
  let offset = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 31)) / 86400000);
  let i, temp = 0;
  for (i = 1900; i < 2100 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; }
  if (offset < 0) { offset += temp; i--; }
  const year = i, leap = leapMonth(i);
  let isLeap = false;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && !isLeap) { i--; isLeap = true; temp = leapDays(year); }
    else temp = monthDays(year, i);
    if (isLeap && i === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) { if (isLeap) isLeap = false; else { isLeap = true; i--; } }
  if (offset < 0) { offset += temp; i--; }
  return { year, month: i, day: offset + 1, isLeap };
}
const LUNAR_DAYS = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const LUNAR_MONTHS = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
function lunarDayStr(date) {
  const l = getLunarDate(date);
  return (l.isLeap ? '闰' : '') + LUNAR_MONTHS[l.month - 1] + LUNAR_DAYS[l.day - 1];
}

// ============ 节气（用于建除月建：立春建寅，顺排十二辰） ============
const SOLAR_TERM_OFFSETS = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function monthBranch(date) {
  // 找到日期之前最近的一个「节」（偶数序号），月建 = 节序号/2 + 1
  const curDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  let best = -1, bestMs = -1;
  for (const yy of [date.getFullYear() - 1, date.getFullYear()]) {
    for (let i = 0; i < 24; i += 2) {
      const ms = Date.UTC(1900, 0, 6, 2, 5, 0) + 365.24219878 * 86400000 * (yy - 1900) + SOLAR_TERM_OFFSETS[i] * 60000;
      const t = new Date(ms);
      const termDay = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
      if (termDay <= curDay && ms > bestMs) { bestMs = ms; best = i; }
    }
  }
  return ((best / 2) + 1) % 12;
}

// ============ 干支 + 建除十二神 ============
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
function ganzhi(date) {
  // 1900-01-31 为甲辰日
  const offset = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 31)) / 86400000);
  const stem = (((0 + offset) % 10) + 10) % 10;
  const branch = (((4 + offset) % 12) + 12) % 12;
  return { str: STEMS[stem] + BRANCHES[branch], branch };
}
const GODS = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const GOD_GOOD = new Set([1, 4, 5, 7, 8, 10]); // 除、定、执、危、成、开为黄道吉
const GOD_YIJI = [
  { yi: '出行', ji: '开仓' }, // 建
  { yi: '疗病', ji: '' },     // 除
  { yi: '修仓', ji: '嫁娶' }, // 满
  { yi: '平治', ji: '' },     // 平
  { yi: '安床', ji: '' },     // 定
  { yi: '捕捉', ji: '' },     // 执
  { yi: '疗病', ji: '' },     // 破
  { yi: '祈福', ji: '' },     // 危
  { yi: '嫁娶', ji: '' },     // 成
  { yi: '纳财', ji: '' },     // 收
  { yi: '祈福', ji: '' },     // 开
  { yi: '竖造', ji: '' },     // 闭
];
function jianchu(date) {
  const g = ganzhi(date);
  const mb = monthBranch(date);
  const god = (((g.branch - mb) % 12) + 12) % 12;
  return { god, good: GOD_GOOD.has(god) };
}

// ============ 法定节假日 / 调休 ============
const HOLIDAYS = {
  // 2026 年依据国务院办公厅《关于2026年部分节假日安排的通知》
  2026: {
    off: [
      '1-1~1-3',    // 元旦
      '2-15~2-23',  // 春节
      '4-4~4-6',    // 清明
      '5-1~5-5',    // 劳动节
      '6-19~6-21',  // 端午
      '9-25~9-27',  // 中秋
      '10-1~10-7',  // 国庆
    ],
    work: [
      '1-4',           // 元旦调休上班
      '2-14', '2-28',  // 春节调休上班
      '5-9',           // 劳动节调休上班
      '9-20', '10-10', // 国庆调休上班
    ],
  },
};
function buildHolidaySets() {
  const off = new Set(), work = new Set();
  for (const [year, data] of Object.entries(HOLIDAYS)) {
    for (const r of data.off) {
      if (r.includes('~')) {
        const [a, b] = r.split('~');
        const [m1, d1] = a.split('-').map(Number);
        const [m2, d2] = b.split('-').map(Number);
        const start = new Date(Number(year), m1 - 1, d1);
        const end = new Date(Number(year), m2 - 1, d2);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          off.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
        }
      } else {
        off.add(`${year}-${r}`);
      }
    }
    for (const r of data.work) work.add(`${year}-${r}`);
  }
  return { off, work };
}
const HOLIDAY_SETS = buildHolidaySets();
function dayType(d) {
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  if (HOLIDAY_SETS.off.has(key)) return 'off';
  if (HOLIDAY_SETS.work.has(key)) return 'work';
  return '';
}

// ============ UI 组件 ============
function weekHeader() {
  return row(['日', '一', '二', '三', '四', '五', '六'].map((w) => ({
    type: 'stack', flex: 1, alignItems: 'center', justifyContent: 'center',
    children: [T(w, 11, C.dim, 'medium')],
  })), 4);
}

function dateCell(d, viewM) {
  const today = isToday(d);
  const type = dayType(d);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  const other = d.getMonth() !== viewM;
  let numColor = C.text;
  if (today) numColor = C.gold;
  else if (type === 'off') numColor = C.red;
  else if (other || weekend) numColor = C.dim;
  return {
    type: 'stack', direction: 'column', alignItems: 'center', justifyContent: 'center',
    flex: 1, gap: 3, padding: [7, 2, 5, 2], borderRadius: 14,
    backgroundColor: today ? { light: '#FFB34066', dark: '#FFB34040' } : C.glass,
    ...(today ? { borderWidth: 1, borderColor: '#FFB340CC' } : {}),
    children: [
      T(String(d.getDate()), 18, numColor, today ? 'bold' : 'medium', { minScale: 0.7 }),
      {
        type: 'stack', width: 4, height: 4, borderRadius: 2,
        backgroundColor: type === 'work' ? C.blue : { light: '#00000000', dark: '#00000000' },
        children: [],
      },
    ],
  };
}

function monthGridWeeks(y, m, weeks) {
  const rows = [];
  const first = new Date(y, m, 1);
  let start = new Date(first);
  start.setDate(start.getDate() - first.getDay());
  for (let w = 0; w < weeks; w++) {
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7 + i);
      cells.push(dateCell(d, m));
    }
    rows.push(row(cells, 4));
  }
  return rows;
}

function huangliFooter() {
  const { god, good } = jianchu(now);
  const yiji = GOD_YIJI[god];
  const kids = [
    T('黄历', 10, C.dim, 'medium'),
    T(lunarDayStr(now), 10, C.text, 'medium'),
    T(`${GODS[god]}日`, 10, good ? C.gold : C.red, 'bold'),
    { type: 'spacer' },
    T(`宜 ${yiji.yi}`, 10, C.text, 'medium'),
  ];
  if (yiji.ji) kids.push(T(`忌 ${yiji.ji}`, 10, C.dim, 'medium'));
  return {
    type: 'stack', direction: 'row', alignItems: 'center', gap: 6,
    padding: [9, 12, 9, 12], borderRadius: 14, backgroundColor: C.glass,
    children: kids,
  };
}

function header() {
  return row([
    icon('calendar', 16),
    T(`${todayM + 1}月`, 17, C.text, 'bold'),
    { type: 'spacer' },
    T(String(todayY), 13, C.dim, 'medium'),
  ], 6);
}

// ============ 主入口 ============
function main() {
  const size = $widget.size; // small | medium | large | extraLarge | accessoryCircular | accessoryInline | accessoryRectangular
  const root = bg();

  if (size === 'accessoryCircular') {
    root.children = [{ type: 'spacer' }, T(String(todayD), 22, C.text, 'bold'), { type: 'spacer' }];
    return root;
  }
  if (size === 'accessoryInline') {
    root.children = [row([icon('calendar', 13), T(`${todayM + 1}-${todayD}`, 13, C.text, 'medium')], 4)];
    return root;
  }
  if (size === 'accessoryRectangular') {
    root.children = [
      row([icon('calendar', 14), T(`${todayM + 1}月`, 15, C.text, 'bold')], 5),
      T(String(todayD), 26, C.gold, 'bold'),
    ];
    return root;
  }

  if (size === 'small') {
    root.children = [header(), { type: 'spacer', flex: 0.5 }, weekHeader(), ...monthGridWeeks(todayY, todayM, 6)];
    return root;
  }

  const weeks = size === 'large' || size === 'extraLarge' ? 4 : 2;
  root.children = [
    header(),
    { type: 'spacer', flex: 0.5 },
    weekHeader(),
    ...monthGridWeeks(todayY, todayM, weeks),
    { type: 'spacer', flex: 0.3 },
    huangliFooter(),
    { type: 'spacer' },
  ];
  return root;
}

try {
  const w = main();
  $widget.setConfig(w);
  if ($widget.size !== 'accessoryCircular' && $widget.size !== 'accessoryInline' && $widget.size !== 'accessoryRectangular') {
    $widget.setRefreshAfter(86400 - (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) + 60);
  }
} catch (e) {
  $widget.setConfig({
    type: 'stack', children: [{ type: 'text', text: '日历加载失败', font: { size: 13 }, color: C.text }],
  });
}
