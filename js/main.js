// ===== PRELOADER =====
// Show logo preloader with animation only on first visit
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    if (sessionStorage.getItem('kp_visited')) {
        // Already visited - hide preloader instantly
        preloader.classList.add('loaded');
    } else {
        // First visit - show full animation then mark as visited
        sessionStorage.setItem('kp_visited', 'true');
        setTimeout(() => {
            preloader.classList.add('loaded');
        }, 2800);
    }
});

// ===== HERO SLIDESHOW =====
const heroSlides = document.querySelectorAll('.hero-slide');
let currentSlide = 0;
if (heroSlides.length > 1) {
    setInterval(() => {
        heroSlides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % heroSlides.length;
        heroSlides[currentSlide].classList.add('active');
    }, 6000);
}

// ===== SCROLL PROGRESS BAR =====
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.prepend(scrollProgress);

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

// Cache DOM elements for scroll handler
const backToTopBtn = document.getElementById('backToTop');
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            
            // Navbar
            if (scrollY > 50) { navbar.classList.add('scrolled'); } 
            else { navbar.classList.remove('scrolled'); }

            // Scroll progress
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                scrollProgress.style.width = ((scrollY / docHeight) * 100) + '%';
            }

            // Back to top
            if (backToTopBtn) { backToTopBtn.classList.toggle('visible', scrollY > 500); }

            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });
}

document.querySelectorAll('.mobile-nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ===== SCROLL ANIMATIONS =====
const animateElements = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => { entry.target.classList.add('animated'); }, parseInt(delay));
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
animateElements.forEach(el => observer.observe(el));

// ===== HERO TEXT ANIMATIONS =====
function splitTextAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    const text = heroTitle.textContent;
    heroTitle.innerHTML = '';
    heroTitle.classList.add('split-text');
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.transitionDelay = `${i * 0.04}s`;
        heroTitle.appendChild(span);
    });
    setTimeout(() => { heroTitle.classList.add('animated'); }, 800);
}

function typewriterEffect() {
    const subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.opacity = '1';
    let i = 0;
    function type() {
        if (i < text.length) { subtitle.textContent += text.charAt(i); i++; setTimeout(type, 50); }
    }
    setTimeout(type, 1200);
}

// ===== COUNTERS =====
let countersAnimated = false;
const statsSection = document.getElementById('stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !countersAnimated) {
            countersAnimated = true;
            document.querySelectorAll('.stat-number').forEach(counter => {
                const target = parseInt(counter.dataset.count);
                const duration = 2500;
                const startTime = performance.now();
                const update = (now) => {
                    const progress = Math.min((now - startTime) / duration, 1);
                    counter.textContent = Math.floor((1 - Math.pow(1 - progress, 4)) * target);
                    if (progress < 1) requestAnimationFrame(update);
                    else counter.textContent = target;
                };
                requestAnimationFrame(update);
            });
        }
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
}

// ===== TESTIMONIALS =====
const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.dot');
let currentTestimonial = 0;
function showTestimonial(idx) {
    testimonialCards.forEach(c => c.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    if (testimonialCards[idx]) testimonialCards[idx].classList.add('active');
    if (dots[idx]) dots[idx].classList.add('active');
}
dots.forEach(dot => { dot.addEventListener('click', () => { currentTestimonial = parseInt(dot.dataset.index); showTestimonial(currentTestimonial); }); });
if (testimonialCards.length > 0) { setInterval(() => { currentTestimonial = (currentTestimonial + 1) % testimonialCards.length; showTestimonial(currentTestimonial); }, 5000); }

// ===== BACK TO TOP =====
if (backToTopBtn) { backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ===== GALLERY FILTERS =====
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        // Re-query all gallery items (including dynamically added ones)
        const allItems = document.querySelectorAll('.gallery-item');
        allItems.forEach((item, i) => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
                setTimeout(() => { item.style.opacity = '1'; item.style.transform = 'scale(1)'; }, i * 50);
            } else {
                item.style.opacity = '0'; item.style.transform = 'scale(0.8)';
                setTimeout(() => { item.style.display = 'none'; }, 300);
            }
        });
        // Also filter cinematics
        filterCinematics(filter);
    });
});

