import { DOC_GROUPS } from "./config.js";

// ===== Build lookup maps =====
const PATH_TO_DOC = new Map();
const PATH_TO_GROUP = new Map();

DOC_GROUPS.forEach(group => {
    group.files.forEach(file => {
        PATH_TO_DOC.set(file.path, file);
        PATH_TO_GROUP.set(file.path, group);
    });
});

// ===== Sidebar =====
function renderSidebar() {
    const nav = document.getElementById("sidebarNav");
    let html = "";

    // Group by parent
    const mainGroups = DOC_GROUPS.filter(g => !g.parent);
    const subGroups = DOC_GROUPS.filter(g => g.parent);

    mainGroups.forEach((group) => {
        html += `<div class="nav-group">`;
        html += `<div class="nav-group-title">${group.title}</div>`;
        group.files.forEach((file, i) => {
            const id = `${group.title}-${i}`;
            html += `<a class="nav-item" data-id="${id}" data-path="${file.path}" data-label="${file.label}">`;
            html += `<span class="nav-label">${file.label}</span>`;
            html += `</a>`;
        });

        // Find child groups
        const children = subGroups.filter(g => g.parent === group.title);
        children.forEach((child) => {
            const folderLabel = child.label || child.title;
            html += `<div class="nav-folder">`;
            html += `<div class="nav-folder-header" data-folder="${child.title}">`;
            html += `<span class="arrow">▶</span>`;
            html += `<span>${folderLabel}</span>`;
            html += `</div>`;
            html += `<div class="nav-folder-children" id="folder-${child.title}">`;
            child.files.forEach((file, i) => {
                const id = `${child.title}-${i}`;
                html += `<a class="nav-item" data-id="${id}" data-path="${file.path}" data-label="${file.label}">`;
                html += `<span class="nav-label">${file.label}</span>`;
                html += `</a>`;
            });
            html += `</div>`;
            html += `</div>`;
        });

        html += `</div>`;
    });
    nav.innerHTML = html;

    // Bind doc click
    nav.querySelectorAll(".nav-item").forEach((item) => {
        item.addEventListener("click", () => {
            loadDoc(item.dataset.path, item.dataset.label);
            setActiveNav(item);
            closeSidebar();
        });
    });

    // Bind folder toggle
    nav.querySelectorAll(".nav-folder-header").forEach((header) => {
        header.addEventListener("click", () => {
            const folder = header.dataset.folder;
            const children = document.getElementById(`folder-${folder}`);
            header.classList.toggle("expanded");
            children.classList.toggle("expanded");
        });
    });
}

function setActiveNav(activeItem) {
    document
        .querySelectorAll(".nav-item")
        .forEach((el) => el.classList.remove("active"));
    if (activeItem) activeItem.classList.add("active");
}

function setActiveNavByPath(path) {
    const navItem = document.querySelector(`.nav-item[data-path="${path}"]`);
    if (!navItem) return;

    setActiveNav(navItem);

    // Expand parent folder if in sub-group
    const group = PATH_TO_GROUP.get(path);
    if (!group || !group.parent) return;

    // Expand the folder
    const folderHeader = document.querySelector(`.nav-folder-header[data-folder="${group.title}"]`);
    const folderChildren = document.getElementById(`folder-${group.title}`);

    if (folderHeader) folderHeader.classList.add("expanded");
    if (folderChildren) folderChildren.classList.add("expanded");

    // Scroll nav item into view
    navItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ===== Mobile sidebar =====
function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document
        .getElementById("sidebarOverlay")
        .classList.remove("show");
}

function initMobileSidebar() {
    document
        .getElementById("sidebarToggle")
        .addEventListener("click", () => {
            document.getElementById("sidebar").classList.toggle("open");
            document
                .getElementById("sidebarOverlay")
                .classList.toggle("show");
        });

    document
        .getElementById("sidebarOverlay")
        .addEventListener("click", closeSidebar);
}

// ===== Breadcrumb =====
function updateBreadcrumb(path) {
    const group = PATH_TO_GROUP.get(path);
    const doc = PATH_TO_DOC.get(path);
    if (!group || !doc) return;

    const breadcrumbEl = document.getElementById("breadcrumbCurrent");
    
    // Find root group (Bridge)
    const rootGroup = group.parent 
        ? DOC_GROUPS.find(g => g.title === group.parent)
        : group;
    const rootLabel = rootGroup ? (rootGroup.label || rootGroup.title) : "Bridge";
    
    if (group.parent) {
        // Sub-group: Bridge / 05 - Conventions / 00 - Index
        breadcrumbEl.innerHTML = `${rootLabel} / ${group.label || group.title} / ${doc.label}`;
    } else {
        // Main group: Bridge / 00 - Index
        breadcrumbEl.innerHTML = `${rootLabel} / ${doc.label}`;
    }
}

