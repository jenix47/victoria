(function () {
  /* ============================================================
     ДАНІ ТА СТАН
     ============================================================ */

  const NO_MESSAGES = ['Жіноче "Ні" - це все ж таки "Так"?))', 'Ще є шанс передумати)'];

  const LETTER_TEXT =
    'Вітаю, Вікторія! \n\n' +
    'Сподіваюся, це невеличке запрошення подарує Вам посмішку.\n\n' +
    'Ви мені дуже сподобалися, Ваша посмішка неймовірна, а у Ваших очах є шось особливе, що неможливо не помітити.  \n\n' +
    'Я хотів би запросити Вас на побачення, де Ми могли б познайомитися та по спілкуватися за приємною вечерею. \n\n' 
    


  const ENVELOPE_STEPS = [
    { delay: 0, className: 'envelope-premium--scale' },
    { delay: 400, className: 'envelope-premium--flap-open' },
    { delay: 950, className: 'envelope-premium--letter-slide' },
    { delay: 1850, className: 'envelope-premium--letter-lift' },
    { delay: 2450, className: 'envelope-premium--letter-unfold' },
    { delay: 3300, className: 'envelope-premium--done' },
  ];

  const state = { cuisine: null };

  let currentScreen = 'welcome';
  let noClickCount = 0;
  let notificationsRequested = false;
  let envelopeOpened = false;
  let typewriterRunning = false;
  let acceptedTimer = null;

  /* ============================================================
     DOM
     ============================================================ */

  const btnNo = document.getElementById('btn-no');
  const noMessage = document.getElementById('no-message');
  const confettiCanvas = document.getElementById('confetti');

  const welcomeStage = document.getElementById('welcome-stage');
  const envelope = document.getElementById('envelope');
  const btnOpenEnvelope = document.getElementById('btn-open-envelope');
  const letterTypewriter = document.getElementById('letter-typewriter');
  const btnLetterContinue = document.getElementById('btn-letter-continue');
  const letterSeal = document.getElementById('letter-seal');

  /* ============================================================
     НАВІГАЦІЯ МІЖ ЕКРАНАМИ
     ============================================================ */

  function showScreen(name) {
    const prev = document.querySelector(`[data-screen="${currentScreen}"]`);
    const next = document.querySelector(`[data-screen="${name}"]`);

    if (!next || name === currentScreen) return;

    if (acceptedTimer) {
      clearTimeout(acceptedTimer);
      acceptedTimer = null;
    }

    if (prev) {
      prev.classList.remove('screen--active');
      prev.classList.add('screen--leaving');
    }

    next.classList.add('screen--active');

    setTimeout(() => {
      if (prev) prev.classList.remove('screen--leaving');
    }, 450);

    currentScreen = name;

    if (name === 'accepted') {
      acceptedTimer = setTimeout(() => showScreen('cuisine'), 1200);
    }

    if (name === 'confirm') {
      launchConfetti();
      showGuestNotification();
      sendTelegramNotification('success');
    }
  }

  /* ============================================================
     КОНВЕРТ — КІНЕМАТОГРАФІЧНА АНІМАЦІЯ
     ============================================================ */

  function openEnvelope() {
    if (envelopeOpened || !envelope) return;
    envelopeOpened = true;

    btnOpenEnvelope?.classList.add('btn--open-envelope--hidden');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      envelope.classList.add('envelope-premium--done');
      welcomeStage?.classList.add('welcome-stage--letter-ready');
      startTypewriter();
      return;
    }

    ENVELOPE_STEPS.forEach(({ delay, className }) => {
      setTimeout(() => {
        envelope.classList.add(className);
        if (className === 'envelope-premium--done') {
          onEnvelopeAnimationComplete();
        }
      }, delay);
    });
  }

  function onEnvelopeAnimationComplete() {
    welcomeStage?.classList.add('welcome-stage--letter-ready');
    startTypewriter();
  }

  /* ============================================================
     ЛИСТ — ЕФЕКТ ДРUKАРСЬКОЇ МАШИНКИ
     ============================================================ */

  function startTypewriter() {
    if (typewriterRunning || !letterTypewriter) return;
    typewriterRunning = true;

    letterTypewriter.textContent = '';
    letterTypewriter.classList.add('letter-doc__body--typing');
    btnLetterContinue?.classList.remove('btn--letter-continue--visible');
    letterSeal?.classList.remove('letter-seal--stamped');

    let index = 0;

    function typeNextChar() {
      if (index >= LETTER_TEXT.length) {
        letterTypewriter.classList.remove('letter-doc__body--typing');
      
        const instagram = document.getElementById('instagram-link');
        if (instagram) {
          instagram.style.display = 'block';
        }
      
        showGoldSeal();
        showContinueButton();
        return;
      }

      letterTypewriter.textContent += LETTER_TEXT[index];
      index += 1;

      const char = LETTER_TEXT[index - 1];
      const pause = char === '\n' ? 120 : char === '.' || char === ',' ? 55 : 22;
      setTimeout(typeNextChar, pause);
    }

    setTimeout(typeNextChar, 400);
  }

  function showGoldSeal() {
    letterSeal?.classList.add('letter-seal--stamped');
    letterSeal?.setAttribute('aria-hidden', 'false');
  }

  function showContinueButton() {
    btnLetterContinue?.classList.add('btn--letter-continue--visible');
  }

  /* ============================================================
     СПОВІЩЕННЯ
     ============================================================ */

  async function requestNotificationPermission() {
    if (notificationsRequested || !('Notification' in window)) return;
    notificationsRequested = true;
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {
        /* ignore */
      }
    }
  }

  function showGuestNotification() {
    const body = `Кухня: ${state.cuisine || '—'}. Час та місце узгодимо окремо.`;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Чудово!', {
          body,
          icon: '/favicon.ico',
          tag: 'date-confirmed',
        });
      } catch (_) {
        /* ignore */
      }
    }

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  function sendTelegramNotification(type) {
    const { botToken, chatId } = window.APP_CONFIG?.telegram || {};
    if (!botToken || !chatId) return;

    let text = '';

    if (type === 'decline') {
      text = '💔 Вікторія відмовилась від побачення.';
    } else if (type === 'success') {
      text = [
        '💕 Вікторія погодилась на побачення!',
        '',
        `🍽 Кухня: ${state.cuisine || '—'}`,
        '📍 Час та місце: узгодимо в особистій переписці',
      ].join('\n');
    } else {
      return;
    }

    let sink = document.getElementById('telegram-sink');
    if (!sink) {
      sink = document.createElement('iframe');
      sink.id = 'telegram-sink';
      sink.name = 'telegram-sink';
      sink.hidden = true;
      sink.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sink);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `https://api.telegram.org/bot${botToken}/sendMessage`;
    form.target = 'telegram-sink';
    form.style.display = 'none';

    const chatIdField = document.createElement('input');
    chatIdField.type = 'hidden';
    chatIdField.name = 'chat_id';
    chatIdField.value = chatId;
    form.appendChild(chatIdField);

    const textField = document.createElement('input');
    textField.type = 'hidden';
    textField.name = 'text';
    textField.value = text;
    form.appendChild(textField);

    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  /* ============================================================
     ПОДІЇ
     ============================================================ */

  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      requestNotificationPermission();
      showScreen(btn.dataset.next);
    });
  });

  btnOpenEnvelope?.addEventListener('click', (e) => {
    e.preventDefault();
  
    const recipient = document.querySelector('.envelope-premium__recipient');
if (recipient) {
  recipient.style.display = 'none';
}
  
    openEnvelope();
  });
  btnLetterContinue?.addEventListener('click', (e) => {
    e.preventDefault();
    requestNotificationPermission();
    showScreen('question');
  });

  btnNo?.addEventListener('click', () => {
    requestNotificationPermission();

    if (noClickCount < NO_MESSAGES.length) {
      noMessage.textContent = NO_MESSAGES[noClickCount];
      noClickCount += 1;
      return;
    }

    sendTelegramNotification('decline');
    showScreen('decline');
  });

  document.getElementById('cuisine-options')?.addEventListener('click', (e) => {
    const card = e.target.closest('.option-card');
    if (!card) return;

    state.cuisine = card.dataset.value;
    e.currentTarget.querySelectorAll('.option-card').forEach((c) => {
      c.classList.toggle('option-card--selected', c === card);
    });

    setTimeout(() => showScreen('confirm'), 350);
  });

  /* ============================================================
     ДЕКОР — ЧАСТИНКИ ТА КОНФЕТТІ
     ============================================================ */

  function createParticles() {
    const container = document.querySelector('.particles');
    if (!container) return;

    for (let i = 0; i < 14; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      const size = 4 + Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 8}s`;
      particle.style.animationDuration = `${6 + Math.random() * 6}s`;
      container.appendChild(particle);
    }
  }

  function launchConfetti() {
    if (!confettiCanvas) return;

    const ctx = confettiCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = confettiCanvas.parentElement.getBoundingClientRect();

    confettiCanvas.width = rect.width * dpr;
    confettiCanvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#c9a962', '#e8dcc8', '#f5f0e8', '#a02828', '#ffffff'];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * rect.width,
      y: -10 - Math.random() * rect.height * 0.3,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      speedY: 1.5 + Math.random() * 2.5,
      speedX: -1 + Math.random() * 2,
      spin: -4 + Math.random() * 8,
      opacity: 0.7 + Math.random() * 0.3,
    }));

    let frame = 0;
    const maxFrames = 180;

    function draw() {
      ctx.clearRect(0, 0, rect.width, rect.height);
      pieces.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.spin;
        p.speedY += 0.04;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity * (1 - frame / maxFrames);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frame += 1;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      }
    }

    draw();
  }

  createParticles();
})();