// ===== CINEMATICS FILTER =====
function filterCinematics(category) {
    const grid = document.getElementById('galleryCinematicsGrid');
    if (!grid) return;
    grid.querySelectorAll('.cinematic-card').forEach((card, i) => {
        const cat = card.dataset.category;
        if (category === 'all' || cat === category) {
            card.style.display = '';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 100);
        } else {
            card.style.opacity = '0';
            setTimeout(() => { card.style.display = 'none'; }, 300);
        }
    });
}

// ============================================
// ===== LIGHTBOX - SINGLE IMPLEMENTATION =====
// ============================================
(function() {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbClose = document.querySelector('.lightbox-close');
    
    if (!lb || !lbImg) return;

    function openLightbox(src) {
        if (!src) return;
        lbImg.src = src;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lb.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { lbImg.src = ''; }, 400);
    }

    // Click handler - use capture phase to get it BEFORE other handlers
    document.addEventListener('click', function(e) {
        // Skip if click is inside a cinematic-card (those have links to YouTube)
        if (e.target.closest('.cinematic-card')) return;
        // Skip if click is inside an <a> tag with external link
        const linkEl = e.target.closest('a[href]');
        if (linkEl && linkEl.target === '_blank') return;

        // Find if click was on a gallery-item or featured-item
        const galleryItem = e.target.closest('.gallery-item');
        const featuredItem = e.target.closest('.featured-item');
        const clickedItem = galleryItem || featuredItem;

        if (clickedItem) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const img = clickedItem.querySelector('img');
            if (img) {
                // Get the actual src (handles lazy loading)
                const src = img.currentSrc || img.src || img.getAttribute('src');
                openLightbox(src);
            }
        }
    }, true); // <-- capture: true is key!

    // Close on X button
    if (lbClose) {
        lbClose.addEventListener('click', function(e) {
            e.stopPropagation();
            closeLightbox();
        });
    }

    // Close on clicking anywhere outside the image (backdrop or any area that's not the image)
    lb.addEventListener('click', function(e) {
        if (e.target !== lbImg) {
            closeLightbox();
        }
    });

    // Close on ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeLightbox();
    });
})();

// ===== SMOOTH PAGE TRANSITIONS (skip for gallery/featured items) =====
// Simple navigation - no fade effects that cause blank screens
document.querySelectorAll('a[href]').forEach(link => {
    if (link.hostname === window.location.hostname && !link.getAttribute('href').startsWith('#') && link.target !== '_blank') {
        link.addEventListener('click', (e) => {
            // Don't intercept gallery/featured item clicks
            if (e.target.closest('.gallery-item') || e.target.closest('.featured-item')) return;
            const href = link.getAttribute('href');
            if (href.includes('#') && href.split('#')[0] === '') return;
            // Just navigate normally - no fade effect
        });
    }
});

// ===== PAGE LOAD ENTRANCE =====
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(splitTextAnimation, 500);
    setTimeout(typewriterEffect, 300);
});

