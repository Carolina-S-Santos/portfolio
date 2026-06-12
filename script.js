(function () {
  const {
    escapeHtml,
    safeUrl,
    resolveAssetPath,
    fetchProjects,
    fetchResume,
  } = window.PortfolioData;

  const projectGrid = document.getElementById("project-grid");
  const filters = document.getElementById("project-filters");
  const heroLinks = document.getElementById("hero-links");
  const heroFocusList = document.getElementById("hero-focus-list");
  const aboutContent = document.getElementById("about-content");
  const skillsGrid = document.getElementById("skills-grid");
  const contactGrid = document.getElementById("contact-grid");

  let allProjects = [];
  let activeFilter = "featured";

  function createFallbackArt(seed, label) {
    const hue = Math.abs(hashString(seed)) % 360;
    const safeLabel = escapeHtml(label || "project");
    return `
      <svg class="fallback-art" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${safeLabel}">
        <defs>
          <linearGradient id="g-${hue}" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue} 85% 62%)" stop-opacity="0.90" />
            <stop offset="100%" stop-color="hsl(${(hue + 55) % 360} 78% 32%)" stop-opacity="0.42" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="#091321"/>
        <circle cx="980" cy="140" r="180" fill="url(#g-${hue})" opacity="0.72"/>
        <circle cx="180" cy="680" r="220" fill="url(#g-${hue})" opacity="0.28"/>
        <path d="M0 620C220 540 360 530 520 580C690 632 880 736 1200 670V800H0Z" fill="rgba(255,255,255,0.06)"/>
        <rect x="84" y="92" width="188" height="18" rx="9" fill="rgba(255,255,255,0.14)"/>
        <rect x="84" y="130" width="340" height="28" rx="14" fill="rgba(255,255,255,0.12)"/>
        <rect x="84" y="178" width="290" height="18" rx="9" fill="rgba(255,255,255,0.10)"/>
        <text x="84" y="710" fill="#f3f7ff" font-size="48" font-family="Segoe UI, Arial, sans-serif">${safeLabel}</text>
      </svg>
    `;
  }

  function hashString(value) {
    return String(value)
      .split("")
      .reduce(function (accumulator, char) {
        return (accumulator << 5) - accumulator + char.charCodeAt(0);
      }, 0);
  }

  function createMediaMarkup(src, alt, seed) {
    const resolvedSrc = resolveAssetPath(src, "home");
    const fallback = createFallbackArt(seed, alt);
    if (!resolvedSrc) {
      return fallback;
    }

    return `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment(${JSON.stringify(fallback)}))" />`;
  }

  function filterProjects(type) {
    if (type === "all") {
      return allProjects;
    }

    if (type === "featured") {
      return allProjects.filter(function (project) {
        return project.featured;
      });
    }

    return allProjects.filter(function (project) {
      return project.type === type;
    });
  }

  function renderProjectCards(projects) {
    if (!projectGrid) {
      return;
    }

    if (!projects.length) {
      projectGrid.innerHTML = '<div class="empty-state">No projects available for this filter yet.</div>';
      return;
    }

    projectGrid.innerHTML = projects
      .map(function (project) {
        const coverMarkup = createMediaMarkup(project.assets.cover, `${project.name} cover`, project.slug);
        const headline = project.headline.en || project.cardDescription.en || "";
        const description = project.cardDescription.en || headline;
        const techPreview = project.techStack.slice(0, 3);
        const role = project.roles.en[0] || "Builder";

        return `
          <a class="project-card" href="project/?slug=${encodeURIComponent(project.slug)}" aria-label="Open ${escapeHtml(project.name)} project page">
            <div class="project-card-media">${coverMarkup}</div>
            <div class="project-card-copy">
              <p class="project-meta">${escapeHtml(project.categoryLabel)}</p>
              <div class="project-card-header">
                <div>
                  <h3>${escapeHtml(project.name)}</h3>
                  <p>${escapeHtml(description)}</p>
                </div>
                <span class="project-card-arrow" aria-hidden="true">↗</span>
              </div>
              <div class="stack-row">
                ${techPreview.map(function (item) {
                  return `<span class="stack-pill">${escapeHtml(item)}</span>`;
                }).join("")}
              </div>
              <div class="project-card-footer">
                <span class="role-label">${escapeHtml(role)}</span>
                <span class="role-label">${escapeHtml(project.date)}</span>
              </div>
            </div>
          </a>
        `;
      })
      .join("");
  }

  function setActiveFilter(type) {
    activeFilter = type;
    filters.querySelectorAll("[data-filter]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.filter === type);
    });
    renderProjectCards(filterProjects(type));
  }

  function renderHeroLinks(links) {
    if (!heroLinks) {
      return;
    }

    heroLinks.innerHTML = links
      .map(function (link, index) {
        const url = safeUrl(link.url);
        if (!url) {
          return "";
        }

        const className = index === 0 ? "primary-link" : "ghost-link";
        return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`;
      })
      .join("");
  }

  function renderList(container, items, className) {
    if (!container) {
      return;
    }

    container.innerHTML = items
      .map(function (item) {
        return `<span class="${className}">${escapeHtml(item)}</span>`;
      })
      .join("");
  }

  function renderAbout(paragraphs) {
    if (!aboutContent) {
      return;
    }

    aboutContent.innerHTML = paragraphs
      .map(function (paragraph) {
        return `<p>${escapeHtml(paragraph)}</p>`;
      })
      .join("");
  }

  function renderContacts(items) {
    if (!contactGrid) {
      return;
    }

    contactGrid.innerHTML = items
      .map(function (item) {
        const url = safeUrl(item.url);
        const body = url
          ? `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(item.value)}</a>`
          : escapeHtml(item.value);

        return `
          <article class="contact-item">
            <p class="project-meta">${escapeHtml(item.label)}</p>
            <h3>${body}</h3>
            <p>${escapeHtml(item.description || "")}</p>
          </article>
        `;
      })
      .join("");
  }

  async function bootstrap() {
    try {
      const [projects, resume] = await Promise.all([
        fetchProjects("home"),
        fetchResume("home"),
      ]);

      allProjects = projects;
      renderProjectCards(filterProjects(activeFilter));

      document.getElementById("hero-kicker").textContent = resume.hero.kicker;
      document.getElementById("hero-title").textContent = resume.hero.title;
      document.getElementById("hero-subtitle").textContent = resume.hero.subtitle;

      renderHeroLinks(resume.hero.links || []);
      heroFocusList.innerHTML = (resume.hero.focus || [])
        .map(function (item) {
          return `<li>${escapeHtml(item)}</li>`;
        })
        .join("");
      renderAbout(resume.about || []);
      renderList(skillsGrid, resume.skills || [], "tag");
      renderContacts(resume.contact || []);
    } catch (error) {
      if (projectGrid) {
        projectGrid.innerHTML = `<div class="empty-state">Failed to load portfolio data. ${escapeHtml(error.message)}</div>`;
      }
    }
  }

  if (filters) {
    filters.addEventListener("click", function (event) {
      const button = event.target.closest("[data-filter]");
      if (!button) {
        return;
      }
      setActiveFilter(button.dataset.filter);
    });
  }

  bootstrap();
})();
