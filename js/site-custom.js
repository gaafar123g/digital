(function () {
  "use strict";

  /* ---------------------------------------------------------
     Language toggle (Arabic default / English)
  --------------------------------------------------------- */
  var langBtn = document.getElementById('lang-toggle');
  var htmlEl = document.documentElement;
  var bodyEl = document.body;

  function applyEnglish() {
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.dataset.arOrig) {
        el.dataset.arOrig = el.textContent;
      }
      el.textContent = el.dataset.en;
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
      if (!el.dataset.arPlaceholder) {
        el.dataset.arPlaceholder = el.getAttribute('placeholder') || '';
      }
      el.setAttribute('placeholder', el.dataset.enPlaceholder);
    });
    htmlEl.setAttribute('lang', 'en');
    htmlEl.setAttribute('dir', 'ltr');
    bodyEl.classList.add('lang-en');
    if (langBtn) langBtn.textContent = 'AR';
  }

  function applyArabic() {
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.dataset.arOrig !== undefined) {
        el.textContent = el.dataset.arOrig;
      }
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
      if (el.dataset.arPlaceholder !== undefined) {
        el.setAttribute('placeholder', el.dataset.arPlaceholder);
      }
    });
    htmlEl.setAttribute('lang', 'ar');
    htmlEl.setAttribute('dir', 'rtl');
    bodyEl.classList.remove('lang-en');
    if (langBtn) langBtn.textContent = 'EN';
  }

  function setLanguage(lang) {
    if (lang === 'en') {
      applyEnglish();
    } else {
      applyArabic();
    }
    try { localStorage.setItem('site-lang', lang); } catch (e) { /* ignore */ }
  }

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      var current = bodyEl.classList.contains('lang-en') ? 'en' : 'ar';
      setLanguage(current === 'en' ? 'ar' : 'en');
    });
  }

  // Restore saved preference (defaults to Arabic if nothing saved)
  try {
    var saved = localStorage.getItem('site-lang');
    if (saved === 'en') {
      setLanguage('en');
    }
  } catch (e) { /* ignore */ }

  /* ---------------------------------------------------------
     Contact form -> WhatsApp
  --------------------------------------------------------- */
  var WHATSAPP_NUMBER = '966547727535'; // international format, no leading +

  var waForm = document.getElementById('waContactForm');
  if (waForm) {
    waForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('waName');
      var phone = document.getElementById('waPhone');
      var service = document.getElementById('waService');
      var message = document.getElementById('waMessage');

      var isEnglish = bodyEl.classList.contains('lang-en');
      var valid = true;

      [name, phone, service].forEach(function (field) {
        field.classList.remove('wa-invalid');
        if (!field.value || !field.value.trim()) {
          field.classList.add('wa-invalid');
          valid = false;
        }
      });

      if (!valid) {
        var firstInvalid = waForm.querySelector('.wa-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var lines = isEnglish ? [
        'Hello Digital Marketing Pro 👋',
        'Name: ' + name.value.trim(),
        'Phone: ' + phone.value.trim(),
        'Service needed: ' + (service.options[service.selectedIndex].text),
        message.value.trim() ? ('Message: ' + message.value.trim()) : ''
      ] : [
        'مرحباً ديجيتال ماركيتينج برو 👋',
        'الاسم: ' + name.value.trim(),
        'رقم الجوال: ' + phone.value.trim(),
        'الخدمة المطلوبة: ' + (service.options[service.selectedIndex].text),
        message.value.trim() ? ('الرسالة: ' + message.value.trim()) : ''
      ];

      var text = lines.filter(Boolean).join('\n');
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
      waForm.reset();
    });

    // Clear invalid state as the user types/selects
    waForm.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () {
        field.classList.remove('wa-invalid');
      });
      field.addEventListener('change', function () {
        field.classList.remove('wa-invalid');
      });
    });
  }
})();