// ===== Load & Render MD =====
async function loadDoc(path, label) {
    const content = document.getElementById("mdContent");
    content.innerHTML = '<div class="loading">加载中</div>';
    
    // Update breadcrumb
    updateBreadcrumb(path);
    
    document.title = `${label || "Docs"} - Oozora`;

    // Update URL hash
    window.location.hash = encodeURIComponent(path);

    try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        renderMarkdown(md);
    } catch (err) {
        content.innerHTML = `<p style="color: var(--text-muted);">无法加载文档：<code>${path}</code><br><small>${err.message}</small></p>`;
    }
}

function renderMarkdown(md) {
    const content = document.getElementById("mdContent");

    // Configure marked
    marked.setOptions({
        gfm: true,
        breaks: false,
    });

    content.innerHTML = marked.parse(md);

    // Render mermaid blocks
    renderMermaid(content);

    // Handle links: external -> new tab, internal -> router navigation
    content.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;

        // External link
        if (href.startsWith("http")) {
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            return;
        }

        // Internal doc link: /md/index.html#bridge/xxx.md
        if (href.startsWith("/md/index.html#")) {
            a.addEventListener("click", (e) => {
                e.preventDefault();
                const path = href.replace("/md/index.html#", "");
                const doc = PATH_TO_DOC.get(path);
                if (doc) {
                    loadDoc(path, doc.label);
                    setActiveNavByPath(path);
                    // Update URL without reloading
                    window.history.pushState(null, "", href);
                }
            });
        }
    });

    // Build TOC
    buildToc(content);
}

// ===== Mermaid =====
async function renderMermaid(container) {
    const codeBlocks = container.querySelectorAll("code.language-mermaid");
    if (codeBlocks.length === 0) return;
    if (typeof mermaid === "undefined") return;

    // Init mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
    });

    for (let i = 0; i < codeBlocks.length; i++) {
        const code = codeBlocks[i];
        const pre = code.parentElement;
        const graphDef = code.textContent;

        try {
            const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, graphDef);
            const div = document.createElement("div");
            div.className = "mermaid-chart";
            div.innerHTML = svg;
            pre.replaceWith(div);
        } catch (err) {
            pre.outerHTML = `<div class="mermaid-error">Mermaid 渲染失败: ${err.message}</div>`;
        }
    }
}

// ===== TOC =====
function buildToc(container) {
    const tocLinks = document.getElementById("tocLinks");
    const headings = container.querySelectorAll("h2, h3, h4");
    tocLinks.innerHTML = "";

    headings.forEach((h, i) => {
        if (!h.id) h.id = `heading-${i}`;
        const a = document.createElement("a");
        a.className = "toc-link";
        a.href = `#${h.id}`;
        a.textContent = h.textContent;
        a.dataset.level = h.tagName.replace("H", "");
        tocLinks.appendChild(a);
    });

    // Highlight active on scroll
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const link = tocLinks.querySelector(
                    `a[href="#${entry.target.id}"]`,
                );
                if (link) {
                    if (entry.isIntersecting) {
                        tocLinks
                            .querySelectorAll(".toc-link")
                            .forEach((l) =>
                                l.classList.remove("active"),
                            );
                        link.classList.add("active");
                    }
                }
            });
        },
        { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
}

// ===== Init =====
export function init() {
    renderSidebar();
    initMobileSidebar();

    // Load from hash or first doc
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash) {
        const navItem = document.querySelector(
            `.nav-item[data-path="${hash}"]`,
        );
        if (navItem) {
            loadDoc(navItem.dataset.path, navItem.dataset.label);
            setActiveNavByPath(hash);
        } else {
            loadDoc(
                DOC_GROUPS[0].files[0].path,
                DOC_GROUPS[0].files[0].label,
            );
            setActiveNav(document.querySelector(".nav-item"));
        }
    } else {
        loadDoc(
            DOC_GROUPS[0].files[0].path,
            DOC_GROUPS[0].files[0].label,
        );
        setActiveNav(document.querySelector(".nav-item"));
    }

    // Hash change
    window.addEventListener("hashchange", () => {
        const h = decodeURIComponent(window.location.hash.slice(1));
        const navItem = document.querySelector(
            `.nav-item[data-path="${h}"]`,
        );
        if (navItem) {
            loadDoc(navItem.dataset.path, navItem.dataset.label);
            setActiveNavByPath(h);
        }
    });
}