// ===== FORM SUBMIT → TELEGRAM =====
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Skip admin login form
        if (form.id === 'loginForm') return;

        const btn = form.querySelector('button[type="submit"]');
        const original = btn ? btn.textContent : '';
        if (btn) { btn.textContent = 'Sending...'; btn.style.opacity = '0.7'; btn.disabled = true; }

        let message = '';

        // Booking form
        if (form.id === 'bookingForm') {
            const firstName = document.getElementById('firstName')?.value || '';
            const lastName = document.getElementById('lastName')?.value || '';
            const email = document.getElementById('email')?.value || '';
            const phone = document.getElementById('phone')?.value || '';
            const eventDate = document.getElementById('eventDate')?.value || '';
            const eventType = document.getElementById('eventType')?.value || '';
            const location = document.getElementById('location')?.value || '';
            const msg = document.getElementById('message')?.value || '';

            message = `📸 *New Booking Request*\n\n` +
                `*Name:* ${firstName} ${lastName}\n` +
                `*Email:* ${email}\n` +
                `*Phone:* ${phone}\n` +
                `*Event Date:* ${eventDate}\n` +
                `*Event Type:* ${eventType}\n` +
                `*Location:* ${location}\n` +
                `*Details:* ${msg}`;
        }
        // Contact form
        else if (form.id === 'contactForm') {
            const name = document.getElementById('cName')?.value || '';
            const email = document.getElementById('cEmail')?.value || '';
            const phone = document.getElementById('cPhone')?.value || '';
            const subject = document.getElementById('cSubject')?.value || '';
            const msg = document.getElementById('cMessage')?.value || '';

            message = `✉️ *New Contact Message*\n\n` +
                `*Name:* ${name}\n` +
                `*Email:* ${email}\n` +
                `*Phone:* ${phone}\n` +
                `*Subject:* ${subject}\n` +
                `*Message:* ${msg}`;
        }
        // Any other form
        else {
            const inputs = form.querySelectorAll('input, textarea, select');
            const parts = [];
            inputs.forEach(input => {
                if (input.type === 'submit' || input.type === 'button') return;
                const label = input.previousElementSibling?.textContent || input.placeholder || input.id || '';
                if (input.value) parts.push(`*${label}:* ${input.value}`);
            });
            message = `📋 *New Form Submission*\n\n` + parts.join('\n');
        }

        try {
            const response = await fetch('/api/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                if (btn) {
                    btn.textContent = '✓ Sent Successfully!';
                    btn.style.background = '#27ae60';
                    btn.style.borderColor = '#27ae60';
                    btn.style.opacity = '1';
                }
                form.reset();
                setTimeout(() => {
                    if (btn) { btn.textContent = original; btn.style.background = ''; btn.style.borderColor = ''; btn.disabled = false; }
                }, 3000);
            } else {
                throw new Error('Failed to send');
            }
        } catch (error) {
            // Fallback to WhatsApp if Telegram fails
            const waMessage = encodeURIComponent(message.replace(/\*/g, '').replace(/\\n/g, '\n'));
            window.location.href = `https://api.whatsapp.com/send?phone=918886644868&text=${waMessage}`;
            if (btn) { btn.textContent = original; btn.style.opacity = '1'; btn.disabled = false; }
        }
    });
});

// ===== LOAD MORE PHOTOS =====
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
    // Load more photos from Cloudinary API
    loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.classList.add('loading');
        fetchGalleryPhotos().then(photos => {
            loadMoreBtn.classList.remove('loading');
            if (photos.length === 0) {
                loadMoreBtn.querySelector('span').textContent = 'No More Photos';
                loadMoreBtn.style.opacity = '0.5'; loadMoreBtn.style.pointerEvents = 'none';
                return;
            }
            // Photos are already loaded by loadUploadedPhotos, so just hide the button
            loadMoreBtn.querySelector('span').textContent = 'No More Photos';
            loadMoreBtn.style.opacity = '0.5'; loadMoreBtn.style.pointerEvents = 'none';
        }).catch(() => {
            loadMoreBtn.classList.remove('loading');
            loadMoreBtn.querySelector('span').textContent = 'No More Photos';
            loadMoreBtn.style.opacity = '0.5'; loadMoreBtn.style.pointerEvents = 'none';
        });
    });
}

// ===== LOAD MORE CINEMATICS =====
function setupCinematicsLoadMore(btnId, gridId) {
    const btn = document.getElementById(btnId);
    const grid = document.getElementById(gridId);
    if (!btn || !grid) return;
    btn.addEventListener('click', () => {
        btn.classList.add('loading');
        setTimeout(() => {
            const hidden = grid.querySelectorAll('.cinematic-card[style*="display: none"], .cinematic-card[style*="display:none"]');
            if (hidden.length === 0) { btn.classList.remove('loading'); btn.querySelector('span').textContent = 'No More Films'; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; return; }
            Array.from(hidden).slice(0, 3).forEach((card, i) => {
                card.style.display = ''; card.style.opacity = '0'; card.style.transform = 'translateY(30px)';
                setTimeout(() => { card.style.transition = 'all 0.6s ease'; card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 150);
            });
            btn.classList.remove('loading');
            if (grid.querySelectorAll('.cinematic-card[style*="display: none"], .cinematic-card[style*="display:none"]').length === 0) {
                btn.querySelector('span').textContent = 'No More Films'; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none';
            }
        }, 800);
    });
}
setupCinematicsLoadMore('loadMoreCinematics', 'cinematicsGrid');
setupCinematicsLoadMore('loadMoreGalleryCinematics', 'galleryCinematicsGrid');

// ===== URL HASH FILTER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return;
        const btn = document.querySelector(`.filter-btn[data-filter="${hash}"]`);
        if (btn) { btn.click(); setTimeout(() => { document.querySelector('.gallery-filters')?.scrollIntoView({ behavior: 'smooth' }); }, 300); }
    }, 3000);
});

