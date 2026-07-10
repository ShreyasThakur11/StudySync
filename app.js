// StudySync Portal Application Logic - Version 2.5
document.addEventListener('DOMContentLoaded', () => {
    // ═══════════════════════════════════════════════════════════════════════
    //  GLOBAL DATA & CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    const MEMBERS = [
        'Aayush',
        'Anvitha Reddy',
        'Arnav Bittu',
        'Aryan Raj',
        'B Chandra Mouli',
        'Dhruv',
        'Ganesh Kumar R',
        'Koushik',
        'Likhita',
        'Naveen',
        'Sathwika',
        'Shreyas',
        'Siddhant Mishra',
        'Sushmitha',
        'Tanish Raina'
    ];

    // 5 News Domains and their corresponding RSS feed queries (focused on high-quality news sources with working links)
    const DOMAIN_FEEDS = [
        {
            id: 'commerce',
            name: '🛒 Major Commerce News',
            feedUrl: 'https://news.google.com/rss/search?q=(commerce+OR+retail+OR+e-commerce)+(site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com+OR+site:wsj.com+OR+site:nytimes.com)&hl=en-US&gl=US&ceid=US:en'
        },
        {
            id: 'business',
            name: '🏢 Business News',
            feedUrl: 'https://news.google.com/rss/search?q=(business+OR+corporate+OR+mergers)+(site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com+OR+site:wsj.com+OR+site:ft.com)&hl=en-US&gl=US&ceid=US:en'
        },
        {
            id: 'economics',
            name: '📊 Economics News',
            feedUrl: 'https://news.google.com/rss/search?q=(economics+OR+inflation+OR+interest+rates)+(site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com+OR+site:wsj.com+OR+site:ft.com)&hl=en-US&gl=US&ceid=US:en'
        },
        {
            id: 'industry',
            name: '🏭 Industry News',
            feedUrl: 'https://news.google.com/rss/search?q=(manufacturing+OR+logistics+OR+supply+chain+OR+factory)+(site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com+OR+site:wsj.com)&hl=en-US&gl=US&ceid=US:en'
        },
        {
            id: 'technology',
            name: '🚀 Technology & Innovation',
            feedUrl: 'https://news.google.com/rss/search?q=(technology+OR+innovation+OR+artificial+intelligence+OR+semiconductors)+(site:techcrunch.com+OR+site:wired.com+OR+site:reuters.com+OR+site:bloomberg.com+OR+site:cnbc.com)&hl=en-US&gl=US&ceid=US:en'
        }
    ];

    // Fallback proxies in order of reliability
    const PROXIES = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://api.codetabs.com/v1/proxy?url='
    ];

    // Mock Backup Articles (Active external working links as fallback)
    const FALLBACK_ARTICLES = {
        commerce: {
            title: "Global e-commerce retail sales projected to top $6.5 trillion this fiscal year",
            description: "Online retail activities continue to see rapid expansion globally, led by growth in emerging market spaces. Consumer spending patterns indicate shifts toward mobile checkout systems and social shopping integrations. Supply logistics have optimized delivery times.",
            link: "https://www.reuters.com/business/retail-consumer/",
            pubDate: new Date().toUTCString()
        },
        business: {
            title: "Boardroom restructuring surges across corporate finance sectors",
            description: "Major corporations are implementing leadership swaps to navigate changing macroeconomic trends and AI integrations. Consolidation remains active as acquisition deals increase in tech and healthcare. Investors push for operational efficiencies.",
            link: "https://www.cnbc.com/business/",
            pubDate: new Date().toUTCString()
        },
        economics: {
            title: "Central banks hold rates steady as global inflation signs stabilize",
            description: "Financial authorities indicate policy actions will remain cautious until consumer pricing declines further. Jobs markets show unexpected resilience, keeping wage growth elevated. Economists project mild expansion indices for the upcoming quarter.",
            link: "https://www.bloomberg.com/markets",
            pubDate: new Date().toUTCString()
        },
        industry: {
            title: "Smart factory investments accelerate to hedge supply chain vulnerabilities",
            description: "Manufacturing leaders are deploying automation and local sourcing channels to reduce delivery dependencies. Raw material inventories are stabilizing, though shipping container shortages persist in vital trade passages. Efficiency rates have hit five-year highs.",
            link: "https://www.reuters.com/business/coporate-industrial-goods/",
            pubDate: new Date().toUTCString()
        },
        technology: {
            title: "Semiconductor innovations breakthrough limitations in high-performance computing",
            description: "New chip designs enable faster processing speeds while reducing power draw requirements for heavy AI model workloads. Hyperscalers are competing for early allocations of upcoming architectures. Developer frameworks continue to expand rapidly.",
            link: "https://techcrunch.com/category/startups/",
            pubDate: new Date().toUTCString()
        }
    };

    // Stored Google Sheets & Forms link persistence
    const DEFAULT_SPREADSHEET = "https://docs.google.com/spreadsheets";
    const DEFAULT_FORM = "https://docs.google.com/forms";
    let spreadsheetLink = localStorage.getItem('studysync_sheet_link') || DEFAULT_SPREADSHEET;
    let formLink = localStorage.getItem('studysync_form_link') || DEFAULT_FORM;

    document.getElementById('link-google-sheet').href = spreadsheetLink;
    document.getElementById('link-google-form').href = formLink;

    // Allow SPoC to configure URLs with right click/context menu
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
    //  SCHEDULE ROTATION & MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    const SCHEDULE_START = new Date('2026-07-07');
    SCHEDULE_START.setHours(0,0,0,0);
    
    let activeSchedule = [];

    // Initialize schedule: load from localStorage if exists, else generate fresh
    function initSchedule() {
        const stored = localStorage.getItem('studysync_editable_schedule');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert date string keys back to Date objects
                activeSchedule = parsed.map(row => ({
                    ...row,
                    date: new Date(row.date)
                }));
            } catch (e) {
                console.error("Error loading stored schedule:", e);
                activeSchedule = generateDefaultSchedule();
            }
        } else {
            activeSchedule = generateDefaultSchedule();
        }
        
        renderSchedule(activeSchedule);
        updateHeroDashboard();
    }

    function generateDefaultSchedule(length = 30) {
        const schedule = [];
        let mIdx = 0;
        const current = new Date(SCHEDULE_START);
        current.setHours(0,0,0,0);
        
        while (schedule.length < length) {
            const dow = current.getDay();
            const isWeekend = dow === 0 || dow === 6;
            
            if (!isWeekend) {
                const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
                schedule.push({
                    date: new Date(current),
                    dateStr: formatDateStr(current),
                    dayName: dayName,
                    assigned: MEMBERS[mIdx % MEMBERS.length],
                    category: 'All 5 Domains',
                    status: current <= new Date().setHours(0,0,0,0) ? 'Completed' : 'Pending'
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

    function updateHeroDashboard() {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let todayDuty = activeSchedule.find(row => isSameDay(row.date, today));
        
        // Weekend or past dates fallback to first pending row
        if (!todayDuty) {
            todayDuty = activeSchedule.find(row => row.date >= today);
        }
        
        if (todayDuty) {
            document.getElementById('today-poster').textContent = todayDuty.assigned;
            document.getElementById('poster-avatar').textContent = todayDuty.assigned.charAt(0);
            
            if (isSameDay(todayDuty.date, today)) {
                document.getElementById('today-badge').textContent = "Active Today";
            } else {
                document.getElementById('today-badge').textContent = `Next Post: ${todayDuty.dateStr}`;
            }
        } else {
            document.getElementById('today-poster').textContent = "No Duty";
            document.getElementById('today-badge').textContent = "Offline";
        }
    }

    // Render schedule table with inline dropdown select inputs
    function renderSchedule(scheduleData) {
        const tbody = document.getElementById('schedule-tbody');
        tbody.innerHTML = '';
        
        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);

        scheduleData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            const isToday = isSameDay(row.date, todayDate);
            if (isToday) {
                tr.className = 'today-row';
            }
            
            // Build dropdown select options for Assigned Poster
            let assignedSelect = `<select class="table-select" data-row="${rowIndex}" data-col="assigned">`;
            MEMBERS.forEach(m => {
                const selected = m === row.assigned ? 'selected' : '';
                assignedSelect += `<option value="${m}" ${selected}>${m}</option>`;
            });
            assignedSelect += `</select>`;

            
            const statusClass = row.status === 'Completed' ? 'status-cell-completed' : 'status-cell-pending';

            tr.innerHTML = `
                <td>${row.dateStr} ${isToday ? '📌' : ''}</td>
                <td>${row.dayName}</td>
                <td>${assignedSelect}</td>
                <td>${row.category}</td>
                <td><span class="${statusClass}">${row.status}</span></td>
            `;

            tbody.appendChild(tr);
        });

        // Add event listeners to dropdown changes
        document.querySelectorAll('.table-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.row, 10);
                const col = e.target.dataset.col;
                const value = e.target.value;
                
                // Update schedule array
                activeSchedule[idx][col] = value;
                
                // Persist changes
                localStorage.setItem('studysync_editable_schedule', JSON.stringify(activeSchedule));
                
                // Update hero cards
                updateHeroDashboard();
                showToast("Schedule updated successfully!");
            });
        });
    }

    // Schedule search filter
    const searchInput = document.getElementById('schedule-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Find matches in the schedule rows
        document.querySelectorAll('#schedule-tbody tr').forEach((tr) => {
            const dateText = tr.cells[0].textContent.toLowerCase();
            const dayText = tr.cells[1].textContent.toLowerCase();
            const assignedSelect = tr.cells[2].querySelector('select');
            const catText = tr.cells[3].textContent.toLowerCase();
            
            const assignedVal = assignedSelect ? assignedSelect.value.toLowerCase() : '';
            
            if (dateText.includes(query) || 
                dayText.includes(query) || 
                assignedVal.includes(query) || 
                catText.includes(query)) {
                tr.style.display = "";
            } else {
                tr.style.display = "none";
            }
        });
    });

    // Schedule actions (Reset & CSV Export)
    document.getElementById('btn-reset-schedule').addEventListener('click', () => {
        if (confirm("Are you sure you want to reset all poster rearrangements back to the default rotating schedule?")) {
            localStorage.removeItem('studysync_editable_schedule');
            initSchedule();
            showToast("Schedule reset to default rotation!");
        }
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Date,Day,Primary Poster,Category,Status\n";
        
        activeSchedule.forEach(row => {
            const line = `"${row.dateStr}","${row.dayName}","${row.assigned}","${row.category}","${row.status}"`;
            csvContent += line + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `StudySync_Schedule_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Downloaded schedule CSV file!");
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  5-DOMAINS NEWS SCRAPER PIPELINE
    // ═══════════════════════════════════════════════════════════════════════

    function showLoader(show) {
        const loader = document.getElementById('feed-loader');
        if (loader) {
            if (show) loader.classList.remove('hidden');
            else loader.classList.add('hidden');
        }
    }

    function showError(show) {
        const error = document.getElementById('feed-error');
        if (error) {
            if (show) error.classList.remove('hidden');
            else error.classList.add('hidden');
        }
    }

    let loadedArticles = {};

    function initNewsScraper() {
        showLoader(true);
        showError(false);
        document.getElementById('feed-articles').innerHTML = '';
        loadedArticles = {};

        // Fetch all 5 domains concurrently
        const fetchPromises = DOMAIN_FEEDS.map(domain => {
            return fetchDomainWithProxyChain(domain, 0)
                .then(parsedArticle => {
                    loadedArticles[domain.id] = parsedArticle;
                    renderDomainCard(domain, parsedArticle);
                })
                .catch(err => {
                    console.warn(`Failed to fetch feed for domain ${domain.id}, loading fallback:`, err);
                    const fallback = getFallback(domain.id);
                    loadedArticles[domain.id] = fallback;
                    renderDomainCard(domain, fallback);
                    showError(true); // show notification badge but keep rendering
                });
        });

        Promise.all(fetchPromises)
            .finally(() => {
                showLoader(false);
                // Enable copy combined post button once loaded
                document.getElementById('btn-copy-combined').disabled = false;
            });
    }

    // Try each proxy in order of list index
    function fetchDomainWithProxyChain(domain, proxyIndex) {
        if (proxyIndex >= PROXIES.length) {
            return Promise.reject(new Error("All proxies failed"));
        }

        const proxy = PROXIES[proxyIndex];
        const fullUrl = proxy + encodeURIComponent(domain.feedUrl);

        return fetch(fullUrl)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                return res.text();
            })
            .then(xmlText => {
                return parseRssArticle(xmlText, domain.id);
            })
            .catch(err => {
                console.log(`Proxy index ${proxyIndex} failed for ${domain.id}, trying next...`);
                return fetchDomainWithProxyChain(domain, proxyIndex + 1);
            });
    }

    function parseRssArticle(xmlText, domainId) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const item = doc.querySelector('item'); // Grab the top, freshest article only
        
        if (!item) throw new Error("No items found in feed XML");

        const title = cleanText(item.querySelector('title')?.textContent || '');
        let description = cleanText(item.querySelector('description')?.textContent || '');
        description = stripHtml(description);
        
        const link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toUTCString();

        if (!title || !description || !link) {
            throw new Error("RSS item is missing vital properties");
        }

        // Format into Background and Summary
        return parseArticleContent(title, description, link, pubDate);
    }

    function getFallback(domainId) {
        const item = FALLBACK_ARTICLES[domainId];
        return parseArticleContent(item.title, item.description, item.link, item.pubDate);
    }

    function cleanText(text) {
        return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
    }

    function stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || doc.body.innerText || html;
    }

    function parseArticleContent(title, description, link, pubDate) {
        let cleanDesc = description.trim();
        
        // Split by sentences
        const sentences = cleanDesc.split(/\.\s+/).filter(s => s.trim().length > 0);
        let background = "";
        let summaryLines = [];
        
        if (sentences.length <= 2) {
            background = sentences.join('. ');
            if (background.slice(-1) !== '.') background += '.';
            summaryLines.push("1. Details are covered in the attached article link.");
            summaryLines.push("2. Key implications cover technology/market shifts.");
        } else {
            background = sentences.slice(0, 2).join('. ');
            if (background.slice(-1) !== '.') background += '.';
            
            const remaining = sentences.slice(2);
            remaining.forEach((s, idx) => {
                let cleanSentence = s.trim();
                if (cleanSentence.slice(-1) !== '.') cleanSentence += '.';
                summaryLines.push(`${idx + 1}. ${cleanSentence}`);
            });
            
            if (summaryLines.length > 3) {
                summaryLines = summaryLines.slice(0, 3);
            }
        }
        
        return {
            title: title,
            background: background,
            summary: summaryLines.join('\n'),
            link: link,
            pubDate: pubDate
        };
    }

    function renderDomainCard(domain, article) {
        const container = document.getElementById('feed-articles');
        
        const card = document.createElement('div');
        card.className = 'news-card';
        card.id = `card-${domain.id}`;
        
        const dateObj = new Date(article.pubDate);
        const timeAgo = getTimeAgo(dateObj);

        card.innerHTML = `
            <div class="news-card-header">
                <span class="cat-badge">${domain.name}</span>
                <div class="news-card-meta">
                    <span>🕒 ${timeAgo}</span>
                </div>
            </div>
            <h3 class="news-card-title">${article.title}</h3>
            
            <div class="news-card-body">
                <div class="format-item">
                    <strong>Title:</strong>
                    <span>${article.title}</span>
                </div>
                <div class="format-item">
                    <strong>Background:</strong>
                    <p>${article.background}</p>
                </div>
                <div class="format-item">
                    <strong>Summary:</strong>
                    <p style="white-space: pre-line;">${article.summary}</p>
                </div>
                <div class="format-item">
                    <strong>Link to Article:</strong>
                    <a href="${article.link}" target="_blank">${article.link}</a>
                </div>
            </div>
            
            <button class="btn btn-secondary btn-sm copy-single-btn" data-id="${domain.id}">
                📋 Copy this domain post
            </button>
        `;

        // Attach event listener for single domain copy
        card.querySelector('.copy-single-btn').addEventListener('click', (e) => {
            const rawMsg = 
                `Title: ${article.title}\n\n` +
                `Background\n${article.background}\n\n` +
                `Summary\n${article.summary}\n\n` +
                `Link to Article:\n${article.link}`;
                
            copyToClipboard(rawMsg, e.target);
        });

        container.appendChild(card);
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "just now";
    }

    // Retry fetching
    document.getElementById('btn-retry-feed').addEventListener('click', () => {
        initNewsScraper();
    });

    // ═══════════════════════════════════════════════════════════════════════
    //  COMBINED CLIPBOARD COPIER
    // ═══════════════════════════════════════════════════════════════════════

    document.getElementById('btn-copy-combined').addEventListener('click', (e) => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        let posterName = "Assigned Member";
        const todayRow = activeSchedule.find(row => isSameDay(row.date, today));
        if (todayRow) posterName = todayRow.assigned;

        // Compile all 5 categories into one combined string
        let compiledMsg = `📚 *Daily StudySync News Roundup - ${dateStr}*\n`;
        compiledMsg += `👤 *Assigned Poster:* ${posterName}\n`;
        compiledMsg += `=========================================\n\n`;

        DOMAIN_FEEDS.forEach((domain, idx) => {
            const art = loadedArticles[domain.id];
            if (art) {
                compiledMsg += `-----------------------------------------\n`;
                compiledMsg += `${domain.name.toUpperCase()}\n`;
                compiledMsg += `-----------------------------------------\n`;
                compiledMsg += `Title: ${art.title}\n\n`;
                compiledMsg += `Background\n${art.background}\n\n`;
                compiledMsg += `Summary\n${art.summary}\n\n`;
                compiledMsg += `Link to Article:\n${art.link}\n\n`;
            }
        });

        compiledMsg += `=========================================\n`;
        compiledMsg += `Mark news posting duty as Completed in StudySync Google Sheet!`;

        copyToClipboard(compiledMsg, e.target);
    });

    function copyToClipboard(text, triggerButton) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast("Message copied! Ready to paste.");
                
                const originalHTML = triggerButton.innerHTML;
                const originalClass = triggerButton.className;
                
                triggerButton.className = "btn btn-success btn-sm";
                if (triggerButton.id === "btn-copy-combined") {
                    triggerButton.className = "btn btn-success btn-lg w-full";
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

    // Set header date widget
    const dateText = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.querySelector('.date-text').textContent = dateText;

    // Run setup
    initSchedule();
    initNewsScraper();
});
