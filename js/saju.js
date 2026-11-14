/**
 * lunar-javascript (6tail) 기반 사주팔자 계산 래퍼.
 * - 년주: 입춘 절입 시각 기준
 * - 월주: 절기(절입) 시각 기준
 * - 일주·시주: 입력 시각을 KST로 간주 (경도 보정·서머타임은 MVP에서 생략)
 * - 기본 자시 처리: 라이브러리 기본 流派 2 (23:00~00:00은 당일 일주, 시주만 다음 날 자시)
 */
(function (global) {
  'use strict';

  var GAN_H = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계' };
  var ZHI_H = { 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
  var GAN_WX = { 甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토', 己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수' };
  var ZHI_WX = { 子: '수', 丑: '토', 寅: '목', 卯: '목', 辰: '토', 巳: '화', 午: '화', 未: '토', 申: '금', 酉: '금', 戌: '토', 亥: '수' };
  var WX_HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };
  var WX_ORDER = ['목', '화', '토', '금', '수'];
  var ANIMAL = { 子: '쥐', 丑: '소', 寅: '호랑이', 卯: '토끼', 辰: '용', 巳: '뱀', 午: '말', 未: '양', 申: '원숭이', 酉: '닭', 戌: '개', 亥: '돼지' };
  var YANG_GAN = { 甲: 1, 乙: 0, 丙: 1, 丁: 0, 戊: 1, 己: 0, 庚: 1, 辛: 0, 壬: 1, 癸: 0 };
  var GAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var SHISHEN = {
    same: { 0: '비견', 1: '식신', 2: '편재', 3: '편관', 4: '편인' },
    diff: { 0: '겁재', 1: '상관', 2: '정재', 3: '정관', 4: '정인' }
  };

  function hanGan(g) { return (GAN_H[g] || '') + (g || ''); }
  function hanZhi(z) { return (ZHI_H[z] || '') + (z || ''); }
  function ganZhiLabel(gz) {
    if (!gz || gz.length < 2) return { hanja: '', hangeul: '', gan: '', zhi: '' };
    var g = gz.charAt(0), z = gz.charAt(1);
    return {
      hanja: gz,
      hangeul: (GAN_H[g] || '') + (ZHI_H[z] || ''),
      gan: g,
      zhi: z,
      ganHangeul: GAN_H[g] || '',
      zhiHangeul: ZHI_H[z] || '',
      ganWuxing: GAN_WX[g],
      zhiWuxing: ZHI_WX[z]
    };
  }

  function wuxingIndex(wx) {
    return WX_ORDER.indexOf(wx);
  }

  function shiShen(dayGan, otherGan) {
    if (!dayGan || !otherGan) return '';
    if (dayGan === otherGan) return '비견';
    var d = wuxingIndex(GAN_WX[dayGan]);
    var o = wuxingIndex(GAN_WX[otherGan]);
    if (d < 0 || o < 0) return '';
    var rel = (o - d + 5) % 5;
    var table = (YANG_GAN[dayGan] === YANG_GAN[otherGan]) ? SHISHEN.same : SHISHEN.diff;
    return table[rel];
  }

  function emptyCounts() {
    return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  }

  function addChar(counts, ch, map) {
    var wx = map[ch];
    if (wx) counts[wx] += 1;
  }

  function getLeapMonth(year) {
    var ly = LunarYear.fromYear(year);
    var months = ly.getMonths();
    for (var i = 0; i < months.length; i++) {
      var m = months[i].getMonth();
      if (months[i].getYear() === year && m < 0) return -m;
    }
    return 0;
  }

  function lunarMonthDays(year, month, isLeap) {
    var m = isLeap ? -Math.abs(month) : month;
    try {
      return LunarMonth.fromYm(year, m).getDayCount();
    } catch (e) {
      return 30;
    }
  }

  function solarMonthDays(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * @param {object} input
   *  year, month, day, hour, minute
   *  calendar: 'solar' | 'lunar'
   *  leap: boolean
   *  timeUnknown: boolean
   *  gender: 'male' | 'female'
   *  name?: string
   */
  function compute(input) {
    var year = Number(input.year);
    var month = Number(input.month);
    var day = Number(input.day);
    var hour = input.timeUnknown ? 12 : Number(input.hour);
    var minute = input.timeUnknown ? 0 : Number(input.minute || 0);
    var lunar, solar;

    if (input.calendar === 'lunar') {
      var lm = input.leap ? -Math.abs(month) : month;
      lunar = Lunar.fromYmdHms(year, lm, day, hour, minute, 0);
      solar = lunar.getSolar();
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      lunar = solar.getLunar();
    }

    var eight = lunar.getEightChar();
    // 기본 流派 2: 야자시(23시)는 당일 일주 유지
    eight.setSect(2);

    var yearGZ = eight.getYear();
    var monthGZ = eight.getMonth();
    var dayGZ = eight.getDay();
    var timeGZ = eight.getTime();
    var dayGan = eight.getDayGan();

    var pillars = {
      year: ganZhiLabel(yearGZ),
      month: ganZhiLabel(monthGZ),
      day: ganZhiLabel(dayGZ),
      time: input.timeUnknown ? null : ganZhiLabel(timeGZ)
    };

    var counts = emptyCounts();
    [pillars.year, pillars.month, pillars.day, pillars.time].forEach(function (p) {
      if (!p) return;
      addChar(counts, p.gan, GAN_WX);
      addChar(counts, p.zhi, ZHI_WX);
    });

    var totalChars = input.timeUnknown ? 6 : 8;
    var excess = [];
    var lack = [];
    WX_ORDER.forEach(function (wx) {
      if (counts[wx] === 0) lack.push(wx);
      else if (counts[wx] >= 3) excess.push(wx);
    });

    var genderCode = input.gender === 'female' ? 0 : 1;
    var yun = eight.getYun(genderCode);
    var daYunRaw = yun.getDaYun();
    var daYun = [];
    for (var i = 0; i < daYunRaw.length; i++) {
      var d = daYunRaw[i];
      daYun.push({
        index: d.getIndex(),
        ganZhi: d.getGanZhi(),
        label: ganZhiLabel(d.getGanZhi()),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        startAge: d.getStartAge(),
        endAge: d.getEndAge()
      });
    }

    var now = currentKstDate();
    var yearLuck = yearFortune(now.getFullYear(), dayGan);

    return {
      input: {
        name: (input.name || '').trim(),
        gender: input.gender,
        calendar: input.calendar,
        leap: !!input.leap,
        timeUnknown: !!input.timeUnknown,
        birthSolar: solar.toYmd() + ' ' + pad(solar.getHour()) + ':' + pad(solar.getMinute()),
        birthLunar: formatLunar(lunar)
      },
      pillars: pillars,
      dayMaster: {
        gan: dayGan,
        hangeul: GAN_H[dayGan],
        hanja: dayGan,
        wuxing: GAN_WX[dayGan],
        yang: !!YANG_GAN[dayGan],
        nayin: eight.getDayNaYin()
      },
      animal: ANIMAL[pillars.year.zhi],
      wuxing: {
        counts: counts,
        total: totalChars,
        excess: excess,
        lack: lack
      },
      daYun: daYun,
      yunStart: {
        year: yun.getStartYear(),
        month: yun.getStartMonth(),
        day: yun.getStartDay()
      },
      yearLuck: yearLuck,
      monthly2027: monthlyFortune(2027, dayGan),
      hidden: {
        year: eight.getYearHideGan(),
        month: eight.getMonthHideGan(),
        day: eight.getDayHideGan(),
        time: input.timeUnknown ? [] : eight.getTimeHideGan()
      }
    };
  }


  function formatLunar(lunar) {
    var m = lunar.getMonth();
    var leap = m < 0;
    return lunar.getYear() + '년 ' + (leap ? '윤' : '') + Math.abs(m) + '월 ' + lunar.getDay() + '일';
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function currentKstDate() {
    // 입력·표시는 KST. 호스트가 이미 Asia/Seoul이면 그대로 사용.
    return new Date();
  }

  function yearGanZhiOn(year, month, day) {
    var lunar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar();
    var eight = lunar.getEightChar();
    eight.setSect(2);
    return { year: eight.getYear(), month: eight.getMonth(), day: eight.getDay() };
  }

  function yearFortune(solarYear, dayGan) {
    // 입춘 이후의 세운을 '올해'로 본다. 입춘 이전이면 아직 전년도 세운.
    var now = currentKstDate();
    var probeYear = solarYear;
    var probe = Solar.fromYmd(probeYear, 2, 10).getLunar().getJieQiTable();
    var lichun = probe['立春'];
    var useYear = probeYear;
    if (lichun) {
      var lc = new Date(lichun.getYear(), lichun.getMonth() - 1, lichun.getDay(), lichun.getHour(), lichun.getMinute());
      if (now < lc && now.getFullYear() === probeYear) {
        useYear = probeYear - 1;
      }
    }
    var mid = yearGanZhiOn(useYear, 6, 15);
    var y = ganZhiLabel(mid.year);
    return {
      solarYear: useYear,
      ganZhi: y,
      shiShen: shiShen(dayGan, y.gan),
      wuxing: y.ganWuxing
    };
  }

  function monthlyFortune(solarYear, dayGan) {
    // 해당 해 입춘부터 다음 입춘 전까지 12개 절(節) 월주
    var months = [];
    var start = Solar.fromYmd(solarYear, 2, 1).getLunar();
    var jq = start.getJieQiTable();
    // 절(節)만: 立春, 驚蟄, 清明, 立夏, 芒種, 小暑, 立秋, 白露, 寒露, 立冬, 大雪, 小寒
    var jieNames = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
    var jieKr = {
      立春: '입춘', 惊蛰: '경칩', 清明: '청명', 立夏: '입하',
      芒种: '망종', 小暑: '소서', 立秋: '입추', 白露: '백로',
      寒露: '한로', 立冬: '입동', 大雪: '대설', 小寒: '소한'
    };
    // 소한은 다음 해 1월일 수 있음 — 테이블은 해당 음력년 전후 절기를 포함
    function findJie(name, afterYear, afterMonth) {
      // search nearby years' tables
      var years = [solarYear - 1, solarYear, solarYear + 1];
      var found = null;
      years.forEach(function (y) {
        var table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
        var s = table[name];
        if (!s) return;
        if (s.getYear() === solarYear || (name === '小寒' && s.getYear() === solarYear + 1) || (name === '立春' && s.getYear() === solarYear)) {
          found = s;
        }
      });
      return found;
    }

    // 입춘 of target year
    var lichun = null;
    [solarYear - 1, solarYear].forEach(function (y) {
      var table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
      if (table['立春'] && table['立春'].getYear() === solarYear) lichun = table['立春'];
    });

    jieNames.forEach(function (name, idx) {
      var s = null;
      [solarYear - 1, solarYear, solarYear + 1].forEach(function (y) {
        var table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
        var cand = table[name];
        if (!cand) return;
        if (name === '立春' && cand.getYear() === solarYear) s = cand;
        else if (name === '小寒' && (cand.getYear() === solarYear + 1 || (cand.getYear() === solarYear && cand.getMonth() >= 12))) s = cand;
        else if (name !== '立春' && name !== '小寒' && cand.getYear() === solarYear) s = cand;
      });
      if (!s) return;
      // 절입 직후 시각으로 월주 확인
      var eight = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), s.getHour(), Math.min(59, s.getMinute() + 1), 0)
        .getLunar().getEightChar();
      var gz = ganZhiLabel(eight.getMonth());
      months.push({
        jie: name,
        jieKr: jieKr[name],
        start: s.toYmd(),
        pillar: gz,
        shiShen: shiShen(dayGan, gz.gan)
      });
    });
    return months;
  }

  global.SajuCalc = {
    compute: compute,
    getLeapMonth: getLeapMonth,
    lunarMonthDays: lunarMonthDays,
    solarMonthDays: solarMonthDays,
    shiShen: shiShen,
    ganZhiLabel: ganZhiLabel,
    GAN_H: GAN_H,
    ZHI_H: ZHI_H,
    WX_ORDER: WX_ORDER,
    WX_HANJA: WX_HANJA,
    GAN_WX: GAN_WX
  };
})(typeof window !== 'undefined' ? window : globalThis);
