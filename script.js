/* ==========================================================================
   OUR KITCHEN — script.js
   Handles: sticky header shadow, mobile nav toggle, scroll reveal,
            menu category tabs, contact form submission with WhatsApp.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal animation ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: show everything immediately
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Menu page: category tab navigation ---------- */
  var tabs = document.querySelectorAll('.menu-tab');
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetId = tab.getAttribute('data-target');
        var targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Update active tab
          tabs.forEach(function (t) { t.classList.remove('is-active'); });
          tab.classList.add('is-active');

          // Scroll to section
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Update active tab based on scroll position
    window.addEventListener('scroll', function () {
      var scrollPosition = window.scrollY + 100;

      document.querySelectorAll('.menu-category').forEach(function (category) {
        var categoryTop = category.offsetTop;
        var categoryBottom = categoryTop + category.offsetHeight;

        if (scrollPosition >= categoryTop && scrollPosition < categoryBottom) {
          var categoryId = category.id;
          tabs.forEach(function (t) { t.classList.remove('is-active'); });
          document.querySelector('[data-target="' + categoryId + '"]').classList.add('is-active');
        }
      });
    }, { passive: true });
  }

  /* ---------- Daily Meal: highlight today's featured meal from Google Sheet CSV ---------- */
  (function () {
    var DAILY_MEAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrLVjEq8sNPChC5MA1z_p8qjthZs8Ruk7DF33g3EEOkQ1N3MzAZIl-7uEnHRcGwaEvpmVahUnsEClw/pub?output=csv';

    var dailyMealSection = document.getElementById('daily-meal');
    if (!dailyMealSection) return; // Not on the menu page

    var dailyMealGrid = document.getElementById('dailyMealGrid');

    fetch(DAILY_MEAL_CSV_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(function (csvText) {
        // The sheet contains one featured meal ID per row.
        var featuredIds = csvText
          .split(/\r?\n/)
          .map(function (line) { return line.replace(/"/g, '').trim(); })
          .filter(function (line) { return line.length > 0; });

        var allCards = dailyMealSection.querySelectorAll('.meal-card[data-daily-id]');
        var anyFeatured = false;
        allCards.forEach(function (card) {
          var isFeatured = featuredIds.indexOf(card.getAttribute('data-daily-id')) !== -1;
          card.classList.toggle('is-hidden', !isFeatured);
          card.classList.toggle('is-todays-special', isFeatured);
          if (isFeatured) anyFeatured = true;
        });

        if (!anyFeatured) {
          var emptyMsg = document.createElement('p');
          emptyMsg.className = 'daily-meal-empty';
          emptyMsg.textContent = 'No daily meal is featured right now — check back soon!';
          dailyMealGrid.insertAdjacentElement('afterend', emptyMsg);
        }
      })
      .catch(function (err) {
        console.warn('Daily Meal: could not load featured meal from sheet.', err);
        // Fail open: if the sheet can't be reached, show all daily meals rather than none.
        dailyMealSection.querySelectorAll('.meal-card[data-daily-id]').forEach(function (card) {
          card.classList.remove('is-hidden');
        });
      })
      .finally(function () {
        if (dailyMealGrid) dailyMealGrid.classList.remove('is-loading');
      });
  })();

  /* ---------- Home page: "Today's Special" badge list + Daily Meals grid from Google Sheet CSV ---------- */
  (function () {
    var DAILY_MEAL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrLVjEq8sNPChC5MA1z_p8qjthZs8Ruk7DF33g3EEOkQ1N3MzAZIl-7uEnHRcGwaEvpmVahUnsEClw/pub?output=csv';

    // Keep this in sync with the data-daily-id values on menu.html
    var DAILY_MEAL_NAMES = {
      '1': "Bacha w 3asekro",
      '2': "Chicken Alfredo",
      '3': "Kousa w Warae 3arich",
      '4': "Loubiye Bi Zeit",
      '5': "Siyadiye"
    };

    var listEl = document.getElementById('todaysSpecialList');
    var homeGrid = document.getElementById('homeDailyMealGrid');
    if (!listEl && !homeGrid) return; // Not on the home page

    fetch(DAILY_MEAL_CSV_URL, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(function (csvText) {
        var featuredIds = csvText
          .split(/\r?\n/)
          .map(function (line) { return line.replace(/"/g, '').trim(); })
          .filter(function (line) { return line.length > 0; });

        // --- Update the "Today's Special" badge list ---
        if (listEl) {
          var names = featuredIds
            .map(function (id) { return DAILY_MEAL_NAMES[id]; })
            .filter(Boolean);

          listEl.innerHTML = '';
          if (!names.length) {
            var emptyLi = document.createElement('li');
            emptyLi.textContent = 'Check back soon!';
            listEl.appendChild(emptyLi);
          } else {
            names.forEach(function (name) {
              var li = document.createElement('li');
              li.textContent = name;
              listEl.appendChild(li);
            });
          }
        }

        // --- Update the "Today's Daily Meals" card grid ---
        if (homeGrid) {
          var allCards = homeGrid.querySelectorAll('.meal-card[data-daily-id]');
          var anyFeatured = false;
          allCards.forEach(function (card) {
            var isFeatured = featuredIds.indexOf(card.getAttribute('data-daily-id')) !== -1;
            card.classList.toggle('is-hidden', !isFeatured);
            if (isFeatured) anyFeatured = true;
          });

          if (!anyFeatured) {
            var emptyMsg = document.createElement('p');
            emptyMsg.className = 'daily-meal-empty';
            emptyMsg.textContent = 'No daily meal is featured right now — check back soon!';
            homeGrid.insertAdjacentElement('afterend', emptyMsg);
          }
        }
      })
      .catch(function (err) {
        console.warn("Today's Special: could not load featured meals.", err);
        // Fail open on the grid: if the sheet can't be reached, show all cards rather than none.
        if (homeGrid) {
          homeGrid.querySelectorAll('.meal-card[data-daily-id]').forEach(function (card) {
            card.classList.remove('is-hidden');
          });
        }
      })
      .finally(function () {
        if (homeGrid) homeGrid.classList.remove('is-loading');
      });
  })();

  /* ---------- Contact form: Dynamic Validation & WhatsApp Submission ---------- */
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    var emailInput = document.getElementById('email');
    var phoneInput = document.getElementById('phone');

    // Toggle required status between email and phone
    function toggleContactRequired() {
      if (!emailInput || !phoneInput) return;
      var hasEmail = emailInput.value.trim() !== '';
      var hasPhone = phoneInput.value.trim() !== '';

      if (hasEmail) {
        phoneInput.removeAttribute('required');
        emailInput.setAttribute('required', '');
      } else if (hasPhone) {
        emailInput.removeAttribute('required', '');
        phoneInput.setAttribute('required', '');
      } else {
        emailInput.setAttribute('required', '');
        phoneInput.setAttribute('required', '');
      }
    }

    if (emailInput && phoneInput) {
      emailInput.addEventListener('input', toggleContactRequired);
      phoneInput.addEventListener('input', toggleContactRequired);
    }

    // Form Submission to WhatsApp
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Find the name field explicitly inside contactForm by name attribute or ID
      var nameEl = contactForm.querySelector('[name="name"]') || contactForm.querySelector('#name') || document.getElementById('name');
      var nameVal = nameEl ? nameEl.value.trim() : '';

      // Hard check for required name
      if (!nameVal) {
        alert('Please enter your name.');
        if (nameEl) nameEl.focus();
        return;
      }

      var targetPhoneNumber = '96181275199'; 

      // Read values directly from form fields at the moment of submit
      var eventTypeEl = contactForm.querySelector('[name="eventType"]') || document.getElementById('eventType');
      var eventDateEl = contactForm.querySelector('[name="eventDate"]') || document.getElementById('eventDate');
      var guestsEl = contactForm.querySelector('[name="guests"]') || document.getElementById('guests');

      var eventType = eventTypeEl ? eventTypeEl.value : '';
      var eventDate = eventDateEl ? eventDateEl.value : '';
      var guests = guestsEl ? guestsEl.value : '';
      var email = (emailInput && emailInput.value.trim()) ? emailInput.value.trim() : 'Not provided';
      var phone = (phoneInput && phoneInput.value.trim()) ? phoneInput.value.trim() : 'Not provided';

      // Format WhatsApp message
      var message = `Hello! I would like to book/inquire about an event.\n\n` +
                    `*Name:* ${nameVal}\n` +
                    `*Event Type:* ${eventType}\n` +
                    `*Event Date:* ${eventDate}\n` +
                    `*Number of Guests:* ${guests}\n` +
                    `*Email:* ${email}\n` +
                    `*Phone:* ${phone}`;

      var encodedMessage = encodeURIComponent(message);
      var whatsappUrl = `https://wa.me/${targetPhoneNumber}?text=${encodedMessage}`;

      // Open WhatsApp link
      window.open(whatsappUrl, '_blank');

      if (formSuccess) {
        formSuccess.classList.add('is-visible');
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Reset form ONLY AFTER message string has been created
      contactForm.reset();
      toggleContactRequired();
    });
  }

  /* ==========================================================================
     ORDERING CART
     Handles: opening an item's customization modal, building the cart,
     editing/removing lines, and sending the final order to WhatsApp.
     ========================================================================== */
  (function () {
    var WHATSAPP_NUMBER = '96181275199'; // +961 81 275 199
    var STORAGE_KEY = 'ourKitchenCart';
    var CUSTOMER_KEY = 'ourKitchenCustomer';

    /* ---------- Toast notification ---------- */
    function showToast(message) {
      var existingToast = document.getElementById('toastNotification');
      if (existingToast) {
        existingToast.remove();
        clearTimeout(existingToast._timeout);
      }

      var toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      toast.textContent = message;
      document.body.appendChild(toast);

      // Trigger animation
      setTimeout(function () {
        toast.classList.add('is-visible');
      }, 10);

      var timeoutId = setTimeout(function () {
        toast.classList.remove('is-visible');
        setTimeout(function () {
          if (toast.parentNode) toast.remove();
        }, 300);
      }, 3000);

      toast._timeout = timeoutId;

      // Dismiss on click
      toast.addEventListener('click', function () {
        clearTimeout(timeoutId);
        toast.classList.remove('is-visible');
        setTimeout(function () {
          if (toast.parentNode) toast.remove();
        }, 300);
      });
    }

    var orderableCards = document.querySelectorAll('.meal-card.is-orderable');
    if (!orderableCards.length) return; // Not on a page with menu cards

    var itemModalOverlay = document.getElementById('itemModalOverlay');
    var itemModalTitle = document.getElementById('itemModalTitle');
    var itemModalUnitPrice = document.getElementById('itemModalUnitPrice');
    var itemQtyValue = document.getElementById('itemQtyValue');
    var itemQtyMinus = document.getElementById('itemQtyMinus');
    var itemQtyPlus = document.getElementById('itemQtyPlus');
    var itemAddonsField = document.getElementById('itemAddonsField');
    var itemAddonsList = document.getElementById('itemAddonsList');
    var itemNoteInput = document.getElementById('itemNoteInput');
    var itemModalTotal = document.getElementById('itemModalTotal');
    var itemModalCancel = document.getElementById('itemModalCancel');
    var itemModalAdd = document.getElementById('itemModalAdd');
    var itemModalClose = document.getElementById('itemModalClose');

    var cartFab = document.getElementById('cartFab');
    var cartFabCount = document.getElementById('cartFabCount');
    var cartModalOverlay = document.getElementById('cartModalOverlay');
    var cartModalClose = document.getElementById('cartModalClose');
    var cartItemsList = document.getElementById('cartItemsList');
    var cartEmptyState = document.getElementById('cartEmptyState');
    var cartListActions = document.getElementById('cartListActions');
    var cartClearAll = document.getElementById('cartClearAll');
    var cartTotalAmount = document.getElementById('cartTotalAmount');
    var cartValidationNote = document.getElementById('cartValidationNote');
    var cartWhatsappBtn = document.getElementById('cartWhatsappBtn');
    var cartItemTemplate = document.getElementById('cartItemTemplate');

    var custName = document.getElementById('custName');
    var custPhone = document.getElementById('custPhone');
    var custLocation = document.getElementById('custLocation');
    var custDate = document.getElementById('custDate');
    var custTime = document.getElementById('custTime');

    var cart = []; // { uid, id, name, basePrice, addons:[{name,price,checked}], qty, note }
    var currentDraft = null; // holds the item currently being customized in the item modal

    /* ---------- helpers ---------- */
    function formatLL(amount) {
      var rounded = Math.round(amount);
      return rounded.toLocaleString('en-US') + ' L.L.';
    }

    function uid() {
      return 'c' + Date.now() + Math.floor(Math.random() * 1000);
    }

    function lineTotal(item) {
      var addonsTotal = 0;
      item.addons.forEach(function (a) { if (a.checked) addonsTotal += a.price; });
      return (item.basePrice + addonsTotal) * item.qty;
    }

    function cartTotal() {
      return cart.reduce(function (sum, item) { return sum + lineTotal(item); }, 0);
    }

    function saveCart() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
    }

    function loadCart() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) cart = JSON.parse(raw) || [];
      } catch (e) { cart = []; }
    }

    function saveCustomer() {
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
          name: custName.value, phone: custPhone.value,
          location: custLocation.value, date: custDate.value, time: custTime.value
        }));
      } catch (e) {}
    }

    function loadCustomer() {
      var todayStr = new Date().toISOString().slice(0, 10);
      custDate.value = todayStr;
      try {
        var raw = localStorage.getItem(CUSTOMER_KEY);
        if (raw) {
          var data = JSON.parse(raw);
          custName.value = data.name || '';
          custPhone.value = data.phone || '';
          custLocation.value = data.location || '';
          custDate.value = data.date || todayStr;
          custTime.value = data.time || '';
        }
      } catch (e) {}
    }

    function updateFabCount() {
      var totalQty = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
      cartFabCount.textContent = totalQty;
      cartFabCount.classList.toggle('is-empty', totalQty === 0);
    }

    /* ---------- ITEM MODAL ---------- */
    function openItemModal(card) {
      var addons = [];
      try { addons = JSON.parse(card.getAttribute('data-addons') || '[]'); } catch (e) { addons = []; }

      var imgElement = card.querySelector('.thumb img');
      var imageUrl = imgElement ? imgElement.getAttribute('src') : '';

      currentDraft = {
        uid: uid(),
        id: card.getAttribute('data-id'),
        name: card.querySelector('h3').textContent.trim(),
        basePrice: parseFloat(card.getAttribute('data-price')) || 0,
        addons: addons.map(function (a) { return { name: a.name, price: a.price, checked: false }; }),
        qty: 1,
        note: '',
        image: imageUrl
      };

      itemModalTitle.textContent = currentDraft.name;
      itemModalUnitPrice.textContent = formatLL(currentDraft.basePrice);
      itemQtyValue.textContent = '1';
      itemNoteInput.value = '';

      if (currentDraft.addons.length) {
        itemAddonsField.hidden = false;
        itemAddonsList.innerHTML = '';
        currentDraft.addons.forEach(function (addon, idx) {
          var label = document.createElement('label');
          label.className = 'addon-option';
          label.innerHTML =
            '<span class="addon-option-label"><input type="checkbox" data-addon-idx="' + idx + '"> ' + addon.name + '</span>' +
            '<span class="addon-option-price">+' + formatLL(addon.price) + '</span>';
          itemAddonsList.appendChild(label);
        });
      } else {
        itemAddonsField.hidden = true;
        itemAddonsList.innerHTML = '';
      }

      updateItemModalTotal();
      itemModalOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeItemModal() {
      itemModalOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
      currentDraft = null;
    }

    function updateItemModalTotal() {
      if (!currentDraft) return;
      itemModalTotal.textContent = formatLL(lineTotal(currentDraft));
    }

    itemQtyMinus.addEventListener('click', function () {
      if (!currentDraft || currentDraft.qty <= 1) return;
      currentDraft.qty -= 1;
      itemQtyValue.textContent = currentDraft.qty;
      updateItemModalTotal();
    });
    itemQtyPlus.addEventListener('click', function () {
      if (!currentDraft) return;
      currentDraft.qty += 1;
      itemQtyValue.textContent = currentDraft.qty;
      updateItemModalTotal();
    });

    itemAddonsList.addEventListener('change', function (e) {
      if (!currentDraft || e.target.tagName !== 'INPUT') return;
      var idx = parseInt(e.target.getAttribute('data-addon-idx'), 10);
      currentDraft.addons[idx].checked = e.target.checked;
      e.target.closest('.addon-option').classList.toggle('is-checked', e.target.checked);
      updateItemModalTotal();
    });

    orderableCards.forEach(function (card) {
      card.addEventListener('click', function () { openItemModal(card); });
    });

    itemModalCancel.addEventListener('click', closeItemModal);
    itemModalClose.addEventListener('click', closeItemModal);
    itemModalOverlay.addEventListener('click', function (e) {
      if (e.target === itemModalOverlay) closeItemModal();
    });

    itemModalAdd.addEventListener('click', function () {
      if (!currentDraft) return;
      currentDraft.note = itemNoteInput.value.trim();
      var itemName = currentDraft.name;
      cart.push(currentDraft);
      saveCart();
      updateFabCount();
      closeItemModal();
      renderCartItems();
      showToast('✓ ' + itemName + ' added to cart');
    });

    /* ---------- CART MODAL ---------- */
    function renderCartItems() {
      cartItemsList.innerHTML = '';

      var isEmpty = cart.length === 0;
      cartEmptyState.classList.toggle('is-visible', isEmpty);
      cartListActions.classList.toggle('is-hidden', isEmpty);

      cart.forEach(function (item) {
        var node = cartItemTemplate.content.firstElementChild.cloneNode(true);
        node.setAttribute('data-uid', item.uid);
        
        // Set image
        var imgEl = node.querySelector('.cart-item-image');
        if (item.image) {
          imgEl.setAttribute('src', item.image);
        }
        
        node.querySelector('.cart-item-name').textContent = item.name;
        node.querySelector('.cart-qty-value').textContent = item.qty;
        node.querySelector('.cart-item-price').textContent = formatLL(lineTotal(item));
        node.querySelector('.cart-item-note').value = item.note || '';

        var addonsWrap = node.querySelector('.cart-item-addons');
        if (item.addons.length) {
          addonsWrap.hidden = false;
          item.addons.forEach(function (addon, idx) {
            var label = document.createElement('label');
            label.className = 'addon-option' + (addon.checked ? ' is-checked' : '');
            label.innerHTML =
              '<span class="addon-option-label"><input type="checkbox" data-addon-idx="' + idx + '" ' + (addon.checked ? 'checked' : '') + '> ' + addon.name + '</span>' +
              '<span class="addon-option-price">+' + formatLL(addon.price) + '</span>';
            addonsWrap.appendChild(label);
          });
        } else {
          addonsWrap.hidden = true;
        }

        cartItemsList.appendChild(node);
      });

      updateCartTotal();
    }

    function updateCartTotal() {
      cartTotalAmount.textContent = formatLL(cartTotal());
      updateFabCount();
    }

    function findCartItem(uidValue) {
      for (var i = 0; i < cart.length; i++) { if (cart[i].uid === uidValue) return cart[i]; }
      return null;
    }

    cartItemsList.addEventListener('click', function (e) {
      var itemEl = e.target.closest('.cart-item');
      if (!itemEl) return;
      var itemUid = itemEl.getAttribute('data-uid');
      var item = findCartItem(itemUid);
      if (!item) return;

      if (e.target.closest('.cart-qty-plus')) {
        item.qty += 1;
        itemEl.querySelector('.cart-qty-value').textContent = item.qty;
        itemEl.querySelector('.cart-item-price').textContent = formatLL(lineTotal(item));
        saveCart(); updateCartTotal();
      } else if (e.target.closest('.cart-qty-minus')) {
        if (item.qty <= 1) return;
        item.qty -= 1;
        itemEl.querySelector('.cart-qty-value').textContent = item.qty;
        itemEl.querySelector('.cart-item-price').textContent = formatLL(lineTotal(item));
        saveCart(); updateCartTotal();
      } else if (e.target.closest('.cart-item-delete')) {
        cart = cart.filter(function (c) { return c.uid !== itemUid; });
        saveCart();
        renderCartItems();
      } else if (e.target.closest('.cart-item-toggle')) {
        var detailsEl = itemEl.querySelector('.cart-item-details');
        var isHidden = detailsEl.hasAttribute('hidden');
        if (isHidden) {
          detailsEl.removeAttribute('hidden');
          e.target.closest('.cart-item-toggle').classList.add('is-open');
        } else {
          detailsEl.setAttribute('hidden', '');
          e.target.closest('.cart-item-toggle').classList.remove('is-open');
        }
      }
    });

    cartItemsList.addEventListener('change', function (e) {
      var itemEl = e.target.closest('.cart-item');
      if (!itemEl) return;
      var itemUid = itemEl.getAttribute('data-uid');
      var item = findCartItem(itemUid);
      if (!item) return;

      if (e.target.classList.contains('cart-item-note')) {
        item.note = e.target.value.trim();
        saveCart();
      } else if (e.target.hasAttribute('data-addon-idx')) {
        var idx = parseInt(e.target.getAttribute('data-addon-idx'), 10);
        item.addons[idx].checked = e.target.checked;
        e.target.closest('.addon-option').classList.toggle('is-checked', e.target.checked);
        itemEl.querySelector('.cart-item-price').textContent = formatLL(lineTotal(item));
        saveCart(); updateCartTotal();
      }
    });

    cartClearAll.addEventListener('click', function () {
      if (!cart.length) return;
      if (window.confirm('Remove all items from your order?')) {
        cart = [];
        saveCart();
        renderCartItems();
      }
    });

    function openCartModal() {
      renderCartItems();
      cartModalOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeCartModal() {
      cartModalOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    cartFab.addEventListener('click', openCartModal);
    cartModalClose.addEventListener('click', closeCartModal);
    cartModalOverlay.addEventListener('click', function (e) {
      if (e.target === cartModalOverlay) closeCartModal();
    });

    [custName, custPhone, custLocation, custDate, custTime].forEach(function (field) {
      field.addEventListener('input', function () {
        saveCustomer();
        cartValidationNote.textContent = '';
      });
    });

    /* ---------- WHATSAPP ORDER ---------- */
    function formatDateForMessage(dateStr) {
      if (!dateStr) return '';
      var parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function formatTimeForMessage(timeStr) {
      if (!timeStr) return '';
      var bits = timeStr.split(':');
      var h = parseInt(bits[0], 10);
      var m = bits[1];
      var suffix = h >= 12 ? 'PM' : 'AM';
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      return h12 + ':' + m + ' ' + suffix;
    }

    function buildOrderMessage() {
      var lines = [];
      lines.push('*New Order — Our Kitchen by Chef Sleiman*');
      lines.push('');
      lines.push('*Name:* ' + custName.value.trim());
      lines.push('*Phone:* ' + custPhone.value.trim());
      lines.push('*Location:* ' + custLocation.value.trim());
      lines.push('*Date:* ' + formatDateForMessage(custDate.value));
      lines.push('*Time:* ' + formatTimeForMessage(custTime.value));
      lines.push('');
      lines.push('*Order Details:*');

      cart.forEach(function (item, index) {
        var addonsChecked = item.addons.filter(function (a) { return a.checked; });
        lines.push((index + 1) + '. *' + item.name + '* x' + item.qty + ' — ' + formatLL(lineTotal(item)));
        if (addonsChecked.length) {
          lines.push('   *Add-ons:* ' + addonsChecked.map(function (a) { return a.name + ' (+' + formatLL(a.price) + ')'; }).join(', '));
        }
        if (item.note) {
          lines.push('   *Note:* ' + item.note);
        }
      });

      lines.push('');
      lines.push('*Estimated Total: ' + formatLL(cartTotal()) + '*');

      return lines.join('\n');
    }

    function validateOrder() {
      if (!cart.length) return 'Your cart is empty — add items first.';
      if (!custName.value.trim() || !custPhone.value.trim() || !custLocation.value.trim() || !custDate.value || !custTime.value) {
        return 'All fields should be entered';
      }
      return '';
    }

    cartWhatsappBtn.addEventListener('click', function () {
      var error = validateOrder();
      if (error) {
        cartValidationNote.textContent = error;
        return;
      }
      cartValidationNote.textContent = '';
      var message = buildOrderMessage();
      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      window.open(url, '_blank');
      
      // Reset cart and form after order
      cart = [];
      saveCart();
      custName.value = '';
      custPhone.value = '';
      custLocation.value = '';
      custDate.value = '';
      custTime.value = '';
      saveCustomer();
      renderCartItems();
      updateFabCount();
      closeCartModal();
    });

    /* ---------- init ---------- */
    loadCart();
    loadCustomer();
    updateFabCount();
  })();

});

