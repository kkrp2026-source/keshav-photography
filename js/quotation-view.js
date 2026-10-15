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

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

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
                <img src="${esc(img.url)}" alt="${esc(img.caption || '')}" loading="lazy">
                ${img.caption ? `<span class="cap">${esc(img.caption)}</span>` : ''}
            </div>`).join('');
        return `<div class="q-showcase">${shots}</div>`;
    }

    function renderClientBox(d) {
        const rows = [
            ['Client Code', d.clientCode],
            ['Client Name', d.clientName],
            ['Bride Name', d.brideName],
            ['Groom Name', d.groomName]
        ].filter(r => r[0] === 'Client Code' || r[0] === 'Client Name' || (r[1] !== undefined && r[1] !== ''));

        const body = rows.map(r => `
            <tr><td class="k">${esc(r[0])}</td><td class="v">${val(r[1])}</td></tr>`).join('');
        return `<div class="q-client-box"><table class="q-table">${body}</table></div>`;
    }

    function renderEvent(ev, idx) {
        const services = (ev.services || []).map((s, i) => `
            <tr>
                <td class="v">${i + 1}</td>
                <td class="v">${esc(s.name)}</td>
                <td class="v">${val(s.cameras)}</td>
            </tr>`).join('');

        const servicesTable = services ? `
            <table class="q-table">
                <tr><th class="hd">S.No</th><th class="hd">Services</th><th class="hd">Cameras</th></tr>
                ${services}
            </table>` : '';

        return `
            <div style="text-align:center;">
                <div class="q-event-badge"><div class="t">EVENT</div><div class="n">${idx + 1}</div></div>
            </div>
            <table class="q-table">
                <tr><td class="k">Event Name</td><td class="v">${val(ev.name)}</td><td class="k">Date</td><td class="v">${val(ev.date)}</td></tr>
                <tr><td class="k">Venue Name</td><td class="v">${val(ev.venueName)}</td><td class="k">Start Time</td><td class="v">${val(ev.startTime)}</td></tr>
                <tr><td class="k">Venue Location</td><td class="v">${val(ev.venueLocation)}</td><td class="k">End Time</td><td class="v">${val(ev.endTime)}</td></tr>
                <tr><td class="k">Crowd Strength</td><td class="v" colspan="3">${val(ev.crowd)}</td></tr>
            </table>
            ${servicesTable}`;
    }

    function renderDeliverables(d) {
        let html = '';
        if (d.photoDeliverables && d.photoDeliverables.length) {
            const rows = d.photoDeliverables.map(x => `
                <tr><td class="v">${esc(x.item)}</td><td class="v">${val(x.qty)}</td><td class="v">${val(x.count)}</td><td class="v">${val(x.event)}</td></tr>`).join('');
            html += `
                <table class="q-table">
                    <tr><th class="hd">Photo Deliverables</th><th class="hd">Qty</th><th class="hd">Photos Count</th><th class="hd">Event Name</th></tr>
                    ${rows}
                </table>`;
        }
        if (d.videoDeliverables && d.videoDeliverables.length) {
            const rows = d.videoDeliverables.map(x => `
                <tr><td class="v">${esc(x.item)}</td><td class="v">${val(x.qty)}</td><td class="v">${val(x.event)}</td></tr>`).join('');
            html += `
                <table class="q-table" style="margin-top:25px;">
                    <tr><th class="hd">Video Deliverables</th><th class="hd">Qty</th><th class="hd">Event Name</th></tr>
                    ${rows}
                </table>`;
        }
        return html ? `<h3 class="q-section-title">Deliverables</h3>${html}` : '';
    }

    function renderPricing(d) {
        const hasPricing = d.totalPackage || d.discount || d.packageValue || d.validUntil;
        if (!hasPricing) return '';
        return `
            <div class="q-pricing">
                <div class="q-price-box">
                    <div class="row"><span class="lab">Total Package</span><span class="amt">${val(d.totalPackage)} ${d.totalPackage ? 'INR' : ''}</span></div>
                    <div class="row"><span class="lab">Discount</span><span class="amt">${val(d.discount)} ${d.discount ? 'INR' : ''}</span></div>
                    <div class="row"><span class="lab">Package Value</span><span class="amt">${val(d.packageValue)} ${d.packageValue ? 'INR' : ''}</span></div>
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

            ${d.heroImage ? `<img class="q-hero-img" src="${esc(d.heroImage)}" alt="Hero">` : ''}

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

    const data = decodeData();
    if (!data) {
        renderError();
    } else {
        render(data);
    }
})();
