(function () {
  'use strict';

  var TIME_SLOTS = [
    { value: 'unknown', label: '모름' },
    { value: '00:30', label: '조자시 (00:00–01:00)' },
    { value: '02:00', label: '축시 (01:00–03:00)' },
    { value: '04:00', label: '인시 (03:00–05:00)' },
    { value: '06:00', label: '묘시 (05:00–07:00)' },
    { value: '08:00', label: '진시 (07:00–09:00)' },
    { value: '10:00', label: '사시 (09:00–11:00)' },
    { value: '12:00', label: '오시 (11:00–13:00)' },
    { value: '14:00', label: '미시 (13:00–15:00)' },
    { value: '16:00', label: '신시 (15:00–17:00)' },
    { value: '18:00', label: '유시 (17:00–19:00)' },
    { value: '20:00', label: '술시 (19:00–21:00)' },
    { value: '22:00', label: '해시 (21:00–23:00)' },
    { value: '23:30', label: '야자시 (23:00–24:00)' }
  ];

  var state = { reading: null };
  var els = {};

  function $(id) { return document.getElementById(id); }

  function init() {
    els.form = $('saju-form');
    els.year = $('birth-year');
    els.month = $('birth-month');
    els.day = $('birth-day');
    els.leapWrap = $('leap-wrap');
    els.leap = $('leap-month');
    els.leapHint = $('leap-hint');
    els.time = $('birth-time');
    els.landing = $('landing');
    els.result = $('result');
    els.modal = $('pay-modal');

    fillYears();
    fillTimes();
    fillMonths();
    fillDays();

    els.year.addEventListener('change', onDateMetaChange);
    els.month.addEventListener('change', onDateMetaChange);
    els.leap.addEventListener('change', onDateMetaChange);
    document.querySelectorAll('input[name="calendar"]').forEach(function (r) {
      r.addEventListener('change', onCalendarToggle);
    });

    els.form.addEventListener('submit', onSubmit);
    $('btn-back').addEventListener('click', showLanding);
    $('btn-pay').addEventListener('click', openPayModal);
    $('btn-pay-close').addEventListener('click', closePayModal);
    $('pay-modal').addEventListener('click', function (e) {
      if (e.target === els.modal) closePayModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePayModal();
    });

    document.querySelectorAll('.seg').forEach(function (group) {
      group.addEventListener('change', syncSeg);
    });
    syncSeg();
    onCalendarToggle();
  }

  function syncSeg() {
    document.querySelectorAll('.seg label').forEach(function (lab) {
      var input = lab.querySelector('input');
      lab.classList.toggle('is-on', !!(input && input.checked));
    });
  }


  function fillYears() {
    var now = new Date().getFullYear();
    var html = '';
    for (var y = now; y >= 1901; y--) {
      html += '<option value="' + y + '"' + (y === 1990 ? ' selected' : '') + '>' + y + '년</option>';
    }
    els.year.innerHTML = html;
  }

  function fillTimes() {
    els.time.innerHTML = TIME_SLOTS.map(function (t) {
      return '<option value="' + t.value + '">' + t.label + '</option>';
    }).join('');
  }

  function currentCalendar() {
    var r = document.querySelector('input[name="calendar"]:checked');
    return r ? r.value : 'solar';
  }

  function onCalendarToggle() {
    var cal = currentCalendar();
    var isLunar = cal === 'lunar';
    els.leapWrap.hidden = !isLunar;
    if (!isLunar) {
      els.leap.checked = false;
    }
    fillMonths();
    fillDays();
    updateLeapHint();
  }

  function onDateMetaChange() {
    if (currentCalendar() === 'lunar') {
      fillMonths();
      updateLeapHint();
    }
    fillDays();
  }

  function fillMonths() {
    var year = Number(els.year.value);
    var prev = els.month.value || '1';
    var cal = currentCalendar();
    var html = '';
    var leap = 0;
    if (cal === 'lunar') {
      try { leap = SajuCalc.getLeapMonth(year); } catch (e) { leap = 0; }
    }
    for (var m = 1; m <= 12; m++) {
      html += '<option value="' + m + '">' + m + '월</option>';
      if (leap === m) {
        html += '<option value="leap-' + m + '">윤' + m + '월</option>';
      }
    }
    els.month.innerHTML = html;
    var want = prev;
    if ([].some.call(els.month.options, function (o) { return o.value === want; })) {
      els.month.value = want;
    } else {
      var n = parseInt(prev, 10);
      els.month.value = String(Math.min(Math.max(n || 1, 1), 12));
    }
  }

  function selectedMonth() {
    var v = els.month.value;
    if (String(v).indexOf('leap-') === 0) {
      return { month: Number(v.slice(5)), leap: true };
    }
    return { month: Number(v), leap: false };
  }

  function updateLeapHint() {
    if (currentCalendar() !== 'lunar') {
      els.leapHint.textContent = '';
      return;
    }
    var year = Number(els.year.value);
    var leap = 0;
    try { leap = SajuCalc.getLeapMonth(year); } catch (e) { leap = 0; }
    if (leap) {
      els.leapHint.textContent = year + '년 음력에는 윤' + leap + '월이 있습니다. 윤달 생이라면 위 목록에서 ‘윤' + leap + '월’을 골라 주세요.';
    } else {
      els.leapHint.textContent = year + '년 음력에는 윤달이 없습니다.';
    }
    // sync hidden checkbox from month select
    els.leap.checked = selectedMonth().leap;
  }

  function fillDays() {
    var year = Number(els.year.value);
    var sel = selectedMonth();
    var prev = Number(els.day.value) || 1;
    var max = 31;
    try {
      if (currentCalendar() === 'lunar') {
        max = SajuCalc.lunarMonthDays(year, sel.month, sel.leap);
      } else {
        max = SajuCalc.solarMonthDays(year, sel.month);
      }
    } catch (e) {
      max = 30;
    }
    var html = '';
    for (var d = 1; d <= max; d++) {
      html += '<option value="' + d + '">' + d + '일</option>';
    }
    els.day.innerHTML = html;
    els.day.value = String(Math.min(prev, max));
  }

  function onSubmit(e) {
    e.preventDefault();
    var gender = (document.querySelector('input[name="gender"]:checked') || {}).value;
    if (!gender) {
      toast('성별을 선택해 주세요.');
      return;
    }
    var sel = selectedMonth();
    var timeVal = els.time.value;
    var timeUnknown = timeVal === 'unknown';
    var hour = 12, minute = 0;
    if (!timeUnknown) {
      var parts = timeVal.split(':');
      hour = Number(parts[0]);
      minute = Number(parts[1] || 0);
    }
    try {
      state.reading = SajuCalc.compute({
        name: $('person-name').value,
        gender: gender,
        year: Number(els.year.value),
        month: sel.month,
        day: Number(els.day.value),
        hour: hour,
        minute: minute,
        calendar: currentCalendar(),
        leap: sel.leap,
        timeUnknown: timeUnknown
      });
    } catch (err) {
      console.error(err);
      toast('날짜를 다시 확인해 주세요. 음력·윤달이 해당 연도에 없을 수 있습니다.');
      return;
    }
    renderResult(state.reading);
    showResult();
  }

  function showResult() {
    els.landing.hidden = true;
    els.result.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.body.classList.add('is-result');
  }

  function showLanding() {
    els.result.hidden = true;
    els.landing.hidden = false;
    document.body.classList.remove('is-result');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderResult(r) {
    var who = r.input.name ? r.input.name : '손님';
    var genderLabel = r.input.gender === 'female' ? '여' : '남';
    var calLabel = r.input.calendar === 'lunar' ? (r.input.leap ? '음력 윤달' : '음력') : '양력';
    $('result-kicker').textContent = who + ' · ' + genderLabel + ' · ' + calLabel;
    $('result-title').textContent = who + ' 님의 사주팔자';
    $('result-sub').textContent = '양력 ' + r.input.birthSolar + '  (음력 ' + r.input.birthLunar + ')  ·  일간 ' + r.dayMaster.hangeul + r.dayMaster.gan + '  ·  ' + r.animal + '띠 (입춘 기준)';

    renderPillars(r);
    renderWuxing(r);
    renderIlgan(r);
    renderYear(r);
    renderPaid(r);
  }

  function pillarCard(title, p, highlight) {
    if (!p) {
      return '<article class="pillar pillar--empty">'
        + '<h3>' + title + '</h3>'
        + '<p class="pillar-unknown">시주를 알 수 없어<br>여섯 글자로 봅니다</p>'
        + '</article>';
    }
    return '<article class="pillar' + (highlight ? ' pillar--day' : '') + '">'
      + '<h3>' + title + '</h3>'
      + '<p class="pillar-gan"><span class="hanja">' + p.gan + '</span><span class="hangul">' + p.ganHangeul + '</span>'
      + '<span class="wx wx--' + p.ganWuxing + '">' + p.ganWuxing + ' ' + SajuCalc.WX_HANJA[p.ganWuxing] + '</span></p>'
      + '<p class="pillar-zhi"><span class="hanja">' + p.zhi + '</span><span class="hangul">' + p.zhiHangeul + '</span>'
      + '<span class="wx wx--' + p.zhiWuxing + '">' + p.zhiWuxing + ' ' + SajuCalc.WX_HANJA[p.zhiWuxing] + '</span></p>'
      + '<p class="pillar-gz">' + p.hangeul + ' (' + p.hanja + ')</p>'
      + '</article>';
  }

  function renderPillars(r) {
    var p = r.pillars;
    $('pillar-grid').innerHTML = [
      pillarCard('년주', p.year, false),
      pillarCard('월주', p.month, false),
      pillarCard('일주', p.day, true),
      pillarCard('시주', p.time, false)
    ].join('');
  }

  function renderWuxing(r) {
    var max = Math.max(1, r.wuxing.total);
    var html = SajuCalc.WX_ORDER.map(function (wx) {
      var n = r.wuxing.counts[wx];
      var pct = Math.round((n / max) * 100);
      return '<div class="wx-row">'
        + '<span class="wx-name wx--' + wx + '">' + SajuCalc.WX_HANJA[wx] + ' ' + wx + '</span>'
        + '<div class="wx-bar" role="img" aria-label="' + wx + ' ' + n + '개"><span style="width:' + pct + '%"></span></div>'
        + '<span class="wx-count">' + n + '</span>'
        + '</div>';
    }).join('');
    var note = '겉으로 드러난 ' + r.wuxing.total + '글자 기준입니다. 지지 속 지장간은 넣지 않았습니다.';
    var texts = SajuText.wuxingTexts(r.wuxing);
    $('wuxing-chart').innerHTML = html + '<p class="wx-note">' + note + '</p>'
      + texts.map(function (t) { return '<p class="wx-text">' + t + '</p>'; }).join('');
  }

  function renderIlgan(r) {
    var t = SajuText.ilgan(r.dayMaster.gan);
    $('ilgan-box').innerHTML = '<p class="ilgan-badge">' + t.title + (r.dayMaster.yang ? ' · 양' : ' · 음') + '</p>'
      + '<p class="ilgan-text">' + t.summary + '</p>'
      + '<p class="ilgan-note">일간만으로 인생을 단정하지는 않습니다. 네 기둥과 대운이 만나면 결이 달라질 수 있어요. 아래는 참고용 맛보기입니다.</p>';
  }

  function renderYear(r) {
    var t = SajuText.teaserYear(r.yearLuck);
    $('year-box').innerHTML = '<p class="year-badge">' + t.title + (t.shiShen ? ' · ' + t.shiShen : '') + '</p>'
      + '<p class="year-text">' + t.text + '</p>'
      + '<p class="year-more">' + t.more + '</p>';
  }

  function renderPaid(r) {
    var prev = SajuText.paidPreview(r);
    var daYunLines = r.daYun.filter(function (d) { return d.index > 0; }).slice(0, 6).map(function (d) {
      return '<li>' + d.startAge + '–' + d.endAge + '세 (' + d.startYear + '–' + d.endYear + ')  '
        + d.label.hangeul + '(' + d.label.hanja + ')</li>';
    }).join('');
    var monthLines = (r.monthly2027 || []).map(function (m) {
      var line = SajuText.monthLine(m.shiShen);
      return '<li><strong>' + m.start.slice(5).replace('-', '/') + ' ' + m.jieKr + '</strong> '
        + m.pillar.hangeul + '(' + m.pillar.hanja + ') · ' + (m.shiShen || '') + ' — ' + line + '</li>';
    }).join('');

    var cards = [
      { key: 'wealth', title: '재물운', body: prev.wealth },
      { key: 'love', title: '연애·결혼운', body: prev.love },
      { key: 'career', title: '직업·적성', body: prev.career },
      { key: 'health', title: '건강', body: prev.health },
      { key: 'dayun', title: '10년 대운', body: prev.dayun, extra: '<ul class="blur-list">' + daYunLines + '</ul>' },
      { key: 'monthly', title: '2027년 월별 운세', body: prev.monthly, extra: '<ul class="blur-list">' + monthLines + '</ul>' }
    ];

    $('paid-grid').innerHTML = cards.map(function (c) {
      return '<article class="paid-card" data-key="' + c.key + '">'
        + '<div class="paid-lock" aria-hidden="true">鎖</div>'
        + '<h3>' + c.title + '</h3>'
        + '<div class="paid-blur">'
        + '<p>' + c.body + '</p>'
        + (c.extra || '')
        + '</div>'
        + '</article>';
    }).join('');
  }

  function openPayModal() {
    var ctx = {
      customer: { name: (state.reading && state.reading.input.name) || '' },
      reading: state.reading ? {
        pillars: state.reading.pillars,
        dayMaster: state.reading.dayMaster
      } : null
    };
    SajuPayment.checkout(ctx).then(function (res) {
      if (res && res.status === 'paid') {
        // 향후 결제 성공 시 상세 카드 잠금 해제 지점
        closePayModal();
        return;
      }
      els.modal.hidden = false;
      document.body.classList.add('modal-open');
      $('btn-pay-close').focus();
    }).catch(function (err) {
      console.error(err);
      els.modal.hidden = false;
      document.body.classList.add('modal-open');
    });
  }

  function closePayModal() {
    els.modal.hidden = true;
    document.body.classList.remove('modal-open');
    var btn = $('btn-pay');
    if (btn) btn.focus();
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._id);
    toast._id = setTimeout(function () { t.hidden = true; }, 2800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
