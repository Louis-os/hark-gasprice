/**
 * 双周日历小组件（Hark 仪表盘版样式）
 * 基于 IBL3ND/CN_Cal.JS 改版
 *
 * 改动：
 *  • 界面与「油价-Hark」统一：深色渐变背景 + 玻璃拟态卡片 + 金色强调
 *  • 只保留数字显示：去掉农历、节日、节气、周数等文字
 *  • 今天用金色高亮；双周视图中非本月的日期数字变淡
 *  • 锁屏小组件：只显示日期数字
 */

// ---------- 风格（与油价-Hark 一致） ----------
const pad = n => String(n).padStart(2, '0');

const C = {
  text:  { light: '#000000', dark: '#FFFFFF' },
  dim:   { light: '#3C3C4399', dark: '#EBEBF599' },
  glass: { light: '#FFFFFFA6', dark: '#FFFFFF1A' },
  gold:  '#FFB340',
};

function bg() {
  return {
    type: 'linear',
    colors: [
      { light: '#FFF6EA', dark: '#2A1708' },
      { light: '#F4F0FF', dark: '#140F26' },
      { light: '#EEF6FF', dark: '#07121F' },
    ],
    stops: [0, 0.55, 1],
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 1, y: 1 },
  };
}

function T(text, size, color, weight = 'regular', extra = {}) {
  return {
    type: 'text', text: String(text ?? ''),
    font: { size, weight }, textColor: color || C.text,
    maxLines: 1, minScale: 0.6, ...extra,
  };
}

function row(children, extra = {}) {
  return { type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children, ...extra };
}

function icon(name, color, size = 14) {
  return { type: 'image', src: `sf-symbol:${name}`, width: size, height: size, color };
}

// ---------- 日历 ----------
export default async function (ctx) {
  const widgetFamily = ctx?.widgetFamily || 'systemMedium';
  const now = new Date();
  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();

  // 每天零点后刷新
  const refreshAfter = new Date(todayY, todayM, todayD + 1).toISOString();

  // 本周周日
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());

  const isToday = (d) =>
    d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;

  const weekNames = ['日', '一', '二', '三', '四', '五', '六'];

  function weekHeader() {
    return {
      type: 'stack', direction: 'row', gap: 6,
      children: weekNames.map((w) => ({
        type: 'stack', flex: 1, alignItems: 'center',
        children: [T(w, 11, C.dim, 'medium')],
      })),
    };
  }

  function dateCell(d) {
    const today = isToday(d);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const otherMonth = d.getMonth() !== todayM;
    return {
      type: 'stack', direction: 'column', alignItems: 'center', flex: 1,
      padding: [7, 2, 7, 2], borderRadius: 14,
      backgroundColor: today ? { light: '#FFB34066', dark: '#FFB34040' } : C.glass,
      ...(today ? { borderWidth: 1, borderColor: { light: '#FFB340CC', dark: '#FFB340CC' } } : {}),
      children: [
        T(
          String(d.getDate()), 18,
          today ? C.gold : otherMonth ? C.dim : weekend ? C.dim : C.text,
          today ? 'bold' : 'medium',
          { minScale: 0.7 }
        ),
      ],
    };
  }

  function buildWeeks(count) {
    const rows = [];
    for (let w = 0; w < count; w++) {
      const cells = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + w * 7 + i);
        cells.push(dateCell(d));
      }
      rows.push({ type: 'stack', direction: 'row', gap: 6, children: cells });
      if (w < count - 1) rows.push({ type: 'spacer', length: 8 });
    }
    return rows;
  }

  function header() {
    return row([
      icon('calendar', C.gold, 15),
      T(`${todayM + 1}月`, 18, C.text, 'bold', { minScale: 1 }),
      { type: 'spacer' },
      T(String(todayY), 12, C.dim, 'medium', { minScale: 1 }),
    ]);
  }

  // ---------- 锁屏（不套渐变背景，交给系统） ----------
  if (widgetFamily === 'accessoryCircular') {
    return {
      type: 'widget', padding: 4, refreshAfter,
      children: [
        { type: 'spacer' },
        T(String(todayD), 30, C.text, 'bold', { minScale: 0.6, align: 'center' }),
        { type: 'spacer' },
      ],
    };
  }
  if (widgetFamily === 'accessoryInline') {
    return {
      type: 'widget', refreshAfter,
      children: [T(`${todayM + 1}-${todayD}`, 13, C.text, 'medium', { minScale: 0.6 })],
    };
  }
  if (widgetFamily === 'accessoryRectangular') {
    return {
      type: 'widget', padding: 6, gap: 2, refreshAfter,
      children: [
        T(`${todayM + 1}月`, 12, C.dim, 'medium'),
        T(String(todayD), 26, C.text, 'bold', { minScale: 0.6 }),
      ],
    };
  }

  const base = { type: 'widget', backgroundGradient: bg(), refreshAfter };

  // ---------- 小尺寸：月视图 ----------
  if (widgetFamily === 'systemSmall') {
    const firstDay = new Date(todayY, todayM, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(todayY, todayM + 1, 0).getDate();

    const rows = [];
    let day = 1 - startWeekday;
    while (day <= daysInMonth) {
      const cells = [];
      for (let i = 0; i < 7; i++) {
        const dNum = day + i;
        const valid = dNum > 0 && dNum <= daysInMonth;
        const today = valid && dNum === todayD;
        const weekend = i === 0 || i === 6;
        cells.push({
          type: 'stack', alignItems: 'center', flex: 1,
          padding: [3, 0, 3, 0],
          ...(today
            ? { backgroundColor: { light: '#FFB34066', dark: '#FFB34040' }, borderRadius: 12 }
            : {}),
          children: valid
            ? [T(String(dNum), 12, today ? C.gold : weekend ? C.dim : C.text, today ? 'bold' : 'regular', { minScale: 0.6 })]
            : [T('', 12, C.dim)],
        });
      }
      rows.push({ type: 'stack', direction: 'row', gap: 2, children: cells });
      day += 7;
    }

    const spaced = [];
    rows.forEach((r, idx) => {
      spaced.push(r);
      if (idx < rows.length - 1) spaced.push({ type: 'spacer' });
    });

    return {
      ...base, padding: [12, 12, 12, 12], gap: 6,
      children: [header(), weekHeader(), ...spaced, { type: 'spacer' }],
    };
  }

  // ---------- 大尺寸：四周 ----------
  if (widgetFamily === 'systemLarge') {
    return {
      ...base, padding: [14, 14, 14, 14], gap: 8,
      children: [header(), weekHeader(), ...buildWeeks(4), { type: 'spacer' }],
    };
  }

  // ---------- 默认：双周 ----------
  return {
    ...base, padding: [12, 14, 12, 14], gap: 8,
    children: [header(), weekHeader(), ...buildWeeks(2), { type: 'spacer' }],
  };
}
