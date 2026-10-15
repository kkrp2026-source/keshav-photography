// ===== QUOTATION ADMIN LOGIC =====
// Builds the quotation form, lets admin pick images from the gallery,
// generates a 10-char client code, encodes everything into a shareable link.

(function () {
    'use strict';

    // Deliver large local images through Cloudinary fetch optimizer for the picker thumbnails.
    const CLOUD_NAME = 'apojnx4i';
    function optimizeThumb(url, width) {
        if (!url || url.includes('res.cloudinary.com')) return url;
        const host = window.location.hostname;
        const isLocal = !host || host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
        if (isLocal) return url;
        const absolute = new URL(url, window.location.origin).href;
        return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${width || 300}/${encodeURIComponent(absolute)}`;
    }

    // Default service options seen in the reference quote
    const SERVICE_OPTIONS = [
        'TRADITIONAL PHOTOGRAPHY', 'TRADITIONAL VIDEOGRAPHY',
        'CANDID PHOTOGRAPHY', 'CANDID VIDEOGRAPHY',
        'CINEMATIC VIDEO', 'DRONE', 'LIVE STREAMING', 'PHOTO BOOTH'
    ];

    // Default achievements (editable per quote)
    const DEFAULT_AWARDS = [
        { num: '3', label: 'Countries' },
        { num: '10', label: 'Branches' },
        { num: '100+', label: 'Awards' },
        { num: '9000+', label: 'Events' },
        { num: '10', label: 'Years of Experience' }
    ];

    // "Enter Our Worlds" images (same set used on the homepage, local files)
    const WORLD_IMAGES = [
        { url: 'images/enter our worlds/hindu wedding.jpg', caption: 'Hindu Wedding' },
        { url: 'images/enter our worlds/christain wedding.jpg', caption: 'Christian Wedding' },
        { url: 'images/enter our worlds/muslim wedding.jpg', caption: 'Muslim Wedding' },
        { url: 'images/enter our worlds/pre wedding.jpg', caption: 'Pre Wedding' },
        { url: 'images/enter our worlds/international shoot.jpg', caption: 'International Shoot' },
        { url: 'images/enter our worlds/engagement.jpg', caption: 'Engagement' },
        { url: 'images/enter our worlds/reception.jpg', caption: 'Reception' },
        { url: 'images/enter our worlds/half saree.jpg', caption: 'Half Saree' },
        { url: 'images/enter our worlds/haldi.jpg', caption: 'Haldi' },
        { url: 'images/enter our worlds/birth day.jpg', caption: 'Birthday' },
        { url: 'images/enter our worlds/maternity.jpg', caption: 'Maternity' },
        { url: 'images/enter our worlds/baby shoots.jpg', caption: 'Baby Shoots' },
        { url: 'images/enter our worlds/Dubai/dubai.jpg', caption: 'Dubai' },
        { url: 'images/enter our worlds/United States/usa.jpg', caption: 'United States' }
    ];

    // State for selected images
    const state = {
        hero: null,            // { url }
        showcase: [],          // [{ url, caption }]
        galleryCache: null
    };

    // Picker context
    let pickerMode = null;     // 'hero' | 'showcase'
    let pickerSelection = [];

    // ---------- Helpers ----------
    function el(id) { return document.getElementById(id); }

    function generateClientCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    function encodeQuote(data) {
        const json = JSON.stringify(data);
        // unicode-safe base64
        const b64 = btoa(unescape(encodeURIComponent(json)));
        return encodeURIComponent(b64);
    }

    // ---------- Awards ----------
    function awardRow(a) {
        const wrap = document.createElement('div');
        wrap.className = 'q-award-row';
        wrap.style.cssText = 'display:grid;grid-template-columns:120px 1fr auto;gap:10px;margin-bottom:10px;align-items:center;';
        wrap.innerHTML = `
            <input type="text" class="q-award-num" placeholder="Number" value="${a ? a.num : ''}" style="padding:10px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-award-label" placeholder="Label" value="${a ? a.label : ''}" style="padding:10px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <button type="button" class="q-del-row" style="background:rgba(220,53,69,0.9);border:none;color:#fff;width:34px;height:34px;border-radius:4px;cursor:pointer;"><i class="fas fa-trash"></i></button>`;
        wrap.querySelector('.q-del-row').addEventListener('click', () => wrap.remove());
        return wrap;
    }

    function initAwards() {
        const list = el('qAwardsList');
        DEFAULT_AWARDS.forEach(a => list.appendChild(awardRow(a)));
        el('qAddAward').addEventListener('click', () => list.appendChild(awardRow(null)));
    }

    function collectAwards() {
        return Array.from(document.querySelectorAll('#qAwardsList .q-award-row'))
            .map(r => ({
                num: r.querySelector('.q-award-num').value.trim(),
                label: r.querySelector('.q-award-label').value.trim()
            }))
            .filter(a => a.num || a.label);
    }

    // ---------- Events ----------
    function serviceRow() {
        const row = document.createElement('div');
        row.className = 'q-service-row';
        row.style.cssText = 'display:grid;grid-template-columns:1fr 110px auto;gap:10px;margin-bottom:8px;';
        const opts = SERVICE_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');
        row.innerHTML = `
            <select class="q-service-name" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
                <option value="">Select Service</option>${opts}
            </select>
            <input type="number" class="q-service-cams" placeholder="Cameras" min="1" value="1" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <button type="button" class="q-del-row" style="background:rgba(220,53,69,0.9);border:none;color:#fff;width:34px;border-radius:4px;cursor:pointer;"><i class="fas fa-times"></i></button>`;
        row.querySelector('.q-del-row').addEventListener('click', () => row.remove());
        return row;
    }

    function buildEventBlock(index) {
        const block = document.createElement('div');
        block.className = 'q-event-block';
        block.style.cssText = 'border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:20px;margin-bottom:18px;';
        block.innerHTML = `
            <h5 style="color:#D4AF37;font-family:'Cinzel',serif;letter-spacing:2px;margin-bottom:15px;">EVENT ${index + 1}</h5>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group"><label>Event Name</label><input type="text" class="q-ev-name" placeholder="e.g. ENGAGEMENT"></div>
                <div class="form-group"><label>Date</label><input type="date" class="q-ev-date"></div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group"><label>Venue Name</label><input type="text" class="q-ev-venue" placeholder="Venue"></div>
                <div class="form-group"><label>Venue Location</label><input type="text" class="q-ev-location" placeholder="City"></div>
            </div>
            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                <div class="form-group"><label>Start Time</label><input type="time" class="q-ev-start"></div>
                <div class="form-group"><label>End Time</label><input type="time" class="q-ev-end"></div>
                <div class="form-group"><label>Crowd Strength</label><input type="text" class="q-ev-crowd" placeholder="e.g. 200"></div>
            </div>
            <label style="color:#888;font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;">Services</label>
            <div class="q-services-list" style="margin:10px 0;"></div>
            <button type="button" class="btn btn-outline q-add-service" style="font-size:0.7rem;padding:6px 14px;"><i class="fas fa-plus"></i> Add Service</button>`;
        const servicesList = block.querySelector('.q-services-list');
        servicesList.appendChild(serviceRow());
        block.querySelector('.q-add-service').addEventListener('click', () => servicesList.appendChild(serviceRow()));
        return block;
    }

    function initEvents() {
        el('qNumEvents').addEventListener('change', (e) => {
            const n = parseInt(e.target.value) || 0;
            const container = el('qEventsContainer');
            const current = container.querySelectorAll('.q-event-block').length;
            if (n > current) {
                for (let i = current; i < n; i++) container.appendChild(buildEventBlock(i));
            } else if (n < current) {
                const blocks = container.querySelectorAll('.q-event-block');
                for (let i = current - 1; i >= n; i--) blocks[i].remove();
            }
        });
    }

    function collectEvents() {
        return Array.from(document.querySelectorAll('#qEventsContainer .q-event-block')).map(b => ({
            name: b.querySelector('.q-ev-name').value.trim(),
            date: formatDate(b.querySelector('.q-ev-date').value),
            venueName: b.querySelector('.q-ev-venue').value.trim(),
            venueLocation: b.querySelector('.q-ev-location').value.trim(),
            startTime: b.querySelector('.q-ev-start').value,
            endTime: b.querySelector('.q-ev-end').value,
            crowd: b.querySelector('.q-ev-crowd').value.trim(),
            services: Array.from(b.querySelectorAll('.q-service-row')).map(r => ({
                name: r.querySelector('.q-service-name').value,
                cameras: r.querySelector('.q-service-cams').value
            })).filter(s => s.name)
        }));
    }

    function formatDate(iso) {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
    }

    // ---------- Discount percentage ----------
    function discountPercent() {
        const total = parseFloat(el('qTotalPackage').value);
        const disc = parseFloat(el('qDiscount').value);
        if (isNaN(total) || total <= 0 || isNaN(disc) || disc <= 0) return null;
        return (disc / total * 100);
    }

    function updateDiscountPct() {
        const pct = discountPercent();
        const out = el('qDiscountPct');
        if (pct === null) {
            out.style.display = 'none';
            out.textContent = '';
        } else {
            out.style.display = 'block';
            const pctStr = pct.toFixed(1).replace(/\.0$/, '');
            out.innerHTML = `<i class="fas fa-tag"></i> Discount offered: <b>${pctStr}%</b>`;
            // auto-fill package value if empty
            const pv = el('qPackageValue');
            if (!pv.value) {
                const total = parseFloat(el('qTotalPackage').value);
                const disc = parseFloat(el('qDiscount').value);
                pv.value = Math.max(0, Math.round(total - disc));
            }
        }
    }

    // ---------- Deliverables ----------
    function photoDelRow() {
        const row = document.createElement('div');
        row.className = 'q-pdel-row';
        row.style.cssText = 'display:grid;grid-template-columns:1fr 80px 100px 1fr auto;gap:8px;margin-bottom:8px;';
        row.innerHTML = `
            <input type="text" class="q-pd-item" placeholder="Item (e.g. RETOUCH)" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-pd-qty" placeholder="Qty" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-pd-count" placeholder="Count" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-pd-event" placeholder="Event(s)" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <button type="button" class="q-del-row" style="background:rgba(220,53,69,0.9);border:none;color:#fff;width:34px;border-radius:4px;cursor:pointer;"><i class="fas fa-times"></i></button>`;
        row.querySelector('.q-del-row').addEventListener('click', () => row.remove());
        return row;
    }

    function videoDelRow() {
        const row = document.createElement('div');
        row.className = 'q-vdel-row';
        row.style.cssText = 'display:grid;grid-template-columns:1fr 80px 1fr auto;gap:8px;margin-bottom:8px;';
        row.innerHTML = `
            <input type="text" class="q-vd-item" placeholder="Item (e.g. CANDID VIDEO)" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-vd-qty" placeholder="Qty" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <input type="text" class="q-vd-event" placeholder="Event(s)" style="padding:9px;background:#0a0a0a;border:1px solid rgba(212,175,55,0.2);color:#fff;border-radius:4px;">
            <button type="button" class="q-del-row" style="background:rgba(220,53,69,0.9);border:none;color:#fff;width:34px;border-radius:4px;cursor:pointer;"><i class="fas fa-times"></i></button>`;
        row.querySelector('.q-del-row').addEventListener('click', () => row.remove());
        return row;
    }

    function initDeliverables() {
        el('qAddPhotoDel').addEventListener('click', () => el('qPhotoDeliverables').appendChild(photoDelRow()));
        el('qAddVideoDel').addEventListener('click', () => el('qVideoDeliverables').appendChild(videoDelRow()));
    }

    function collectPhotoDeliverables() {
        return Array.from(document.querySelectorAll('#qPhotoDeliverables .q-pdel-row')).map(r => ({
            item: r.querySelector('.q-pd-item').value.trim(),
            qty: r.querySelector('.q-pd-qty').value.trim(),
            count: r.querySelector('.q-pd-count').value.trim(),
            event: r.querySelector('.q-pd-event').value.trim()
        })).filter(x => x.item);
    }

    function collectVideoDeliverables() {
        return Array.from(document.querySelectorAll('#qVideoDeliverables .q-vdel-row')).map(r => ({
            item: r.querySelector('.q-vd-item').value.trim(),
            qty: r.querySelector('.q-vd-qty').value.trim(),
            event: r.querySelector('.q-vd-event').value.trim()
        })).filter(x => x.item);
    }

    // ---------- Image picker ----------
    async function loadGallery() {
        if (state.galleryCache) return state.galleryCache;
        // Start with the local "Enter Our Worlds" images
        let imgs = WORLD_IMAGES.slice();
        // Merge any admin-uploaded world covers from Cloudinary (if available)
        try {
            if (typeof fetchWorldCovers === 'function') {
                const covers = await fetchWorldCovers();
                (covers || []).forEach(c => {
                    if (c.url && !imgs.some(i => i.url === c.url)) {
                        imgs.push({ url: c.url, caption: c.category || '' });
                    }
                });
            }
        } catch (e) {
            console.warn('World covers (Cloudinary) load skipped:', e);
        }
        state.galleryCache = imgs;
        return state.galleryCache;
    }

    async function openPicker(mode) {
        pickerMode = mode;
        pickerSelection = [];
        const modal = el('qPickerModal');
        const grid = el('qPickerGrid');
        const hint = el('qPickerHint');
        hint.textContent = mode === 'hero'
            ? 'Click one Enter Our Worlds image to use as the hero image.'
            : 'Click to select multiple Enter Our Worlds images, then press Done.';
        grid.innerHTML = '<p style="color:#888;">Loading images…</p>';
        modal.style.display = 'block';

        const imgs = await loadGallery();
        if (!imgs.length) {
            grid.innerHTML = '<p style="color:#888;">No Enter Our Worlds images found.</p>';
            return;
        }
        grid.innerHTML = '';
        imgs.forEach(img => {
            const cell = document.createElement('div');
            cell.style.cssText = 'position:relative;cursor:pointer;border:2px solid transparent;border-radius:4px;overflow:hidden;';
            cell.innerHTML = `<img src="${optimizeThumb(img.url, 300)}" loading="lazy" style="width:100%;height:100px;object-fit:cover;display:block;">
                <span class="q-check" style="display:none;position:absolute;top:5px;right:5px;background:#D4AF37;color:#0a0a0a;width:22px;height:22px;border-radius:50%;align-items:center;justify-content:center;font-size:0.7rem;"><i class="fas fa-check"></i></span>`;
            cell.addEventListener('click', () => {
                if (mode === 'hero') {
                    pickerSelection = [{ url: img.url }];
                    grid.querySelectorAll('div').forEach(c => { c.style.borderColor = 'transparent'; const chk = c.querySelector('.q-check'); if (chk) chk.style.display = 'none'; });
                    cell.style.borderColor = '#D4AF37';
                    cell.querySelector('.q-check').style.display = 'flex';
                } else {
                    const idx = pickerSelection.findIndex(s => s.url === img.url);
                    if (idx >= 0) {
                        pickerSelection.splice(idx, 1);
                        cell.style.borderColor = 'transparent';
                        cell.querySelector('.q-check').style.display = 'none';
                    } else {
                        pickerSelection.push({ url: img.url, caption: '' });
                        cell.style.borderColor = '#D4AF37';
                        cell.querySelector('.q-check').style.display = 'flex';
                    }
                }
            });
            grid.appendChild(cell);
        });
    }

    function applyPicker() {
        if (pickerMode === 'hero') {
            state.hero = pickerSelection[0] || null;
            renderHeroPreview();
        } else {
            // merge, avoid duplicates
            pickerSelection.forEach(sel => {
                if (!state.showcase.some(s => s.url === sel.url)) state.showcase.push(sel);
            });
            renderShowcaseList();
        }
        el('qPickerModal').style.display = 'none';
    }

    function renderHeroPreview() {
        const box = el('qHeroPreview');
        box.innerHTML = '';
        if (state.hero) {
            const d = document.createElement('div');
            d.style.cssText = 'position:relative;';
            d.innerHTML = `<img src="${optimizeThumb(state.hero.url, 200)}" style="width:90px;height:60px;object-fit:cover;border-radius:4px;">
                <button type="button" style="position:absolute;top:-6px;right:-6px;background:#dc3545;border:none;color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:0.6rem;">&times;</button>`;
            d.querySelector('button').addEventListener('click', () => { state.hero = null; renderHeroPreview(); });
            box.appendChild(d);
        }
    }

    function renderShowcaseList() {
        const list = el('qShowcaseList');
        list.innerHTML = '';
        state.showcase.forEach((s, i) => {
            const cell = document.createElement('div');
            cell.style.cssText = 'position:relative;border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:6px;background:#0a0a0a;';
            cell.innerHTML = `
                <img src="${optimizeThumb(s.url, 300)}" loading="lazy" style="width:100%;height:90px;object-fit:cover;border-radius:3px;">
                <input type="text" placeholder="Caption" value="${s.caption || ''}" class="q-showcase-cap" style="width:100%;margin-top:6px;padding:6px;background:#141414;border:1px solid rgba(212,175,55,0.2);color:#fff;font-size:0.75rem;border-radius:3px;">
                <button type="button" class="q-remove-showcase" style="position:absolute;top:-6px;right:-6px;background:#dc3545;border:none;color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:0.6rem;">&times;</button>`;
            cell.querySelector('.q-showcase-cap').addEventListener('input', (e) => { state.showcase[i].caption = e.target.value; });
            cell.querySelector('.q-remove-showcase').addEventListener('click', () => { state.showcase.splice(i, 1); renderShowcaseList(); });
            list.appendChild(cell);
        });
    }

    // ---------- Generate ----------
    function generate() {
        const clientName = el('qClientName').value.trim();
        if (!clientName) {
            alert('Client Name is required.');
            el('qClientName').focus();
            return;
        }

        const data = {
            clientCode: generateClientCode(),
            clientName: clientName,
            proposalBy: el('qProposalBy').value.trim(),
            brideName: el('qBrideName').value.trim(),
            groomName: el('qGroomName').value.trim(),
            quoteRevision: el('qQuoteRevision').value.trim() || '1',
            awards: collectAwards(),
            heroImage: state.hero ? state.hero.url : '',
            showcaseImages: state.showcase,
            events: collectEvents(),
            photoDeliverables: collectPhotoDeliverables(),
            videoDeliverables: collectVideoDeliverables(),
            totalPackage: el('qTotalPackage').value.trim(),
            discount: el('qDiscount').value.trim(),
            discountPct: (discountPercent() === null ? '' : discountPercent().toFixed(1).replace(/\.0$/, '')),
            packageValue: el('qPackageValue').value.trim(),
            validUntil: formatDate(el('qValidUntil').value),
            thankYouNote: el('qThankYou').value.trim()
        };

        const encoded = encodeQuote(data);
        const base = (window.location.origin && window.location.origin !== 'null')
            ? window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
            : '';
        const link = `${base}quotation.html#${encoded}`;

        const record = {
            code: data.clientCode,
            clientName: data.clientName,
            brideName: data.brideName,
            groomName: data.groomName,
            createdAt: new Date().toISOString(),
            link: link
        };

        // Save a lightweight record so it appears in "Manage All".
        // Prefer the global store defined in admin-login.html; fall back to local.
        if (typeof window.saveQuotationRecord === 'function') {
            window.saveQuotationRecord(record);
        } else {
            saveQuoteRecord(record);
        }

        el('qResultCode').textContent = data.clientCode;
        el('qResultLink').value = link;
        el('qOpenLink').href = link;
        el('qResult').style.display = 'block';
        el('qResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (typeof window.renderQuotationRecords === 'function') window.renderQuotationRecords();
    }

    // ---------- Saved quote records (localStorage) ----------
    const QUOTE_STORE_KEY = 'kp_quotations';

    function getQuoteRecords() {
        try { return JSON.parse(localStorage.getItem(QUOTE_STORE_KEY) || '[]'); }
        catch (e) { return []; }
    }

    function saveQuoteRecord(rec) {
        const list = getQuoteRecords();
        list.unshift(rec); // newest first
        localStorage.setItem(QUOTE_STORE_KEY, JSON.stringify(list));
    }

    // Note: the Manage All table's read/write/delete helpers are defined
    // globally in admin-login.html (window.getQuotationRecords, etc.).
    // getQuoteRecords/saveQuoteRecord below are a self-contained fallback
    // using the same localStorage key, so both paths stay consistent.

    function initResultActions() {
        el('qCopyLink').addEventListener('click', () => {
            const input = el('qResultLink');
            input.select();
            navigator.clipboard.writeText(input.value).then(() => {
                const btn = el('qCopyLink');
                const orig = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied';
                setTimeout(() => { btn.innerHTML = orig; }, 1500);
            }).catch(() => {
                document.execCommand('copy');
            });
        });
    }

    // ---------- Clear form ----------
    function clearForm() {
        if (!confirm('Clear the entire quotation form? This will not delete any saved quotations.')) return;

        // Reset text/number/date/textarea inputs in the quotations section
        ['qClientName', 'qProposalBy', 'qBrideName', 'qGroomName',
         'qTotalPackage', 'qDiscount', 'qPackageValue', 'qValidUntil', 'qThankYou']
            .forEach(id => { if (el(id)) el(id).value = ''; });
        if (el('qQuoteRevision')) el('qQuoteRevision').value = '1';

        // Reset discount %
        if (el('qDiscountPct')) { el('qDiscountPct').style.display = 'none'; el('qDiscountPct').textContent = ''; }

        // Reset awards back to defaults
        const awardsList = el('qAwardsList');
        awardsList.innerHTML = '';
        DEFAULT_AWARDS.forEach(a => awardsList.appendChild(awardRow(a)));

        // Reset images
        state.hero = null;
        state.showcase = [];
        renderHeroPreview();
        renderShowcaseList();

        // Reset events
        el('qNumEvents').value = '0';
        el('qEventsContainer').innerHTML = '';

        // Reset deliverables to a single empty row each
        el('qPhotoDeliverables').innerHTML = '';
        el('qVideoDeliverables').innerHTML = '';
        el('qPhotoDeliverables').appendChild(photoDelRow());
        el('qVideoDeliverables').appendChild(videoDelRow());

        // Hide result
        el('qResult').style.display = 'none';

        // Scroll back to top of the section
        el('qClientName').focus();
    }

    // ---------- Init (runs once DOM is ready) ----------
    function init() {
        if (!el('qAwardsList')) return; // quotations section not present
        initAwards();
        initEvents();
        initDeliverables();
        initResultActions();

        el('qPickHero').addEventListener('click', () => openPicker('hero'));
        el('qPickShowcase').addEventListener('click', () => openPicker('showcase'));
        el('qPickerClose').addEventListener('click', () => { el('qPickerModal').style.display = 'none'; });
        el('qPickerDone').addEventListener('click', applyPicker);
        el('qGenerateBtn').addEventListener('click', generate);
        el('qClearBtn').addEventListener('click', clearForm);

        // Live discount percentage
        el('qTotalPackage').addEventListener('input', updateDiscountPct);
        el('qDiscount').addEventListener('input', updateDiscountPct);

        // seed one deliverable row each for convenience
        el('qPhotoDeliverables').appendChild(photoDelRow());
        el('qVideoDeliverables').appendChild(videoDelRow());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
