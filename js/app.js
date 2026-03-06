(function () {
  'use strict';

  var config = window.APP_CONFIG || {};
  var apiUrl = config.apiUrl || '/api/guess';

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  function initCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  initCanvas();

  var drawing = false;
  var lastX = 0, lastY = 0;

  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    var pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    var pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw(e) {
    if (!drawing) return;
    if (e) e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });
  canvas.addEventListener('touchcancel', endDraw, { passive: false });

  var statusText = document.getElementById('statusText');
  var guessBtn = document.getElementById('guessBtn');
  var clearBtn = document.getElementById('clearBtn');
  var mainResult = document.getElementById('mainResult');
  var mainConf = document.getElementById('mainConf');
  var mainBar = document.getElementById('mainBar');
  var listEl = document.getElementById('list');
  var emptyEl = document.getElementById('empty');
  var speechBubble = document.getElementById('speechBubble');
  var speechText = document.getElementById('speechText');
  var mascotImg = document.getElementById('mascotImg');

  var aiTips = [
    '画个东西，我来猜～',
    'AI 大模型就像一个很会读书的“大脑”，读过很多很多书和图片。',
    '猜画画的 AI 会“看”你画的图，然后猜它是什么东西。',
    '大模型可以写作文、翻译、认图，还能跟人聊天哦。',
    'AI 是 Artificial Intelligence 的缩写，就是“人工智能”。',
    '我们用的智谱 AI 是咱们中国自己研发的大模型～',
    'AI 不会真的“想”，它是用数学和很多例子学出来的。',
    '你画得越清楚，AI 就猜得越准！',
    '大模型要学很多很多数据，就像小朋友要学很多知识一样。',
    '以后 AI 会帮我们做更多事情，比如当小老师、当助手。'
  ];
  var tipIndex = 0;
  var tipTimer = null;
  var resultTimer = null;
  var TIP_INTERVAL = 9000;
  var RESULT_SHOW_MS = 6000;

  function setSpeech(text, isResult) {
    if (!speechText) return;
    speechText.textContent = text || aiTips[0];
    if (speechBubble) {
      if (isResult) speechBubble.classList.add('saying-result');
      else speechBubble.classList.remove('saying-result');
    }
  }

  function startTipRotation() {
    if (tipTimer) clearInterval(tipTimer);
    tipTimer = setInterval(function () {
      tipIndex = (tipIndex + 1) % aiTips.length;
      setSpeech(aiTips[tipIndex], false);
    }, TIP_INTERVAL);
  }

  function stopTipRotation() {
    if (tipTimer) {
      clearInterval(tipTimer);
      tipTimer = null;
    }
  }

  function showResultInBubble(label) {
    stopTipRotation();
    setSpeech('我猜是：' + (label || '？') + '～', true);
    if (resultTimer) clearTimeout(resultTimer);
    resultTimer = setTimeout(function () {
      resultTimer = null;
      tipIndex = (tipIndex + 1) % aiTips.length;
      setSpeech(aiTips[tipIndex], false);
      startTipRotation();
    }, RESULT_SHOW_MS);
  }

  function showResults(results) {
    if (!results || !results.length) return;
    var top = results[0];
    var conf = top.confidence != null ? Math.round(top.confidence * 100) : 90;
    mainResult.textContent = top.label || '未知';
    mainConf.textContent = conf > 0 ? '信心：' + conf + '%' : '';
    mainBar.style.width = Math.min(100, conf) + '%';
    emptyEl.style.display = 'none';
    if (mainBar.parentElement) mainBar.parentElement.style.display = 'none';
    listEl.innerHTML = results.slice(0, 5).map(function (r, i) {
      var c = r.confidence != null ? Math.round(r.confidence * 100) : '';
      return '<div class="list-item"><span>' + (i + 1) + '. ' + (r.label || '') + '</span>' + (c ? '<span>' + c + '%</span>' : '') + '</div>';
    }).join('');
    showResultInBubble(top.label || '');
  }

  function fail(msg) {
    guessBtn.disabled = false;
    guessBtn.textContent = '猜一猜';
    statusText.textContent = msg || '没猜出来，再试一次吧';
    mainResult.textContent = '？';
    mainConf.textContent = '';
    mainBar.style.width = '0%';
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    setSpeech('没猜出来～再画清楚一点试试？', false);
    startTipRotation();
  }

  clearBtn.addEventListener('click', function () {
    initCanvas();
    mainResult.textContent = '？';
    mainConf.textContent = '';
    mainBar.style.width = '0%';
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    statusText.textContent = '擦掉啦，再画一个吧～';
    setSpeech('画个东西，我来猜～', false);
    startTipRotation();
  });

  guessBtn.addEventListener('click', function () {
    guessBtn.disabled = true;
    guessBtn.textContent = '猜呢...';
    statusText.textContent = 'AI 在想呢...';

    var dataUrl = canvas.toDataURL('image/png');

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        guessBtn.disabled = false;
        guessBtn.textContent = '猜一猜';
        statusText.textContent = '猜错了就擦掉再画～';

        if (data.results && data.results.length) {
          showResults(data.results);
          return;
        }
        if (data.label) {
          showResults([{ label: data.label, confidence: data.confidence != null ? data.confidence : 0.9 }]);
          return;
        }
        if (data.error) {
          fail(data.error.message || data.error);
          return;
        }
        fail('接口返回格式有误');
      })
      .catch(function (err) {
        fail('网络错误，请确认后端已启动且地址正确');
        console.error(err);
      });
  });

  statusText.textContent = '画好了就点「猜一猜」';
  guessBtn.disabled = false;

  setSpeech(aiTips[0], false);
  startTipRotation();

  if (mascotImg) {
    mascotImg.onerror = function () {
      mascotImg.setAttribute('data-fallback', '1');
      mascotImg.alt = '蜗壳小助手';
    };
  }
})();
