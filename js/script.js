// ============================
// 24 STORIES — SCRIPTS
// ============================

document.addEventListener('DOMContentLoaded', () => {

    // ============================
    // Navbar scroll
    // ============================
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    // Mobile menu
    const toggle = document.getElementById('mobileToggle');
    const menu   = document.getElementById('navMenu');
    toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('active');
    });
    menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            menu.classList.remove('open');
            toggle.classList.remove('active');
        });
    });
    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('open');
            toggle.classList.remove('active');
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            menu.classList.remove('open');
            toggle.classList.remove('active');
        }
    });


    // ============================
    // Reveal on scroll
    // ============================
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const siblings = [...entry.target.parentElement.children].filter(c => c.classList.contains('reveal'));
                const idx = siblings.indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), idx * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => observer.observe(el));

    // ============================
    // PayFast config
    // Signature is generated server-side in checkout.js using env vars.
    // Set PAYFAST_USE_SANDBOX = false on launch day.
    // ============================
    var PAYFAST_LIVE_URL    = 'https://www.payfast.co.za/eng/process';
    var PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
    var PAYFAST_USE_SANDBOX = true; // set false on launch
    var PAYFAST_URL         = PAYFAST_USE_SANDBOX ? PAYFAST_SANDBOX_URL : PAYFAST_LIVE_URL;

    // Netlify function endpoints
    var CHECKOUT_URL = '/.netlify/functions/checkout';

    // Submit a programmatic form to PayFast using server-signed params
    function redirectToPayFast(payfastParams) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = PAYFAST_URL;
        Object.keys(payfastParams).forEach(function(key) {
            var input = document.createElement('input');
            input.type  = 'hidden';
            input.name  = key;
            input.value = payfastParams[key];
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    }

    // ============================
    // Form type toggle
    // ============================
    const formPathBtns = document.querySelectorAll('.form-path-btn');
    const giftForm = document.getElementById('giftForm');
    const selfForm = document.getElementById('selfForm');

    formPathBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            formPathBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            if (this.dataset.form === 'gift') {
                giftForm.style.display = 'block';
                selfForm.style.display = 'none';
            } else {
                giftForm.style.display = 'none';
                selfForm.style.display = 'block';
            }
        });
    });

    // ============================
    // Recipient section builder
    // ============================
    // AbortControllers prevent duplicate input listeners when section rebuilds
    const recipientControllers = {};

    // Renders auto-filled (locked) slots followed by open input slots.
    // autoEmails: array of email strings to pre-fill and lock (Gift Giver, Story Helper).
    // max: total recipient cap (always 10).
    function buildRecipientSection(containerId, namePrefix, autoEmails, max) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Cancel previous input listener for this container
        if (recipientControllers[containerId]) {
            recipientControllers[containerId].abort();
        }
        const controller = new AbortController();
        recipientControllers[containerId] = controller;

        // Save any values the user has already typed into open slots
        const saved = [];
        container.querySelectorAll(`input:not([data-autofill])`).forEach(input => {
            const v = input.value.trim();
            if (v) saved.push(v);
        });

        // Rebuild from scratch
        container.innerHTML = '';
        const validAuto = autoEmails.filter(Boolean);
        let dynamicCount = validAuto.length; // next open slot will be validAuto.length + 1

        // Locked auto-fill slots
        validAuto.forEach((email, i) => {
            const slotNum = i + 1;
            const wrapper = document.createElement('div');
            if (i > 0) wrapper.style.marginTop = '14px';
            wrapper.dataset.autofill = 'true';

            const labelRow = document.createElement('div');
            labelRow.style.cssText = 'display:flex; align-items:baseline; gap:8px; margin-bottom:6px;';

            const label = document.createElement('label');
            label.htmlFor = `${namePrefix}-${slotNum}`;
            label.textContent = `Recipient ${slotNum}`;
            label.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.08em;';

            const autoTag = document.createElement('span');
            autoTag.textContent = 'auto-added';
            autoTag.style.cssText = 'font-size:11px; color:#B8976A; font-style:italic;';

            labelRow.appendChild(label);
            labelRow.appendChild(autoTag);

            const input = document.createElement('input');
            input.type = 'email';
            input.name = `${namePrefix}-${slotNum}`;
            input.id = `${namePrefix}-${slotNum}`;
            input.value = email;
            input.readOnly = true;
            input.dataset.autofill = 'true';
            input.style.cssText = 'width:100%; background:#F0EDE8; color:#666; cursor:default; border-color:#DDD;';

            wrapper.appendChild(labelRow);
            wrapper.appendChild(input);
            container.appendChild(wrapper);
        });

        // Hint text
        const remaining = max - validAuto.length;
        const hint = document.createElement('p');
        hint.className = 'recipient-hint';
        hint.style.cssText = 'font-size:13px; color:#888; font-style:italic; margin:10px 0 0;';

        if (remaining <= 0) {
            hint.textContent = 'Maximum 10 recipients reached.';
            container.appendChild(hint);
            return;
        }

        hint.textContent = validAuto.length > 0
            ? `Add up to ${remaining} more family member${remaining !== 1 ? 's' : ''}.`
            : 'Add as many as you like — up to 10.';
        container.appendChild(hint);

        // First open slot
        dynamicCount++;
        appendDynamicSlot(container, namePrefix, dynamicCount, hint);

        // Restore previously typed values into open slots
        saved.forEach((email, i) => {
            const slotNum = validAuto.length + 1 + i;
            if (slotNum > max) return;
            let input = container.querySelector(`[name="${namePrefix}-${slotNum}"]`);
            if (!input && dynamicCount < max) {
                dynamicCount++;
                appendDynamicSlot(container, namePrefix, dynamicCount, hint);
                input = container.querySelector(`[name="${namePrefix}-${dynamicCount}"]`);
            }
            if (input) input.value = email;
        });

        // Ensure an empty open slot exists after restored values
        if (saved.length > 0 && dynamicCount < max) {
            dynamicCount++;
            appendDynamicSlot(container, namePrefix, dynamicCount, hint);
        }

        // Dynamic expansion: new slot appears when current last slot receives a value
        container.addEventListener('input', function (e) {
            if (e.target.dataset.autofill) return;
            if (e.target.name === `${namePrefix}-${dynamicCount}` && dynamicCount < max) {
                dynamicCount++;
                appendDynamicSlot(container, namePrefix, dynamicCount, hint);
                if (dynamicCount === max) {
                    hint.textContent = 'Maximum 10 recipients reached.';
                }
            }
        }, { signal: controller.signal });
    }

    function appendDynamicSlot(container, namePrefix, slotNum, hint) {
        const wrapper = document.createElement('div');
        wrapper.style.marginTop = '14px';

        const label = document.createElement('label');
        label.htmlFor = `${namePrefix}-${slotNum}`;
        label.textContent = `Recipient ${slotNum}`;
        label.style.cssText = 'font-size:12px; color:#888; text-transform:uppercase; letter-spacing:0.08em; display:block; margin-bottom:6px;';

        const input = document.createElement('input');
        input.type = 'email';
        input.name = `${namePrefix}-${slotNum}`;
        input.id = `${namePrefix}-${slotNum}`;
        input.placeholder = 'Their email address';
        input.style.width = '100%';

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        container.insertBefore(wrapper, hint);
    }

    function buildFamilyEmails(formEl, namePrefix) {
        const arr = [];
        for (let i = 1; i <= 10; i++) {
            const f = formEl.querySelector(`[name="${namePrefix}-${i}"]`);
            if (f && f.value.trim()) arr.push(f.value.trim());
        }
        return arr.join('\n');
    }

    function showSuccess(formEl, headline, sub) {
        const card = formEl.closest('.form-card');
        card.innerHTML = `
            <div style="text-align:center; padding: 40px 0;">
                <p style="font-family:'Cormorant Garamond',serif; font-size:2rem; color:#1A1A1A; margin-bottom:16px; font-weight:300;">${headline}</p>
                <p style="font-size:16px; color:#5C5C5C; line-height:1.8;">${sub}</p>
            </div>`;
    }

    // ============================
    // GIFT FORM
    // ============================
    if (giftForm) {

        const gStorytellerEmail = giftForm.querySelector('[name="storyteller-email"]');
        const gGiverEmail       = document.getElementById('g-giver-email');
        const gHelperRadios     = giftForm.querySelectorAll('[name="g-helper-type"]');
        const gHelperFields     = document.getElementById('g-helperFields');
        const gHelperEmailInput = document.getElementById('g-helper-email');

        // Determine which emails should auto-fill recipient slots 1 and 2.
        // Gift Giver always takes slot 1 (when different from Storyteller).
        // Story Helper takes slot 2 if they are a different person again.
        // If helper-type = "storyteller", the Storyteller is their own helper — no extra slot needed.
        function getGiftAutoEmails() {
            const storyteller = gStorytellerEmail?.value.trim() || '';
            const giver       = gGiverEmail?.value.trim() || '';
            const helperType  = giftForm.querySelector('[name="g-helper-type"]:checked')?.value || 'none';

            let helper = '';
            if (helperType === 'me')    helper = giver;
            if (helperType === 'other') helper = gHelperEmailInput?.value.trim() || '';

            const auto = [];
            if (giver && giver !== storyteller) auto.push(giver);
            if (helper && helper !== giver && helper !== storyteller) auto.push(helper);
            return auto;
        }

        function refreshGiftRecipients() {
            const autoEmails = getGiftAutoEmails();
            const helperType = giftForm.querySelector('[name="g-helper-type"]:checked')?.value || 'me';
            const max        = 10;
            const autoCount  = autoEmails.filter(Boolean).length;
            const remaining  = max - autoCount;
            const instr = document.getElementById('g-recipient-instruction');
            if (instr) {
                if (autoCount === 0) {
                    instr.textContent = `Add as many as you like — up to ${max}.`;
                } else if (autoCount === 2) {
                    instr.textContent = `Your email and your Story Helper's have been added automatically. Add up to ${remaining} more family members below.`;
                } else {
                    instr.textContent = `Your email has been added automatically. Add up to ${remaining} more family members below.`;
                }
            }
            buildRecipientSection('g-recipientFields', 'g-recipient', autoEmails, max);
        }

        // Story Helper radio buttons: show/hide name+email fields, refresh recipients
        gHelperRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                gHelperFields.style.display = this.value === 'other' ? 'block' : 'none';
                refreshGiftRecipients();
            });
        });
        gHelperEmailInput?.addEventListener('input', refreshGiftRecipients);
        gGiverEmail?.addEventListener('input', refreshGiftRecipients);
        gStorytellerEmail?.addEventListener('input', refreshGiftRecipients);

        // Initial build
        refreshGiftRecipients();

        giftForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = giftForm.querySelector('button[type="submit"]');
            btn.textContent = 'Sending…';
            btn.disabled = true;

            const storytellerFullName  = giftForm.querySelector('[name="storyteller-name"]').value.trim();
            const storytellerFirstName = giftForm.querySelector('[name="storyteller-first-name"]').value.trim();
            const storytellerEmail     = gStorytellerEmail.value.trim();
            const giverName            = document.getElementById('g-giver-name').value.trim();
            const giverEmail           = gGiverEmail.value.trim();
            const helperType           = giftForm.querySelector('[name="g-helper-type"]:checked')?.value || 'me';
            const helperName           = helperType === 'me'    ? giverName
                                       : helperType === 'other' ? (document.getElementById('g-helper-name')?.value.trim() || '')
                                       : '';
            const helperEmail          = helperType === 'me'    ? giverEmail
                                       : helperType === 'other' ? (gHelperEmailInput?.value.trim() || '')
                                       : '';
            const FamilyEmails = buildFamilyEmails(giftForm, 'g-recipient');

            fetch(CHECKOUT_URL, {
                method  : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({
                    storytellerFirstName : storytellerFirstName,
                    storytellerSurname   : '',
                    storytellerEmail     : storytellerEmail,
                    storyHelperName      : helperName,
                    storyHelperEmail     : helperEmail,
                    giftGiverName        : giverName,
                    giftGiverEmail       : giverEmail,
                    familyEmails         : FamilyEmails,
                    paymentType          : 'monthly',
                    returnUrl            : 'https://24stories.co.za/?subscribed=1'
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.payfast_params) {
                    redirectToPayFast(data.payfast_params);
                } else {
                    btn.textContent = 'Something went wrong. Please try again.';
                    btn.disabled = false;
                }
            })
            .catch(() => {
                btn.textContent = 'Something went wrong. Please try again.';
                btn.disabled = false;
            });
        });
    }

    // ============================
    // SELF FORM
    // ============================
    if (selfForm) {

        const sStorytellerEmail = selfForm.querySelector('[name="storyteller-email"]');
        const sHelperFields     = document.getElementById('s-helperFields');
        const sHelperEmailInput = document.getElementById('s-helper-email');
        const sHelperRadios     = selfForm.querySelectorAll('[name="s-helper-type"]');

        function getSelfHelperType() {
            return selfForm.querySelector('[name="s-helper-type"]:checked')?.value || 'none';
        }

        function getSelfAutoEmails() {
            const storyteller = sStorytellerEmail?.value.trim() || '';
            const helper = getSelfHelperType() === 'other' ? (sHelperEmailInput?.value.trim() || '') : '';
            const auto = [];
            if (helper && helper !== storyteller) auto.push(helper);
            return auto;
        }

        function refreshSelfRecipients() {
            const autoEmails = getSelfAutoEmails();
            const max        = 10;
            const autoCount  = autoEmails.filter(Boolean).length;
            const remaining  = max - autoCount;
            const instr = document.getElementById('s-recipient-instruction');
            if (instr) {
                if (autoCount === 0) {
                    instr.textContent = `Add as many as you like — up to ${max}.`;
                } else {
                    instr.textContent = `Your Story Helper's email has been added automatically. Add up to ${remaining} more family members below.`;
                }
            }
            buildRecipientSection('s-recipientFields', 's-recipient', autoEmails, max);
        }

        sHelperRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                sHelperFields.style.display = this.value === 'other' ? 'block' : 'none';
                refreshSelfRecipients();
            });
        });
        sHelperEmailInput?.addEventListener('input', refreshSelfRecipients);
        sStorytellerEmail?.addEventListener('input', refreshSelfRecipients);

        // Initial build
        refreshSelfRecipients();

        selfForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = selfForm.querySelector('button[type="submit"]');
            btn.textContent = 'Sending…';
            btn.disabled = true;

            const storytellerName  = selfForm.querySelector('[name="storyteller-name"]').value.trim();
            const storytellerFirst = selfForm.querySelector('[name="storyteller-first-name"]').value.trim();
            const storytellerEmail = sStorytellerEmail.value.trim();
            const addHelper        = getSelfHelperType() === 'other';
            const helperName       = addHelper ? (document.getElementById('s-helper-name')?.value.trim()  || '') : '';
            const helperEmail      = addHelper ? (sHelperEmailInput?.value.trim() || '') : '';
            const FamilyEmails     = buildFamilyEmails(selfForm, 's-recipient');

            fetch(CHECKOUT_URL, {
                method  : 'POST',
                headers : { 'Content-Type': 'application/json' },
                body    : JSON.stringify({
                    storytellerFirstName : storytellerFirst,
                    storytellerSurname   : '',
                    storytellerEmail     : storytellerEmail,
                    storyHelperName      : helperName,
                    storyHelperEmail     : helperEmail,
                    giftGiverName        : storytellerName,
                    giftGiverEmail       : storytellerEmail,
                    familyEmails         : FamilyEmails,
                    paymentType          : 'monthly',
                    returnUrl            : 'https://24stories.co.za/?subscribed=1'
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.payfast_params) {
                    redirectToPayFast(data.payfast_params);
                } else {
                    btn.textContent = 'Something went wrong. Please try again.';
                    btn.disabled = false;
                }
            })
            .catch(() => {
                btn.textContent = 'Something went wrong. Please try again.';
                btn.disabled = false;
            });
        });
    }

    // ============================
    // Voice demo button
    // ============================
    const voiceBtn = document.querySelector('.voice-btn');
    if (voiceBtn) {
        voiceBtn.setAttribute('role', 'button');
        voiceBtn.setAttribute('tabindex', '0');
        voiceBtn.addEventListener('click', () => {
            alert('In production, this opens the voice-to-text tool. Replace with your actual voice recording link.');
        });
        voiceBtn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') voiceBtn.click();
        });
    }

});
