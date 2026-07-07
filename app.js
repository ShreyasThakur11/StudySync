// StudySync Portal Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════════════════════════════════════════════════════════════
    //  GLOBAL DATA & CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const MEMBERS = [
        'Tanish Raina',
        'B Chandra Mouli',
        'Arnav Bittu',
        'Rayapati Chandana Sushmitha',
        'Yella RamaSurya Pavan',
        'Thirupathi Koushik Sai',
        'Y Dhruv Suhaas',
        'Siddhant Mishra',
        'Ganesh Kumar R',
        'Aryan Raj',
        'Malde Aayush Pritesh',
        'Shreyas Mahendra Thakur',
        'Koppoal Likhita',
        'Seera Naveen Kumar',
        'N.S.V.N. Sathwika'
    ];

    const NEWS_CATEGORIES = [
        'Business & Corporate',
        'Economics & Policy',
        'Finance & Markets',
        'Technology & AI',
        'Strategy & Consulting',
        'Operations & Supply Chain',
        'ESG & Sustainability',
        'Startups & Entrepreneurship',
        'Leadership & Management',
        'Indian Economy',
        'Global Economy',
        'Government & Regulations'
    ];

    // RSS Feed Source URLs
    const FEED_SOURCES = {
        techcrunch: 'https://techcrunch.com/feed/',
        cnbc: 'https://www.cnbc.com/id/10001147/device/rss/rss.html',
        hbr: 'https://news.google.com/rss/search?q=site:hbr.org&hl=en-US&gl=US&ceid=US:en'
    };

    // CORS Proxy for client-side fetching
    const PROXY_URL = 'https://api.allorigins.win/raw?url=';

    // Mock Backup Articles (Loaded immediately on fetch failures / offline fallback)
    const FALLBACK_ARTICLES = {
        techcrunch: [
            {
                title: "Nvidia unveils next-generation AI chip architecture 'Rubin'",
                description: "Nvidia has announced its new Rubin AI chip platform, which will succeed the upcoming Blackwell architecture in 2026. The announcement highlights the company's aggressive yearly cadence for AI hardware. Demand for data center compute continues to outstrip global supply.",
                link: "https://techcrunch.com/nvidia-rubin-ai-chips/",
                pubDate: new Date().toUTCString()
            },
            {
                title: "OpenAI signs multi-year content licensing deal with major news publishers",
                description: "OpenAI has secured agreements with major media organizations to display news content in ChatGPT. The partnerships aim to provide users with real-time, high-quality news sources. Publishers will receive payment and attribution for their material used.",
                link: "https://techcrunch.com/openai-content-licensing-deal/",
                pubDate: new Date().toUTCString()
            }
        ],
        cnbc: [
            {
                title: "Federal Reserve signals higher-for-longer interest rates amid inflation pressures",
                description: "The Federal Reserve held key interest rates steady and indicated that only one rate cut is projected by the end of the year. Economists point to stubborn inflation and a resilient job market as reasons for the hawkish stance. Global bond markets reacted with climbing yields.",
                link: "https://www.cnbc.com/fed-interest-rates-inflation/",
                pubDate: new Date().toUTCString()
            },
            {
                title: "India GDP growth surges to 8.2% for FY24, beating market forecasts",
                description: "India's economy registered stellar expansion driven by strong manufacturing and government infrastructure investment. Global investment banks are raising their growth projections for India, cementing its position as the fastest-growing major economy. Retail consumption showed recovery signs.",
                link: "https://www.cnbc.com/india-gdp-growth-fy24/",
                pubDate: new Date().toUTCString()
            }
        ],
        hbr: [
            {
                title: "Leading your team through AI-driven structural changes",
                description: "Generative AI is changing workflow roles across operations, marketing, and engineering. Managers must design training paths that address skill gaps while reducing employee anxiety. Transparency and strategic vision are key to successful deployment.",
                link: "https://hbr.org/leading-teams-through-ai-change/",
                pubDate: new Date().toUTCString()
            },
            {
                title: "Why sustainable supply chains are resilient supply chains",
                description: "Recent environmental regulations require corporations to audit carbon footprints across scope 1, 2, and 3 emissions. Companies that adopt green supply operations mitigate climate risks and find cost savings through material efficiencies. Diversification reduces logistics bottlenecks.",
                link: "https://hbr.org/sustainable-resilient-supply-chains/",
                pubDate: new Date().toUTCString()
            }
        ]
    };

    // ═══════════════════════════════════════════════════════════════════════
    //  LOCAL STORAGE MANAGEMENT FOR LINKS
    // ═══════════════════════════════════════════════════════════════════════

    // Store spreadsheet and form links in localStorage so SPoCs can customize it
    const DEFAULT_SPREADSHEET = "https://docs.google.com/spreadsheets";
    const DEFAULT_FORM = "https://docs.google.com/forms";

    let spreadsheetLink = localStorage.getItem('studysync_sheet_link') || DEFAULT_SPREADSHEET;
    let formLink = localStorage.getItem('studysync_form_link') || DEFAULT_FORM;

    // Set hrefs
    document.getElementById('link-google-sheet').href = spreadsheetLink;
    document.getElementById('link-google-form').href = formLink;

    // Allow editing links if clicked with Ctrl key, or direct prompt
    document.querySelectorAll('.quick-link-item').forEach(el => {
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const type = el.id === 'link-google-sheet' ? 'Spreadsheet' : 'Form';
            const current = type === 'Spreadsheet' ? spreadsheetLink : formLink;
            const newUrl = prompt(`Enter custom URL for your Google ${type}:`, current);
            if (newUrl) {
                if (type === 'Spreadsheet') {
                    spreadsheetLink = newUrl;
                    localStorage.setItem('studysync_sheet_link', newUrl);
                } else {
                    formLink = newUrl;
                    localStorage.setItem('studysync_form_link', newUrl);
                }
                el.href = newUrl;
                showToast(`Saved custom ${type} link!`);
            }
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  SCHEDULE GENERATION & CORRELATION
    // ═══════════════════════════════════════════════════════════════════════

    // Starting Date for Schedule Rotation (Epoch: July 7, 2026)
    const SCHEDULE_START = new Date('2026-07-07');
    SCHEDULE_START.setHours(0,0,0,0);

    let activeSchedule = [];

    function generateRotationSchedule(startDate, length = 30, includeWeekends = false) {
        const schedule = [];
        let mIdx = 0;
        const current = new Date(startDate);
        current.setHours(0,0,0,0);
        
        while (schedule.length < length) {
            const dow = current.getDay();
            const isWeekend = dow === 0 || dow === 6;
            
            if (includeWeekends || !isWeekend) {
                const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
                
                schedule.push({
                    date: new Date(current),
                    dateStr: formatDateStr(current),
                    dayName: dayName,
                    assigned: MEMBERS[mIdx % MEMBERS.length],
                    backup: MEMBERS[(mIdx + 1) % MEMBERS.length],
                    category: NEWS_CATEGORIES[mIdx % NEWS_CATEGORIES.length],
                    status: current < new Date().setHours(0,0,0,0) ? 'Completed' : 'Pending'
                });
                mIdx++;
            }
            current.setDate(current.getDate() + 1);
        }
        return schedule;
    }

    function formatDateStr(date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    function isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    }

    // Populate Date widget
    const now = new Date();
    document.querySelector('.date-text').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Generate schedule
    activeSchedule = generateRotationSchedule(SCHEDULE_START, 30, false);
    renderSchedule(activeSchedule);

    // Update Hero Dashboard based on today's date
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Find today's row or next upcoming row
    let todayDuty = activeSchedule.find(row => isSameDay(row.date, today));
    
    // If weekend or date outside 30 days, find first pending row
    if (!todayDuty) {
        todayDuty = activeSchedule.find(row => row.date >= today);
    }
    
    if (todayDuty) {
        document.getElementById('today-poster').textContent = todayDuty.assigned;
        document.getElementById('today-category').textContent = todayDuty.category;
        document.getElementById('today-backup').textContent = todayDuty.backup;
        
        // Initial letter avatar
        document.getElementById('poster-avatar').textContent = todayDuty.assigned.charAt(0);
        
        if (isSameDay(todayDuty.date, today)) {
            document.getElementById('today-badge').textContent = "Active Today";
        } else {
            document.getElementById('today-badge').textContent = `Next Post: ${todayDuty.dateStr}`;
        }
    } else {
        document.getElementById('today-poster').textContent = "No Duty";
        document.getElementById('today-category').textContent = "—";
        document.getElementById('today-backup').textContent = "—";
        document.getElementById('today-badge').textContent = "Offline";
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  NEWS SCRAPING & FORMATTING ENGINE
    // ═══════════════════════════════════════════════════════════════════════

    let activeSource = 'techcrunch';
    fetchFeed(activeSource);

    // Tab buttons event listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSource = btn.dataset.source;
            fetchFeed(activeSource);
        });
    });

    // Retry button
    document.getElementById('btn-retry-feed').addEventListener('click', () => {
        fetchFeed(activeSource);
    });

    function showLoader(show) {
        const loader = document.getElementById('feed-loader');
        if (show) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }

    function showError(show) {
        const error = document.getElementById('feed-error');
        if (show) error.classList.remove('hidden');
        else error.classList.add('hidden');
    }

    function fetchFeed(source) {
        showLoader(true);
        showError(false);
        document.getElementById('feed-articles').innerHTML = '';

        const feedUrl = FEED_SOURCES[source];
        const proxyFeedUrl = PROXY_URL + encodeURIComponent(feedUrl);

        fetch(proxyFeedUrl)
            .then(res => {
                if (!res.ok) throw new Error('Network response not ok');
                return res.text();
            })
            .then(xmlText => {
                parseAndRenderFeed(xmlText, source);
            })
            .catch(err => {
                console.error('Error fetching feed, loading fallbacks:', err);
                loadFallbackArticles(source);
            });
    }

    function parseAndRenderFeed(xmlText, source) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, 'text/xml');
            const items = doc.querySelectorAll('item');
            
            if (!items || items.length === 0) {
                throw new Error('No items found in feed');
            }

            const articles = [];
            const count = Math.min(items.length, 6); // Load top 6 stories

            for (let i = 0; i < count; i++) {
                const item = items[i];
                
                // Extract clean text fields
                const title = cleanText(item.querySelector('title')?.textContent || '');
                let description = cleanText(item.querySelector('description')?.textContent || '');
                
                // Strip HTML tags from description if present (HBR/CNBC feeds sometimes have tags)
                description = stripHtml(description);
                
                const link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || '';
                const pubDate = item.querySelector('pubDate')?.textContent || new Date().toUTCString();
                
                if (title && description && link) {
                    articles.push({ title, description, link, pubDate });
                }
            }

            showLoader(false);
            if (articles.length === 0) {
                loadFallbackArticles(source);
            } else {
                renderArticles(articles);
            }
        } catch (e) {
            console.error('Error parsing XML, loading fallbacks:', e);
            loadFallbackArticles(source);
        }
    }

    function loadFallbackArticles(source) {
        showLoader(false);
        showError(true); // Show retry panel but render fallbacks below it
        renderArticles(FALLBACK_ARTICLES[source]);
    }

    function cleanText(text) {
        return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
    }

    function stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || doc.body.innerText || html;
    }

    function renderArticles(articles) {
        const container = document.getElementById('feed-articles');
        container.innerHTML = '';

        articles.forEach((art, index) => {
            const dateObj = new Date(art.pubDate);
            const timeAgo = getTimeAgo(dateObj);
            
            // Format text fields into Background and Summary
            const formatted = parseArticleContent(art.title, art.description, art.link);
            
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-card-header">
                    <span class="cat-badge">${activeSource}</span>
                    <div class="news-card-meta">
                        <span>🕒 ${timeAgo}</span>
                    </div>
                </div>
                <h3 class="news-card-title">${art.title}</h3>
                
                <div class="news-card-body">
                    <div class="format-item">
                        <strong>Title:</strong>
                        <span>${formatted.title}</span>
                    </div>
                    <div class="format-item">
                        <strong>Background:</strong>
                        <p>${formatted.background}</p>
                    </div>
                    <div class="format-item">
                        <strong>Summary:</strong>
                        <p style="white-space: pre-line;">${formatted.summary}</p>
                    </div>
                    <div class="format-item">
                        <strong>Link to Article:</strong>
                        <a href="${formatted.link}" target="_blank">${formatted.link}</a>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-sm copy-feed-btn" data-index="${index}">
                    📋 Copy formatted message
                </button>
            `;
            
            // Attach copy action
            card.querySelector('.copy-feed-btn').addEventListener('click', (e) => {
                const rawMessage = 
                    `Title: ${formatted.title}\n\n` +
                    `Background\n${formatted.background}\n\n` +
                    `Summary\n${formatted.summary}\n\n` +
                    `Link to Article:\n${formatted.link}`;
                
                copyToClipboard(rawMessage, e.target);
            });

            container.appendChild(card);
        });
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "just now";
    }

    /**
     * Splits RSS description paragraphs into requested formatting structures:
     * - Background (1-2 sentences of context)
     * - Summary (bulleted points)
     */
    function parseArticleContent(title, description, link) {
        // Remove trailing or leading junk/publisher tags
        let cleanDesc = description
            .replace(/The post .* appeared first on TechCrunch\./i, '')
            .replace(/\(Bloomberg\) --/g, '')
            .trim();
            
        // Split by sentences (dot + space, check for abbreviation boundaries)
        const sentences = cleanDesc.split(/\.\s+/).filter(s => s.trim().length > 0);
        
        let background = "";
        let summaryLines = [];
        
        if (sentences.length <= 2) {
            background = sentences.join('. ');
            if (background.slice(-1) !== '.') background += '.';
            // Simple split of title words for summary bullet points if description is very short
            summaryLines.push("1. Details are covered in the attached article link.");
            summaryLines.push("2. Key implications cover technology/market shifts.");
        } else {
            // First two sentences represent the background
            background = sentences.slice(0, 2).join('. ');
            if (background.slice(-1) !== '.') background += '.';
            
            // Remaining sentences represent the summary bullet points
            const remaining = sentences.slice(2);
            remaining.forEach((s, idx) => {
                let cleanSentence = s.trim();
                if (cleanSentence.slice(-1) !== '.') cleanSentence += '.';
                summaryLines.push(`${idx + 1}. ${cleanSentence}`);
            });
            
            // Safety cap: limit to 3 bullet points for readability
            if (summaryLines.length > 3) {
                summaryLines = summaryLines.slice(0, 3);
            }
        }
        
        return {
            title: title,
            background: background,
            summary: summaryLines.join('\n'),
            link: link
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CUSTOM FORMATTER INTERACTIVE CONTROLS
    // ═══════════════════════════════════════════════════════════════════════

    const customForm = document.getElementById('custom-formatter-form');
    
    customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const titleVal = document.getElementById('news-title').value.trim();
        const backgroundVal = document.getElementById('news-background').value.trim();
        const summaryVal = document.getElementById('news-summary').value.trim();
        const linkVal = document.getElementById('news-link').value.trim();
        
        // Structure exact copy format
        const formattedMsg = 
            `Title: ${titleVal}\n\n` +
            `Background\n${backgroundVal}\n\n` +
            `Summary\n${summaryVal}\n\n` +
            `Link to Article:\n${linkVal}`;
            
        const submitBtn = document.getElementById('btn-format-copy');
        copyToClipboard(formattedMsg, submitBtn);
    });

    document.getElementById('btn-clear-form').addEventListener('click', () => {
        customForm.reset();
        showToast("Form cleared!");
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  CLIPBOARD COPY CONTROLLERS
    // ═══════════════════════════════════════════════════════════════════════

    function copyToClipboard(text, triggerButton) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast("Message copied! Ready to paste.");
                
                // Visual Button Feedback
                const originalHTML = triggerButton.innerHTML;
                const originalClass = triggerButton.className;
                
                triggerButton.className = "btn btn-success btn-sm w-full";
                if (triggerButton.id === "btn-format-copy") {
                    triggerButton.className = "btn btn-success w-full";
                }
                triggerButton.innerHTML = "✓ Copied to Clipboard!";
                
                setTimeout(() => {
                    triggerButton.innerHTML = originalHTML;
                    triggerButton.className = originalClass;
                }, 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
                showToast("❌ Copy failed. Please copy manually.");
            });
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SCHEDULE RENDER & SEARCH CONTROLS
    // ═══════════════════════════════════════════════════════════════════════

    function renderSchedule(scheduleData) {
        const tbody = document.getElementById('schedule-tbody');
        tbody.innerHTML = '';
        
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);

        scheduleData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Check if today
            const isToday = isSameDay(row.date, todayDate);
            if (isToday) {
                tr.className = 'today-row';
            }
            
            const statusClass = row.status === 'Completed' ? 'status-cell-completed' : 'status-cell-pending';

            tr.innerHTML = `
                <td>${row.dateStr} ${isToday ? '📌' : ''}</td>
                <td>${row.dayName}</td>
                <td>${row.assigned}</td>
                <td>${row.backup}</td>
                <td>${row.category}</td>
                <td><span class="${statusClass}">${row.status}</span></td>
            `;
            
            // Allow clicking row to copy the assigned category & info directly into Formatter
            tr.style.cursor = "pointer";
            tr.addEventListener('click', () => {
                document.getElementById('news-title').focus();
                // Set default info to formatter fields
                document.getElementById('news-link').value = "";
                document.getElementById('news-title').value = `[Category: ${row.category}] `;
                document.getElementById('news-background').value = `Daily business/economics news assignment for ${row.dateStr}.`;
                
                // Scroll smoothly to formatter card
                document.getElementById('formatter-section').scrollIntoView({ behavior: 'smooth' });
                showToast(`Loaded details for ${row.assigned}'s assignment!`);
            });

            tbody.appendChild(tr);
        });
    }

    // Interactive Search
    const searchInput = document.getElementById('schedule-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = activeSchedule.filter(row => {
            return row.assigned.toLowerCase().includes(query) ||
                   row.backup.toLowerCase().includes(query) ||
                   row.category.toLowerCase().includes(query) ||
                   row.dateStr.includes(query) ||
                   row.dayName.toLowerCase().includes(query);
        });
        
        renderSchedule(filtered);
    });
});