// ===== LOAD UPLOADED PHOTOS FROM CLOUDINARY API =====
function loadUploadedPhotos() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    const isUsaDubai = window.location.pathname.includes('international-shoots');

    // Fetch from Cloudinary API (serverless function)
    fetchGalleryPhotos().then(photos => {
        if (photos.length === 0) return;

        // Reverse so that when we prepend each, newest ends up at top
        const filtered = photos.filter(photo => {
            const category = photo.category || getCategoryFromFolder(photo.folder);
            if (isUsaDubai && category !== 'usa' && category !== 'dubai') return false;
            if (!isUsaDubai && (category === 'usa' || category === 'dubai')) return false;
            return true;
        });

        // Reverse: API returns newest first, prepend reverses, so reverse again to keep newest on top
        filtered.reverse().forEach(photo => {
            const category = photo.category || getCategoryFromFolder(photo.folder);
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.category = category;
            item.dataset.publicId = photo.publicId || '';
            item.innerHTML = `
                <img src="${photo.url}" alt="${category}" loading="lazy">
                <div class="gallery-item-overlay"><i class="fas fa-expand"></i></div>
            `;
            galleryGrid.prepend(item);
        });

        // Re-apply current filter if one is active
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter && activeFilter.dataset.filter !== 'all') {
            activeFilter.click();
        }
    }).catch(err => {
        console.warn('Could not load photos from API, falling back to localStorage:', err.message);
        // Fallback to localStorage if API is not available (local development)
        loadUploadedPhotosFromLocalStorage();
    });
}

// Fallback for local development without serverless API
function loadUploadedPhotosFromLocalStorage() {
    const photos = JSON.parse(localStorage.getItem('kp_photos') || '[]');
    if (photos.length === 0) return;

    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    const isUsaDubai = window.location.pathname.includes('international-shoots');

    photos.forEach(photo => {
        if (isUsaDubai && photo.category !== 'usa' && photo.category !== 'dubai') return;
        if (!isUsaDubai && (photo.category === 'usa' || photo.category === 'dubai')) return;

        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.dataset.category = photo.category;
        item.dataset.publicId = photo.publicId || '';
        item.innerHTML = `
            <img src="${photo.src}" alt="${photo.category}" loading="lazy">
            <div class="gallery-item-overlay"><i class="fas fa-expand"></i></div>
        `;
        galleryGrid.prepend(item);
    });
}

// ===== YOUTUBE THUMBNAIL HELPER =====
function getYouTubeThumbnailFromUrl(url) {
    if (!url) return '';
    let videoId = '';
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) { videoId = match[1]; break; }
    }
    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return '';
}

// ===== LOAD UPLOADED VIDEOS INTO CINEMATICS =====
function loadUploadedVideos() {
    const videos = JSON.parse(localStorage.getItem('kp_videos') || '[]');
    if (videos.length === 0) return;

    const grid = document.getElementById('galleryCinematicsGrid') || document.getElementById('cinematicsGrid');
    if (!grid) return;

    const isUsaDubai = window.location.pathname.includes('international-shoots');

    videos.forEach(video => {
        if (isUsaDubai && video.category !== 'usa' && video.category !== 'dubai') return;
        if (!isUsaDubai && (video.category === 'usa' || video.category === 'dubai')) return;

        const card = document.createElement('div');
        card.className = 'cinematic-card';
        card.dataset.category = video.category;
        const thumbSrc = video.thumb || getYouTubeThumbnailFromUrl(video.link) || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fm=webp';
        card.innerHTML = `
            <a href="${video.link}" target="_blank" style="text-decoration:none;color:inherit;">
                <div class="cinematic-thumbnail">
                    <img src="${thumbSrc}" alt="${video.title}" loading="lazy">
                    <div class="cinematic-play"><i class="fas fa-play"></i></div>
                    <span class="cinematic-duration">${video.duration || ''}</span>
                </div>
                <div class="cinematic-info">
                    <h3 class="cinematic-title">${video.title}</h3>
                    <p class="cinematic-desc">${video.desc || ''}</p>
                    <div class="cinematic-meta">
                        <span><i class="fas fa-tag"></i> ${video.category}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(video.date).toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
                    </div>
                </div>
            </a>
        `;
        grid.prepend(card);
    });
}

