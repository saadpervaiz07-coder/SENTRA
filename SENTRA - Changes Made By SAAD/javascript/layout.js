/* =========================================================
   SENTRA — layout.js (Multi-Aware / SPA Router)
   ---------------------------------------------------------
   Works with the unified index.html that contains all pages
   as <section class="page-section" data-page="..."> blocks.

   Responsibilities:
   1. Inject shared topbar + sidebar into their slots
   2. Handle client-side routing (show/hide page sections)
   3. Update active nav item
   4. Global badge count
   5. Bell + user dropdown + global search
   ========================================================= */

(function () {
    "use strict";

    /* ---------- Global mock data for badge counts ---------- */
    const mockAlertsData = [
        { id: 1, status: "Open" },
        { id: 2, status: "Open" },
        { id: 3, status: "Resolved" },
        { id: 4, status: "Open" },
        { id: 5, status: "Open" }
    ];

    function updateGlobalBadgeCount() {
        const openAlerts = mockAlertsData.filter(a => a.status === "Open").length;
        const sidebarBadge = document.getElementById("sidebar-alert-badge");
        if (sidebarBadge) sidebarBadge.innerText = openAlerts;
        const topbarBadge = document.getElementById("topbar-bell-badge");
        if (topbarBadge) topbarBadge.innerText = openAlerts;
    }


    /* ---------- HTML fragments for the shared shell ---------- */
    const TOPBAR_HTML = `
        <div class="brand">
            <span class="logo-mark">
                <img src="assets/favicon.svg" alt="SENTRA" width="38" height="38">
            </span>
            <div>
                <div class="brand-name">SENTRA</div>
                <div class="brand-tagline">AI CCTV Investigation Support System</div>
            </div>
        </div>

        <div class="topbar-system-label">AI CCTV Investigation Support System</div>

        <div class="topbar-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="global-search-input" placeholder="Search events, people, vehicles...">
        </div>

        <div class="topbar-right">
            <button class="icon-btn" id="topbar-bell-btn" aria-label="Notifications">
                <i class="fa-solid fa-bell"></i>
                <span class="icon-btn-badge" id="topbar-bell-badge">0</span>
            </button>

            <div class="user-menu-container" style="position: relative;">
                <div class="user-chip" id="user-menu-toggle" style="cursor: pointer;">
                    <span class="user-avatar"><i class="fa-solid fa-user"></i></span>
                    <div>
                        <p class="user-name">Ahsan Raza</p>
                        <p class="user-role">Investigator</p>
                    </div>
                    <span class="user-caret"><i class="fa-solid fa-chevron-down"></i></span>
                </div>

                <div class="user-dropdown-menu" id="user-dropdown-menu"
                     style="display:none; position:absolute; right:0; top:110%;
                            background-color:#1a233a; border:1px solid #2a3656;
                            border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3);
                            width:180px; z-index:1000; overflow:hidden;">
                    <a href="#" class="dropdown-item" data-navigate="settings"
                       style="display:flex; align-items:center; gap:10px;
                              padding:10px 16px; color:#fff; font-size:14px;">
                        <i class="fa-solid fa-user-gear"></i> Profile &amp; Settings
                    </a>
                    <a href="#" id="dropdown-logout-btn"
                       style="display:flex; align-items:center; gap:10px;
                              padding:10px 16px; color:#ff5c5c; font-size:14px;
                              border-top:1px solid #2a3656;">
                        <i class="fa-solid fa-right-from-bracket"></i> Log Out
                    </a>
                </div>
            </div>
        </div>
    `;

    const NAV_ITEMS = [
        { page: "dashboard",      icon: "fa-house",            label: "Dashboard" },
        { page: "investigations", icon: "fa-briefcase",        label: "Investigations" },
        { page: "cctv-events",    icon: "fa-video",            label: "CCTV Events" },
        { page: "alerts",         icon: "fa-bell",             label: "Alerts", badge: true },
        { page: "video-search",   icon: "fa-magnifying-glass", label: "Video Search" },
        { page: "event-timeline", icon: "fa-timeline",         label: "Event Timeline" },
        { page: "reports",        icon: "fa-file-lines",       label: "Reports" },
        { page: "settings",       icon: "fa-gear",             label: "Settings" }
    ];

    function buildSidebarHTML() {
        const items = NAV_ITEMS.map(item => `
            <a href="#${item.page}" class="nav-item" data-page="${item.page}" data-navigate="${item.page}">
                <span class="nav-icon"><i class="fa-solid ${item.icon}"></i></span>
                <span>${item.label}</span>
                ${item.badge ? '<span class="nav-badge" id="sidebar-alert-badge">0</span>' : ''}
            </a>
        `).join("");

        return `
            <nav class="sidebar-nav">${items}</nav>
            <div class="sidebar-footer">
                <div class="status-pill">
                    <span class="status-dot"></span>
                    <div>
                        <p>Connected to Database</p>
                        <p class="text-muted">Local Server</p>
                        <p class="text-muted">v2.0.0</p>
                    </div>
                </div>
                <p class="sidebar-motto">Built for a safer tomorrow</p>
            </div>
        `;
    }


    /* ---------- ROUTER ---------- */
    function showPage(pageName) {
        const sections = document.querySelectorAll(".page-section");
        if (!sections.length) {
            console.warn("No .page-section elements found.");
            return;
        }

        let found = false;
        sections.forEach(sec => {
            const isTarget = sec.dataset.page === pageName;
            sec.classList.toggle("hidden", !isTarget);
            if (isTarget) found = true;
        });

        if (!found) {
            // Fallback to dashboard if unknown page
            const fallback = document.querySelector('.page-section[data-page="dashboard"]');
            if (fallback) fallback.classList.remove("hidden");
        }

        // Update active nav item
        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.toggle("active", item.dataset.page === pageName);
        });

        // Reflect on <body> for any page-specific CSS hooks
        document.body.dataset.page = pageName;

        // Scroll to top
        window.scrollTo(0, 0);
    }

    function currentRouteFromHash() {
        const hash = (window.location.hash || "").replace(/^#/, "").trim();
        return hash || "dashboard";
    }


    /* ---------- INIT ---------- */
    function init() {
        // 1. Inject topbar + sidebar into their slots
        const topbarSlot = document.getElementById("global-topbar-slot");
        if (topbarSlot && !topbarSlot.dataset.filled) {
            topbarSlot.innerHTML = TOPBAR_HTML;
            topbarSlot.dataset.filled = "1";
        }

        const sidebarSlot = document.getElementById("sidebar-slot");
        if (sidebarSlot && !sidebarSlot.dataset.filled) {
            sidebarSlot.innerHTML = buildSidebarHTML();
            sidebarSlot.dataset.filled = "1";
        }

        // 2. Wire navigation
        document.querySelectorAll("[data-navigate]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                const target = el.dataset.navigate;
                if (!target) return;
                window.location.hash = target;   // triggers hashchange → showPage
                // Close dropdown if open
                const dd = document.getElementById("user-dropdown-menu");
                if (dd) dd.style.display = "none";
            });
        });

        // 3. Listen to hash changes
        window.addEventListener("hashchange", () => {
            showPage(currentRouteFromHash());
        });

        // 4. Initial route
        showPage(currentRouteFromHash());

        // 5. Badges
        updateGlobalBadgeCount();

        // 6. Bell → alerts page
        const bellBtn = document.getElementById("topbar-bell-btn");
        if (bellBtn) {
            bellBtn.addEventListener("click", () => {
                window.location.hash = "alerts";
            });
        }

        // 7. User dropdown
        const userToggle = document.getElementById("user-menu-toggle");
        const userDropdown = document.getElementById("user-dropdown-menu");
        const logoutBtn = document.getElementById("dropdown-logout-btn");

        if (userToggle && userDropdown) {
            userToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                const visible = userDropdown.style.display === "block";
                userDropdown.style.display = visible ? "none" : "block";
            });

            document.addEventListener("click", (e) => {
                if (!userToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.style.display = "none";
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.clear();
                sessionStorage.clear();
                // window.location.href = "login.html";  // enable when login page exists
            });
        }

        // 8. Global search router (unchanged behavior, but routes via hash now)
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) {
            searchInput.addEventListener("keypress", (e) => {
                if (e.key !== "Enter") return;
                const query = searchInput.value.trim();
                if (!query) return;

                const q = query.toLowerCase();
                if (q.includes("alert") || q.includes("loitering") || q.includes("suspicious")) {
                    window.location.hash = "alerts";
                } else if (q.includes("event") || q.includes("camera") || q.includes("feed")) {
                    window.location.hash = "cctv-events";
                } else {
                    window.location.hash = "video-search";
                }
                // Note: query string forwarding (alerts.html?query=...) is dropped
                // because we're now single-page. If you need it, stash in sessionStorage.
                sessionStorage.setItem("globalQuery", query);
            });
        }
    }


    /* ---------- BOOTSTRAP ---------- */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // Expose router for other scripts (e.g. quick-action buttons)
    window.SENTRA = window.SENTRA || {};
    window.SENTRA.showPage = showPage;
    window.SENTRA.navigate = (page) => { window.location.hash = page; };

})();