/* =========================================================
   CATERING PAGE — WhatsApp Form Logic with Inline Validation
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  var ctaForm = document.getElementById('ctaForm');
  var genericBtn = document.getElementById('cateringWhatsappBtn');
  
  // Only run if catering elements exist on the current page
  if (!ctaForm && !genericBtn) return;

  var WHATSAPP_NUMBER = '96103445329'; 

  var REQUIRED_FIELDS = [
    { id: 'ctaName',     label: 'Your Name' },
    { id: 'ctaGuests',   label: 'Number of Guests' },
    { id: 'ctaEvent',    label: 'Event Type' },
    { id: 'ctaDate',     label: 'Event Date' },
    { id: 'ctaLocation', label: 'Event Location / Area' }
  ];

  function buildCateringMessage() {
    var name     = (document.getElementById('ctaName')     || {}).value || '';
    var guests   = (document.getElementById('ctaGuests')   || {}).value || '';
    var event    = (document.getElementById('ctaEvent')    || {}).value || '';
    var date     = (document.getElementById('ctaDate')     || {}).value || '';
    var location = (document.getElementById('ctaLocation') || {}).value || '';
    var note     = (document.getElementById('ctaNote')     || {}).value || '';

    var addons = [];
    document.querySelectorAll('.cta-addon-check input:checked').forEach(function (cb) {
      addons.push(cb.value);
    });

    var lines = [];
    lines.push('Hello! I\'d like to inquire about catering services from Our Kitchen by Chef Sleiman.');
    lines.push('');
    if (name)     lines.push('*Name:* ' + name.trim());
    if (event)    lines.push('*Event Type:* ' + event);
    if (guests)   lines.push('*Number of Guests:* ' + guests);
    if (date) {
      var parts = date.split('-');
      var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      lines.push('*Event Date:* ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
    if (location) lines.push('*Location:* ' + location.trim());
    if (addons.length) lines.push('*Add-ons Requested:* ' + addons.join(', '));
    if (note)     lines.push('*Additional Notes:* ' + note.trim());
    lines.push('');
    lines.push('Could you please provide more details and a custom quote? Thank you!');

    return lines.join('\n');
  }

  function openWhatsApp(message) {
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message), '_blank');
  }

  function clearFieldError(field) {
    field.classList.remove('input-error');
  }

  function hideErrorBox() {
    var errorBox = document.getElementById('ctaFormError');
    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.innerHTML = '';
    }
  }

  function validateCateringForm() {
    var firstInvalid = null;
    var missing = [];

    REQUIRED_FIELDS.forEach(function (f) {
      var field = document.getElementById(f.id);
      if (!field) return;
      clearFieldError(field);
      if (!field.value || !field.value.trim()) {
        missing.push(f.label);
        field.classList.add('input-error');
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (missing.length) {
      var errorBox = document.getElementById('ctaFormError');
      if (errorBox) {
        errorBox.innerHTML = '<strong>Please complete the required fields!</strong>';
        errorBox.style.display = 'block';
      }

      if (ctaForm) {
        ctaForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (firstInvalid) {
        setTimeout(function() { firstInvalid.focus(); }, 400);
      }
      return false;
    }

    hideErrorBox();
    return true;
  }

  function resetCateringForm() {
    REQUIRED_FIELDS.forEach(function (f) {
      var field = document.getElementById(f.id);
      if (field) {
        field.value = '';
        clearFieldError(field);
      }
    });

    var note = document.getElementById('ctaNote');
    if (note) note.value = '';

    document.querySelectorAll('.cta-addon-check input:checked').forEach(function (cb) {
      cb.checked = false;
    });

    hideErrorBox();
  }

  // Clear visual errors inline as the user types/selects
  REQUIRED_FIELDS.forEach(function (f) {
    var field = document.getElementById(f.id);
    if (field) {
      field.addEventListener('input', function () { 
        clearFieldError(field);
        hideErrorBox();
      });
      field.addEventListener('change', function () { 
        clearFieldError(field);
        hideErrorBox();
      });
    }
  });

  // Generic button
  if (genericBtn) {
    genericBtn.addEventListener('click', function () {
      openWhatsApp('Hello! I\'d like to inquire about your catering services. Could you share more details about availability, menus, and pricing? Thank you!');
    });
  }

  // Form submit button
  var formBtn = document.getElementById('ctaFormWhatsappBtn');
  if (formBtn) {
    formBtn.addEventListener('click', function () {
      if (!validateCateringForm()) return;
      openWhatsApp(buildCateringMessage());
      resetCateringForm();
    });
  }
});