// Run on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        loadUploadedPhotos();
        loadUploadedVideos();
    }, 100);
});

// ===== ADMIN MODE - DELETE PHOTOS FROM GALLERY =====
(function() {
    const isAdmin = localStorage.getItem('kp_admin_logged_in') === 'true';
    if (!isAdmin) return;

    // Don't show on admin-login page
    if (window.location.pathname.includes('admin-login')) return;

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'admin-mode-toggle visible';
    toggleBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Admin: Delete Mode';
    document.body.appendChild(toggleBtn);

    let adminMode = false;

    toggleBtn.addEventListener('click', () => {
        adminMode = !adminMode;
        document.body.classList.toggle('admin-mode', adminMode);
        toggleBtn.classList.toggle('active', adminMode);
        toggleBtn.innerHTML = adminMode 
            ? '<i class="fas fa-check"></i> Delete Mode ON' 
            : '<i class="fas fa-trash-alt"></i> Admin: Delete Mode';
    });

    // Add delete buttons to all gallery items and featured items
    document.querySelectorAll('.gallery-item, .featured-item').forEach((item, index) => {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'admin-delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        item.style.position = 'relative';
        item.appendChild(deleteBtn);

        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (confirm('Delete this photo from the gallery?')) {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    item.remove();
                    // Track deleted default images
                    const deletedDefaults = JSON.parse(localStorage.getItem('kp_deleted_defaults') || '[]');
                    const img = item.querySelector('img');
                    if (img && img.src) {
                        deletedDefaults.push(img.src);
                        localStorage.setItem('kp_deleted_defaults', JSON.stringify(deletedDefaults));
                    }
                }, 400);
            }
        }, true);
    });
})();

// ===== HIDE DELETED DEFAULT IMAGES =====
(function() {
    const deleted = JSON.parse(localStorage.getItem('kp_deleted_defaults') || '[]');
    if (deleted.length === 0) return;

    document.querySelectorAll('.gallery-item img, .featured-item img').forEach(img => {
        if (deleted.includes(img.src)) {
            img.closest('.gallery-item, .featured-item').remove();
        }
    });
})();

// ===== LOAD CUSTOM HERO BANNERS =====
(function() {
    // Try API first, then fall back to localStorage
    if (typeof fetchBanners === 'function') {
        fetchBanners().then(banners => {
            if (banners.length === 0) return;
            const slideshow = document.querySelector('.hero-slideshow');
            if (!slideshow) return;
            banners.forEach(banner => {
                const slide = document.createElement('div');
                slide.className = 'hero-slide';
                slide.style.backgroundImage = `url('${banner.url}')`;
                slideshow.appendChild(slide);
            });
        }).catch(() => {
            // Fallback to localStorage
            loadBannersFromLocalStorage();
        });
    } else {
        loadBannersFromLocalStorage();
    }

    function loadBannersFromLocalStorage() {
        const banners = JSON.parse(localStorage.getItem('kp_banners') || '[]');
        if (banners.length === 0) return;
        const slideshow = document.querySelector('.hero-slideshow');
        if (!slideshow) return;
        banners.forEach(banner => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            slide.style.backgroundImage = `url('${banner.src}')`;
            slideshow.appendChild(slide);
        });
    }
})();

