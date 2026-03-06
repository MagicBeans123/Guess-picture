(function () {
  'use strict';

  var config = window.APP_CONFIG || {};
  var apiUrl = config.apiUrl || '/api/guess';

  var VIDEO = {
    think: 'images/think.mp4',
    wavehanding: 'images/wavehanding.mp4',
    blinkeyes: 'images/blinkeyes.mp4'
  };

  var ANSWER_DELAY_MS = 5000;
  var BLINKEYES_CONFIDENCE_MIN = 0.65;
  var BLINKEYES_CHANCE = 0.55;

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
  var videoA = document.getElementById('mascotVideoA');
  var videoB = document.getElementById('mascotVideoB');
  var currentFront = 0;
  var videoNextEnded = null;

  function getFrontVideo() {
    return currentFront === 0 ? videoA : videoB;
  }

  function getBackVideo() {
    return currentFront === 0 ? videoB : videoA;
  }

  function swapFrontBack() {
    if (!videoA || !videoB) return;
    videoA.classList.toggle('front', currentFront === 0);
    videoA.classList.toggle('back', currentFront !== 0);
    videoB.classList.toggle('front', currentFront === 1);
    videoB.classList.toggle('back', currentFront !== 1);
  }

  function playVideo(src, loop, onEnded) {
    var front = getFrontVideo();
    var back = getBackVideo();
    if (!front || !back) return;

    front.pause();
    videoNextEnded = onEnded || null;

    back.loop = !!loop;
    back.onended = function () {
      if (videoNextEnded) {
        var fn = videoNextEnded;
        videoNextEnded = null;
        fn();
      }
    };

    var backSrc = (back.src || '').split('?')[0];
    if (backSrc && (backSrc === src || backSrc.indexOf(src) !== -1 || backSrc.endsWith(src))) {
      back.currentTime = 0;
      back.play().catch(function () {});
      currentFront = 1 - currentFront;
      swapFrontBack();
      return;
    }

    function onBackReady() {
      back.removeEventListener('canplay', onBackReady);
      back.removeEventListener('loadeddata', onBackReady);
      back.currentTime = 0;
      back.play().catch(function () {});
      currentFront = 1 - currentFront;
      swapFrontBack();
    }

    back.addEventListener('canplay', onBackReady);
    back.addEventListener('loadeddata', onBackReady);
    back.src = src;
    back.load();
  }

  function showWavehanding() {
    playVideo(VIDEO.wavehanding, true);
  }

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
    '以后 AI 会帮我们做更多事情，比如当小老师、当助手。',
    '计算机“看懂”图片，是靠学了几亿张图才学会的，叫“计算机视觉”。',
    '深度学习里有很多“神经元”连成网，一层层提取特征，最后才能认出画的是啥。',
    '同样的东西，你画简笔画、别人画写实，AI 都要能认出来，所以它学的是“概念”而不是死记硬背。',
    'AI 猜错的时候不是笨，是它还没见过这种画法，多画几次它就会更准。',
    '大模型能同时处理文字和图片，所以既能读题又能看图，像在做“多模态”任务。',
    '训练一个 AI 要用很多电和很多电脑一起算，所以 AI 是很多人一起努力才做出来的。',
    'AI 没有真正的“眼睛”，它看到的其实是很多很多数字，用数学算出最像什么。',
    '你画的每一笔都会变成像素，AI 就是根据这些像素的规律来猜的。',
    '世界上有很多种 AI：有的会下棋，有的会开车，有的会画画，咱们这个是会“看图说话”的。',
    'AI 会一直进步，以后说不定你随便涂几笔，它就能猜出你心里想画啥。'
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

  var pendingResult = null;
  var guessStartTime = 0;

  function applyPendingResult() {
    if (!pendingResult) return;
    var res = pendingResult;
    pendingResult = null;

    mainResult.textContent = res.label || '未知';
    var conf = res.confidence != null ? Math.round(res.confidence * 100) : 90;
    mainConf.textContent = conf > 0 ? '信心：' + conf + '%' : '';
    mainBar.style.width = Math.min(100, conf) + '%';
    emptyEl.style.display = 'none';
    if (mainBar.parentElement) mainBar.parentElement.style.display = 'none';
    listEl.innerHTML = (res.results || [res]).slice(0, 5).map(function (r, i) {
      var c = r.confidence != null ? Math.round(r.confidence * 100) : '';
      return '<div class="list-item"><span>' + (i + 1) + '. ' + (r.label || '') + '</span>' + (c ? '<span>' + c + '%</span>' : '') + '</div>';
    }).join('');

    showResultInBubble(res.label || '');

    var useBlinkeyes = (res.confidence >= BLINKEYES_CONFIDENCE_MIN) && (Math.random() < BLINKEYES_CHANCE);
    if (useBlinkeyes) {
      playVideo(VIDEO.blinkeyes, false, function () {
        showWavehanding();
      });
    } else {
      showWavehanding();
    }
  }

  function showResults(results) {
    if (!results || !results.length) return;
    var top = results[0];
    var conf = top.confidence != null ? top.confidence : 0.9;
    var label = top.label || '未知';
    pendingResult = { label: label, confidence: conf, results: results };

    var elapsed = Date.now() - guessStartTime;
    if (elapsed >= ANSWER_DELAY_MS) {
      applyPendingResult();
    } else {
      setTimeout(applyPendingResult, ANSWER_DELAY_MS - elapsed);
    }
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
    showWavehanding();
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
    showWavehanding();
  });

  guessBtn.addEventListener('click', function () {
    guessBtn.disabled = true;
    guessBtn.textContent = '猜呢...';
    statusText.textContent = 'AI 在想呢...';
    stopTipRotation();
    setSpeech('让我想想', false);
    guessStartTime = Date.now();

    playVideo(VIDEO.think, false, function () {
      if (!pendingResult) showWavehanding();
    });

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

  if (videoA) {
    videoA.src = VIDEO.wavehanding;
    videoA.loop = true;
    videoA.classList.add('front');
    videoA.classList.remove('back');
    if (videoB) {
      videoB.classList.add('back');
      videoB.classList.remove('front');
    }
    currentFront = 0;
    swapFrontBack();
    videoA.play().catch(function () {});
  }
})();
