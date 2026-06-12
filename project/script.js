(function () {
  const {
    escapeHtml,
    safeUrl,
    resolveAssetPath,
    getProjectBySlug,
  } = window.PortfolioData;

  const root = document.getElementById("project-root");

  function hashString(value) {
    return String(value)
      .split("")
      .reduce(function (accumulator, char) {
        return (accumulator << 5) - accumulator + char.charCodeAt(0);
      }, 0);
  }

  function fallbackArt(seed, label, compact) {
    const hue = Math.abs(hashString(seed)) % 360;
    const width = compact ? 320 : 1280;
    const height = compact ? 320 : 720;
    const safeLabel = escapeHtml(label || "project");
    return `
      <svg class="fallback-art" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${safeLabel}">
        <defs>
          <linearGradient id="project-${hue}" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue} 85% 62%)" />
            <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 70% 28%)" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#091321"/>
        <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.18)}" r="${Math.round(width * 0.2)}" fill="url(#project-${hue})" opacity="0.8"/>
        <circle cx="${Math.round(width * 0.16)}" cy="${Math.round(height * 0.82)}" r="${Math.round(width * 0.16)}" fill="url(#project-${hue})" opacity="0.24"/>
        <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.82)}" fill="#f3f7ff" font-size="${compact ? 34 : 44}" font-family="Segoe UI, Arial, sans-serif">${safeLabel}</text>
      </svg>
    `;
  }

  function mediaMarkup(src, alt, seed, options) {
    const resolvedSrc = resolveAssetPath(src, "project");
    const isVideo = options?.type === "video";
    const fallback = fallbackArt(seed, alt, options?.compact);
    if (!resolvedSrc) {
      return fallback;
    }

    if (isVideo) {
      return `
        <video controls preload="metadata" onerror="this.replaceWith(document.createRange().createContextualFragment(${JSON.stringify(fallback)}))">
          <source src="${escapeHtml(resolvedSrc)}" />
        </video>
      `;
    }

    return `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.replaceWith(document.createRange().createContextualFragment(${JSON.stringify(fallback)}))" />`;
  }

  function renderTextBlock(title, content) {
    if (!content || !content.length) {
      return "";
    }

    const itemsMarkup = content.map(function (item) {
      return `<p>${escapeHtml(item)}</p>`;
    }).join("");

    return `
      <section class="project-story-block">
        <h2>${escapeHtml(title)}</h2>
        ${itemsMarkup}
      </section>
    `;
  }

  function renderBulletBlock(title, items) {
    if (!items || !items.length) {
      return "";
    }

    return `
      <section class="project-story-block">
        <h2>${escapeHtml(title)}</h2>
        <ul>
          ${items.map(function (item) {
            return `<li>${escapeHtml(item)}</li>`;
          }).join("")}
        </ul>
      </section>
    `;
  }

  function renderLinks(links) {
    const validLinks = links
      .map(function (link) {
        return {
          label: link.label || link.type || "Link",
          url: safeUrl(link.url),
        };
      })
      .filter(function (link) {
        return Boolean(link.url);
      });

    if (!validLinks.length) {
      return "";
    }

    return `
      <section class="detail-block">
        <p class="detail-list-label">Links</p>
        <div class="detail-links">
          ${validLinks.map(function (link) {
            return `<a class="detail-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(link.label)}</span><span>↗</span></a>`;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderDetailList(title, items) {
    if (!items || !items.length) {
      return "";
    }

    return `
      <section class="detail-block">
        <p class="detail-list-label">${escapeHtml(title)}</p>
        <ul class="detail-list">
          ${items.map(function (item) {
            return `<li>${escapeHtml(item)}</li>`;
          }).join("")}
        </ul>
      </section>
    `;
  }

  function renderTeam(team) {
    if (!team || !team.length) {
      return "";
    }

    return `
      <section class="detail-block">
        <p class="detail-list-label">Team</p>
        <div class="team-list">
          ${team.map(function (member) {
            const linkedin = safeUrl(member.linkedin);
            const role = member.role?.en || member.role?.pt || "";
            const linkMarkup = linkedin
              ? `<a href="${escapeHtml(linkedin)}" target="_blank" rel="noreferrer">LinkedIn ↗</a>`
              : "";

            return `
              <article class="team-member">
                <strong>${escapeHtml(member.name || "Team member")}</strong>
                <p>${escapeHtml(role)}</p>
                ${linkMarkup}
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderGallery(project) {
    const images = Array.isArray(project.assets.images) ? project.assets.images : [];
    const videos = Array.isArray(project.assets.videos) ? project.assets.videos : [];
    const mediaItems = images.map(function (src, index) {
      return `<article class="gallery-item">${mediaMarkup(src, `${project.name} screenshot ${index + 1}`, `${project.slug}-image-${index + 1}`)}</article>`;
    }).concat(videos.map(function (src, index) {
      return `<article class="gallery-item">${mediaMarkup(src, `${project.name} video ${index + 1}`, `${project.slug}-video-${index + 1}`, { type: "video" })}</article>`;
    }));

    if (!mediaItems.length) {
      mediaItems.push(`<article class="gallery-item">${fallbackArt(project.slug, `${project.name} gallery`)}</article>`);
    }

    return `
      <section class="project-story-block">
        <h2>Gallery</h2>
        <div class="gallery-grid">
          ${mediaItems.join("")}
        </div>
      </section>
    `;
  }

  function renderProjectPage(project) {
    const iconMarkup = mediaMarkup(project.assets.icon, `${project.name} icon`, `${project.slug}-icon`, { compact: true });
    const description = renderTextBlock("About the project", project.description.en);
    const problem = renderTextBlock("Problem", project.problem.en);
    const solution = renderTextBlock("Solution", project.solution.en);
    const process = renderTextBlock("Process", project.process.en);
    const challenges = renderTextBlock("Challenges", project.challenges.en);
    const learned = renderTextBlock("What I learned", project.learned.en);
    const highlights = renderBulletBlock("Highlights", project.highlights.en);

    root.innerHTML = `
      <section class="project-hero hero-copy">
        <div class="project-badge">
          <div class="project-icon">${iconMarkup}</div>
          <div>
            <p class="project-meta">${escapeHtml(project.categoryLabel)}</p>
            <h1>${escapeHtml(project.name)}</h1>
          </div>
        </div>
        <p class="project-headline">${escapeHtml(project.headline.en || project.cardDescription.en)}</p>
        <div class="meta-row">
          ${project.date ? `<span class="meta-chip">${escapeHtml(project.date)}</span>` : ""}
          ${project.status ? `<span class="meta-chip">${escapeHtml(project.status)}</span>` : ""}
          ${project.type ? `<span class="meta-chip">${escapeHtml(project.type)}</span>` : ""}
        </div>
      </section>

      <div class="project-layout">
        <section class="project-main">
          ${renderGallery(project)}
          ${description}
          ${problem}
          ${solution}
          ${process}
          ${highlights}
          ${challenges}
          ${learned}
        </section>
        <aside class="meta-panel">
          ${renderLinks(project.links)}
          ${renderDetailList("Technologies", project.techStack)}
          ${renderDetailList("My roles", project.roles.en)}
          ${renderTeam(project.team)}
        </aside>
      </div>
    `;

    document.title = `${project.name} | Carolina Santos`;
  }

  function renderNotFound(slug) {
    root.innerHTML = `
      <section class="not-found-card">
        <p class="project-meta">Project not found</p>
        <h1>There is no project registered for “${escapeHtml(slug || "unknown")}".</h1>
        <p>Check the URL slug or add the project to <code>projects.json</code>.</p>
      </section>
    `;
  }

  async function bootstrap() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    if (!slug) {
      renderNotFound("");
      return;
    }

    try {
      const project = await getProjectBySlug(slug, "project");
      if (!project) {
        renderNotFound(slug);
        return;
      }

      renderProjectPage(project);
    } catch (error) {
      renderNotFound(slug);
    }
  }

  bootstrap();
})();