// ===== LOAD CUSTOM WORLD COVERS =====
(function() {
    function applyWorldCovers(worlds) {
        if (!worlds || Object.keys(worlds).length === 0) return;

        const worldCards = document.querySelectorAll('.world-card');

        // Match by alt text
        worldCards.forEach(card => {
            const img = card.querySelector('.world-card-img img');
            if (!img) return;
            const alt = (img.alt || '').toLowerCase();
            if (alt.includes('wedding') && !alt.includes('pre') && worlds['wedding']) img.src = worlds['wedding'];
            else if (alt.includes('half saree') && worlds['half-saree']) img.src = worlds['half-saree'];
            else if (alt.includes('pre wedding') && worlds['pre-wedding']) img.src = worlds['pre-wedding'];
            else if (alt.includes('baby') && worlds['baby']) img.src = worlds['baby'];
            else if (alt.includes('birthday') && worlds['birthday']) img.src = worlds['birthday'];
            else if (alt.includes('engagement') && worlds['engagement']) img.src = worlds['engagement'];
            else if (alt.includes('haldi') && worlds['haldi']) img.src = worlds['haldi'];
            else if (alt.includes('reception') && worlds['reception']) img.src = worlds['reception'];
            else if (alt.includes('maternity') && worlds['maternity']) img.src = worlds['maternity'];
            else if (alt.includes('international') && worlds['international']) img.src = worlds['international'];
        });
    }

    // Try API first
    if (typeof fetchWorldCovers === 'function') {
        fetchWorldCovers().then(resources => {
            if (resources.length === 0) {
                applyWorldCovers(JSON.parse(localStorage.getItem('kp_worlds') || '{}'));
                return;
            }
            // Convert resources array to category -> url map
            const worlds = {};
            resources.forEach(r => {
                const cat = getCategoryFromFolder(r.folder);
                worlds[cat] = r.url;
            });
            applyWorldCovers(worlds);
        }).catch(() => {
            applyWorldCovers(JSON.parse(localStorage.getItem('kp_worlds') || '{}'));
        });
    } else {
        applyWorldCovers(JSON.parse(localStorage.getItem('kp_worlds') || '{}'));
    }
})();

// ===== LOAD PORTFOLIO ITEMS =====
(function() {
    function renderPortfolioItems(items) {
        const featuredGrid = document.querySelector('.featured-grid');
        if (!featuredGrid || items.length === 0) return;
        // Reverse so newest appears at top when prepending
        [...items].reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'featured-item';
            div.dataset.publicId = item.publicId || '';
            div.innerHTML = `
                <img src="${item.url || item.src}" alt="${item.title || 'Portfolio'}" loading="lazy">
                <div class="featured-overlay">
                    <span class="featured-category">${item.label || item.category || 'Portfolio'}</span>
                    <h3>${item.title || ''}</h3>
                </div>
            `;
            featuredGrid.prepend(div);
        });
    }

    if (typeof fetchPortfolio === 'function') {
        fetchPortfolio().then(resources => {
            if (resources.length === 0) {
                // Fallback to localStorage
                const portfolio = JSON.parse(localStorage.getItem('kp_portfolio') || '[]');
                renderPortfolioItems(portfolio);
                return;
            }
            renderPortfolioItems(resources);
        }).catch(() => {
            const portfolio = JSON.parse(localStorage.getItem('kp_portfolio') || '[]');
            renderPortfolioItems(portfolio);
        });
    } else {
        const portfolio = JSON.parse(localStorage.getItem('kp_portfolio') || '[]');
        renderPortfolioItems(portfolio);
    }
})();

// ===== LOAD ABOUT US IMAGES =====
(function() {
    if (!window.location.pathname.includes('about')) return;

    function applyAboutImages(aboutImages) {
        if (aboutImages.length === 0) return;
        const aboutImageContainer = document.querySelector('.about-image');
        if (!aboutImageContainer) return;

        // Replace main image
        const mainImg = aboutImages.find(i => i.type === 'main') || aboutImages[0];
        if (mainImg) {
            const img = aboutImageContainer.querySelector('img');
            if (img) img.src = mainImg.url || mainImg.src;
        }

        // Add additional images
        const additionals = aboutImages.filter(i => i.type === 'additional');
        if (additionals.length > 0) {
            additionals.forEach(item => {
                const imgEl = document.createElement('img');
                imgEl.src = item.url || item.src;
                imgEl.alt = 'About Keshav Photography';
                imgEl.style.marginTop = '15px';
                imgEl.style.width = '100%';
                imgEl.style.border = '2px solid rgba(212, 175, 55, 0.2)';
                aboutImageContainer.appendChild(imgEl);
            });
        }
    }

    if (typeof fetchAboutImages === 'function') {
        fetchAboutImages().then(resources => {
            if (resources.length === 0) {
                applyAboutImages(JSON.parse(localStorage.getItem('kp_about_images') || '[]'));
                return;
            }
            // Map resources to expected format
            const mapped = resources.map((r, i) => ({
                url: r.url,
                type: i === 0 ? 'main' : 'additional'
            }));
            applyAboutImages(mapped);
        }).catch(() => {
            applyAboutImages(JSON.parse(localStorage.getItem('kp_about_images') || '[]'));
        });
    } else {
        applyAboutImages(JSON.parse(localStorage.getItem('kp_about_images') || '[]'));
    }
})();
