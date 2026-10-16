// ===== QUOTATION VIEWER =====
// Reads quotation data encoded in the URL (after #) and renders a styled quote page.
// Data format: quotation.html#<base64-encoded-json>

(function () {
    const root = document.getElementById('quotationRoot');
    const printBtn = document.getElementById('printBtn');

    function decodeData() {
        try {
            const raw = window.location.hash.slice(1);
            if (!raw) return null;
            // URL-safe base64 -> JSON (unicode safe)
            const b64 = decodeURIComponent(raw);
            const json = decodeURIComponent(escape(atob(b64)));
            return JSON.parse(json);
        } catch (e) {
            console.error('Failed to decode quotation data:', e);
            return null;
        }
    }

    function getCodeParam() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q');
    }

    // Fetch full quotation data from the server by short code.
    async function fetchByCode(code) {
        try {
            const resp = await fetch('/api/quotations?code=' + encodeURIComponent(code));
            if (!resp.ok) return null;
            const json = await resp.json();
            return json.data || null;
        } catch (e) {
            console.error('Failed to fetch quotation by code:', e);
            return null;
        }
    }

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Use image URLs as-is (static local files or existing Cloudinary URLs).
    function optimize(url) { return url; }

    function val(v) {
        return (v === undefined || v === null || v === '') ? '&ndash;' : esc(v);
    }

    function renderError() {
        root.innerHTML = `
            <div class="q-error">
                <i class="fas fa-file-circle-exclamation"></i>
                <h2>Quotation Not Found</h2>
                <p>This quotation link is invalid or has expired.<br>Please contact us for a new quote.</p>
                <p style="margin-top:20px;"><a href="index.html">&larr; Back to Keshav Photography</a></p>
            </div>`;
    }

    function renderAwards(awards) {
        if (!awards || !awards.length) return '';
        const items = awards.map(a => `
            <div class="q-award">
                <div class="num">${esc(a.num)}</div>
                <div class="lbl">${esc(a.label)}</div>
            </div>`).join('');
        return `<div class="q-awards">${items}</div>`;
    }

    function renderShowcase(images) {
        if (!images || !images.length) return '';
        const shots = images.map(img => `
            <div class="shot">
                <img src="${esc(optimize(img.url, 1200))}" alt="Showcase" loading="lazy" decoding="async">
                <a class="cap cap-link" href="gallery.html" target="_blank" rel="noopener"><i class="fas fa-images"></i> View Gallery</a>
            </div>`).join('');
        return `<div class="q-showcase">${shots}</div>`;
    }

    function renderClientBox(d) {
        const rows = [
            ['Quotation Code', d.clientCode],
            ['Client Name', d.clientName],
            ['Bride Name', d.brideName],
            ['Groom Name', d.groomName]
        ].filter(r => r[0] === 'Quotation Code' || r[0] === 'Client Name' || (r[1] !== undefined && r[1] !== ''));

        const body = rows.map(r => `
            <tr><td class="k">${esc(r[0])}</td><td class="v">${val(r[1])}</td></tr>`).join('');
        return `<div class="q-client-box"><div class="q-table-scroll"><table class="q-table">${body}</table></div></div>`;
    }

    function renderEvent(ev, idx) {
        const services = (ev.services || []).map((s, i) => `
            <tr>
                <td class="v">${i + 1}</td>
                <td class="v">${esc(s.name)}</td>
                <td class="v">${val(s.cameras)}</td>
            </tr>`).join('');

        const servicesTable = services ? `
            <div class="q-table-scroll"><table class="q-table">
                <tr><th class="hd">S.No</th><th class="hd">Services</th><th class="hd">Cameras</th></tr>
                ${services}
            </table></div>` : '';

        return `
            <div style="text-align:center;">
                <div class="q-event-badge"><div class="t">EVENT</div><div class="n">${idx + 1}</div></div>
            </div>
            <div class="q-table-scroll"><table class="q-table">
                <tr><td class="k">Event Name</td><td class="v">${val(ev.name)}</td><td class="k">Date</td><td class="v">${val(ev.date)}</td></tr>
                <tr><td class="k">Venue Name</td><td class="v">${val(ev.venueName)}</td><td class="k">Start Time</td><td class="v">${val(ev.startTime)}</td></tr>
                <tr><td class="k">Venue Location</td><td class="v">${val(ev.venueLocation)}</td><td class="k">End Time</td><td class="v">${val(ev.endTime)}</td></tr>
                <tr><td class="k">Crowd Strength</td><td class="v" colspan="3">${val(ev.crowd)}</td></tr>
            </table></div>
            ${servicesTable}`;
    }

    function renderDeliverables(d) {
        let html = '';
        if (d.photoDeliverables && d.photoDeliverables.length) {
            const rows = d.photoDeliverables.map(x => `
                <tr><td class="v">${esc(x.item)}</td><td class="v">${val(x.qty)}</td><td class="v">${val(x.count)}</td><td class="v">${val(x.event)}</td></tr>`).join('');
            html += `
                <div class="q-table-scroll"><table class="q-table">
                    <tr><th class="hd">Photo Deliverables</th><th class="hd">Qty</th><th class="hd">Photos Count</th><th class="hd">Event Name</th></tr>
                    ${rows}
                </table></div>`;
        }
        if (d.videoDeliverables && d.videoDeliverables.length) {
            const rows = d.videoDeliverables.map(x => `
                <tr><td class="v">${esc(x.item)}</td><td class="v">${val(x.qty)}</td><td class="v">${val(x.event)}</td></tr>`).join('');
            html += `
                <div class="q-table-scroll" style="margin-top:25px;"><table class="q-table">
                    <tr><th class="hd">Video Deliverables</th><th class="hd">Qty</th><th class="hd">Event Name</th></tr>
                    ${rows}
                </table></div>`;
        }
        return html ? `<h3 class="q-section-title">Deliverables</h3>${html}` : '';
    }

    function renderPricing(d) {
        const hasPricing = d.totalPackage || d.discount || d.packageValue || d.validUntil;
        if (!hasPricing) return '';

        const total = parseFloat(d.totalPackage);
        const pkgVal = parseFloat(d.packageValue);

        // Package Value is the final price after discount.
        // Discount amount = Total Package - Package Value.
        let disc = parseFloat(d.discount);
        if ((isNaN(disc) || disc <= 0) && !isNaN(total) && !isNaN(pkgVal) && total > pkgVal) {
            disc = total - pkgVal;
        }

        let discPctStr = '';
        if (!isNaN(total) && total > 0 && !isNaN(disc) && disc > 0) {
            discPctStr = (disc / total * 100).toFixed(1).replace(/\.0$/, '') + '%';
        } else if (d.discountPct) {
            discPctStr = d.discountPct + '%';
        }

        const discAmtStr = (!isNaN(disc) && disc > 0) ? disc.toLocaleString('en-IN') : '';
        const discountRow = discAmtStr
            ? `<div class="row"><span class="lab">Discount</span><span class="amt">${discAmtStr} INR</span></div>`
            : '';
        const discountPctRow = discPctStr
            ? `<div class="row" style="border-top:1px dashed rgba(212,175,55,0.3);padding-top:10px;margin-top:4px;"><span class="lab">Discount Offered</span><span class="amt" style="font-size:1.1rem;">${discPctStr}</span></div>`
            : '';

        const totalStr = !isNaN(total) ? total.toLocaleString('en-IN') : val(d.totalPackage);
        const pkgValStr = !isNaN(pkgVal) ? pkgVal.toLocaleString('en-IN') : val(d.packageValue);

        return `
            <div class="q-pricing">
                <div class="q-price-box">
                    <div class="row"><span class="lab">Total Package</span><span class="amt">${totalStr} ${d.totalPackage ? 'INR' : ''}</span></div>
                    ${discountRow}
                    <div class="row"><span class="lab">Package Value</span><span class="amt">${pkgValStr} ${d.packageValue ? 'INR' : ''}</span></div>
                    ${discountPctRow}
                </div>
                <div class="q-price-box valid">
                    <h4>This Quote Is Valid Until</h4>
                    <div style="color:#fff;font-size:1.1rem;">${val(d.validUntil)}</div>
                </div>
            </div>`;
    }

    function render(d) {
        const events = d.events || [];
        const eventsHtml = events.map((ev, i) => renderEvent(ev, i)).join('');

        root.innerHTML = `
            <div class="q-top">
                <img src="images/logo.webp" alt="Keshav Photography">
                <div class="q-title">SALES <span>QUOTATION</span>
                    <span class="q-title-mark"><i class="m1"></i><i class="m2"></i></span>
                </div>
                <div class="q-proposal">
                    A PROPOSAL BY <b>${val(d.proposalBy || 'Keshav Photography')}</b><br>
                    QUOTE REVISION - ${val(d.quoteRevision || '1')}
                </div>
            </div>

            ${d.heroImage ? `<img class="q-hero-img" src="${esc(optimize(d.heroImage, 1400))}" alt="Hero" decoding="async">` : ''}

            <div class="q-happily">
                <h2>HAPPILY<br>EVER AFTER</h2>
                <div class="sub">Starts Now</div>
                <p>LET'S START BY CAPTURING LOVELY MOMENTS AND TURNING INTO PRICELESS MEMORIES</p>
            </div>

            ${renderAwards(d.awards)}
            ${renderShowcase(d.showcaseImages)}

            ${renderClientBox(d)}
            ${eventsHtml}
            ${renderDeliverables(d)}
            ${renderPricing(d)}

            <div class="q-gallery-cta">
                <p>Explore our recent work</p>
                <a href="gallery.html" class="q-gallery-btn" target="_blank" rel="noopener">
                    <i class="fas fa-images"></i> View Our Gallery
                </a>
            </div>

            <div class="q-thanks">
                <p>${esc(d.thankYouNote || "The value that you're about to experience against your package cost is priceless. It is our pleasure to showcase our service offerings for your upcoming esteemed event. We look forward to serving you the best.")}</p>
                <h1>THANK YOU</h1>
            </div>

            <div class="q-footer-strip">
                KESHAV PHOTOGRAPHY
                <div class="site">www.keshavphotography.com</div>
            </div>`;

        document.title = `Quotation ${d.clientCode || ''} | Keshav Photography`;
        printBtn.style.display = 'flex';
        printBtn.addEventListener('click', () => window.print());
    }

    function renderLoading() {
        root.innerHTML = `
            <div class="q-error">
                <i class="fas fa-spinner fa-spin"></i>
                <h2>Loading Quotation…</h2>
            </div>`;
    }

    async function boot() {
        // 1) Short-code link: quotation.html?q=CODE  -> fetch from server
        const code = getCodeParam();
        if (code) {
            renderLoading();
            const data = await fetchByCode(code);
            if (data) { render(data); return; }
            // If server lookup fails, try hash fallback before erroring
        }
        // 2) Self-contained link: quotation.html#<encoded>
        const hashData = decodeData();
        if (hashData) { render(hashData); return; }

        renderError();
    }

    boot();
})();
