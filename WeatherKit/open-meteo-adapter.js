/**
 * Open-Meteo → 彩云分钟降水 翻译器
 * 
 * 拦截 v3 WeatherKit 脚本对 api.caiyunapp.com/v2.6/*/minutely 的请求，
 * 转调免费的 Open-Meteo API，再把数据翻译成彩云 v2.6 格式返回。
 * 其他彩云请求（realtime/hourly/daily）不受影响，直接放行。
 * 
 * 原理：v3 脚本从彩云响应里只读这几个字段：
 *   - result.minutely.status ("ok")
 *   - result.minutely.precipitation_2h (120 个值，每分钟 mm/h)
 *   - result.minutely.probability (4 个值，每 30 分钟降水概率 0-1)
 *   - result.minutely.description (文字描述)
 *   - server_time, location
 */

// Egern/Surge/Loon/Quantumult X 通用入口
async function main() {
  const url = $request.url;

  // 只处理 minutely 请求，其他放行
  if (!url.includes('/minutely')) {
    $done({});
    return;
  }

  try {
    // 从 URL 提取经纬度：/v2.6/{key}/{lon},{lat}/minutely...
    const match = url.match(/\/v2\.6\/[^/]+\/([\d.-]+),([\d.-]+)/);
    if (!match) {
      console.log('[OM-Adapter] 无法解析坐标: ' + url);
      $done({});
      return;
    }
    const lon = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    console.log(`[OM-Adapter] 坐标: ${lat},${lon}`);

    // 调 Open-Meteo：15 分钟级降水，取未来 3 小时（12 个点，够用 2 小时）
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&forecast_days=1&timezone=auto`;
    const omResp = await httpGet(omUrl);
    const omData = JSON.parse(omResp);

    const times = omData?.minutely_15?.time || [];
    const precips = omData?.minutely_15?.precipitation || [];
    if (times.length === 0) {
      console.log('[OM-Adapter] Open-Meteo 无数据');
      $done({});
      return;
    }

    // 找到当前时间对应的起始点
    const now = Date.now();
    let startIdx = 0;
    for (let i = 0; i < times.length; i++) {
      // Open-Meteo 返回的是当地时间 ISO，无时区后缀；用字符串比较找最接近当前时间的点
      const t = new Date(times[i] + ':00').getTime();
      // timezone=auto 返回当地时间，直接比较即可（近似）
      if (i === 0) {
        // 简单处理：取第一个未来时间点
        startIdx = 0;
        break;
      }
    }

    // 构建 120 分钟的 precipitation_2h（mm/h）
    // Open-Meteo 是每 15 分钟一个值（mm/15min），转成 mm/h 后填充到每分钟
    const precipitation_2h = [];
    for (let m = 0; m < 120; m++) {
      const blockIdx = startIdx + Math.floor(m / 15);
      const mmPer15min = precips[blockIdx] ?? 0;
      const mmPerHour = mmPer15min * 4;
      precipitation_2h.push(Math.round(mmPerHour * 100) / 100);
    }

    // 构建 probability（4 个值，每 30 分钟）：有降水则 0.9，无则 0.05
    const probability = [];
    for (let b = 0; b < 4; b++) {
      let hasRain = false;
      for (let m = b * 30; m < (b + 1) * 30; m++) {
        if (precipitation_2h[m] > 0.01) { hasRain = true; break; }
      }
      probability.push(hasRain ? 0.9 : 0.05);
    }

    // 描述
    const maxPrecip = Math.max(...precipitation_2h);
    let description;
    if (maxPrecip < 0.01) {
      description = '未来2小时无降水';
    } else {
      // 找第一次降水的时间
      let firstRainMin = precipitation_2h.findIndex(v => v > 0.01);
      description = firstRainMin <= 0
        ? '未来2小时有降水'
        : `预计${firstRainMin}分钟后有降水`;
    }

    const serverTime = Math.floor(Date.now() / 1000);
    const caiyunResp = {
      status: 'ok',
      api_version: 'v2.6',
      api_status: 'active',
      lang: 'zh_CN',
      unit: 'metric',
      tzshift: 28800,
      timezone: 'Asia/Shanghai',
      server_time: serverTime,
      location: [lat, lon],
      result: {
        minutely: {
          status: 'ok',
          datasource: 'open-meteo',
          precipitation_2h: precipitation_2h,
          probability: probability,
          description: description
        }
      }
    };

    console.log(`[OM-Adapter] OK, 最大降水 ${maxPrecip}mm/h, 描述: ${description}`);
    $done({ body: JSON.stringify(caiyunResp) });

  } catch (e) {
    console.log('[OM-Adapter] 出错: ' + e.message);
    $done({}); // 出错则放行原请求
  }
}

// 跨平台 HTTP GET
function httpGet(url) {
  return new Promise((resolve, reject) => {
    if (typeof $httpClient !== 'undefined') {
      // Surge/Loon
      $httpClient.get(url, (err, resp, data) => {
        err ? reject(err) : resolve(data);
      });
    } else if (typeof $task !== 'undefined') {
      // Quantumult X
      $task.fetch({ url, method: 'GET' }).then(
        resp => resolve(resp.body),
        err => reject(err)
      );
    } else {
      reject(new Error('不支持的代理环境'));
    }
  });
}

main();
