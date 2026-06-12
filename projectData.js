(function () {
  const PROJECTS_CACHE = new Map();
  const RESUME_CACHE = new Map();

  function getBasePrefix(context) {
    return context === "project" ? "../" : "./";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
        return url.href;
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function resolveAssetPath(path, context) {
    if (!path || typeof path !== "string") {
      return "";
    }

    if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) {
      return path;
    }

    if (path.startsWith("./") || path.startsWith("../")) {
      return path;
    }

    return `${getBasePrefix(context)}${path}`;
  }

  function normalizeRichTextSections(section) {
    if (!section || typeof section !== "object") {
      return { en: [], pt: [] };
    }

    return {
      en: Array.isArray(section.en) ? section.en : [],
      pt: Array.isArray(section.pt) ? section.pt : [],
    };
  }

  function buildAutoAssets(project) {
    const autoAssets = project.autoAssets || {};
    if (!autoAssets.enabled) {
      return project.assets || {};
    }

    const baseDir = `assets/projects/${project.slug}`;
    const imageCount = Number(autoAssets.screenshotCount) || 0;
    const videoCount = Number(autoAssets.videoCount) || 0;

    return {
      icon: autoAssets.icon ? `${baseDir}/icon.png` : "",
      cover: autoAssets.cover ? `${baseDir}/cover.png` : "",
      images: Array.from({ length: imageCount }, function (_, index) {
        return `${baseDir}/${index + 1}.png`;
      }),
      videos: Array.from({ length: videoCount }, function (_, index) {
        return `${baseDir}/${index + 1}.mp4`;
      }),
    };
  }

  function normalizeProject(project) {
    const baseAssets = project.assets || {};
    const autoAssets = buildAutoAssets(project);
    const mergedAssets = {
      icon: autoAssets.icon || baseAssets.icon || "",
      cover: autoAssets.cover || baseAssets.cover || "",
      images: Array.isArray(autoAssets.images) && autoAssets.images.length ? autoAssets.images : Array.isArray(baseAssets.images) ? baseAssets.images : [],
      videos: Array.isArray(autoAssets.videos) && autoAssets.videos.length ? autoAssets.videos : Array.isArray(baseAssets.videos) ? baseAssets.videos : [],
    };

    return {
      ...project,
      slug: project.slug || "",
      name: project.name || "Untitled project",
      type: project.type || "other",
      categoryLabel: project.categoryLabel || "Project",
      featured: Boolean(project.featured),
      date: project.date || "",
      status: project.status || "",
      headline: {
        en: project.headline?.en || "",
        pt: project.headline?.pt || "",
      },
      cardDescription: {
        en: project.cardDescription?.en || "",
        pt: project.cardDescription?.pt || "",
      },
      description: normalizeRichTextSections(project.description),
      problem: normalizeRichTextSections(project.problem),
      solution: normalizeRichTextSections(project.solution),
      process: normalizeRichTextSections(project.process),
      challenges: normalizeRichTextSections(project.challenges),
      learned: normalizeRichTextSections(project.learned),
      highlights: normalizeRichTextSections(project.highlights),
      techStack: Array.isArray(project.techStack) ? project.techStack : [],
      roles: {
        en: Array.isArray(project.roles?.en) ? project.roles.en : [],
        pt: Array.isArray(project.roles?.pt) ? project.roles.pt : [],
      },
      team: Array.isArray(project.team) ? project.team : [],
      links: Array.isArray(project.links) ? project.links : [],
      assets: mergedAssets,
      autoAssets: project.autoAssets || { enabled: false },
    };
  }

  async function fetchJson(url, cache) {
    if (cache.has(url)) {
      return cache.get(url);
    }

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const data = await response.json();
    cache.set(url, data);
    return data;
  }

  async function fetchProjects(context) {
    const path = `${getBasePrefix(context)}projects.json`;
    const rawProjects = await fetchJson(path, PROJECTS_CACHE);
    return Array.isArray(rawProjects) ? rawProjects.map(normalizeProject) : [];
  }

  async function fetchResume(context) {
    const path = `${getBasePrefix(context)}resume.json`;
    return fetchJson(path, RESUME_CACHE);
  }

  async function getProjectBySlug(slug, context) {
    const projects = await fetchProjects(context);
    return projects.find(function (project) {
      return project.slug === slug;
    }) || null;
  }

  window.PortfolioData = {
    escapeHtml,
    safeUrl,
    resolveAssetPath,
    normalizeProject,
    fetchProjects,
    fetchResume,
    getProjectBySlug,
  };
})();
