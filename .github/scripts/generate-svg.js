const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../..");
const projectsPath = path.join(rootDir, "projects.json");
const outputPath = path.join(rootDir, "latest-projects.svg");

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  const usedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (usedWords < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[. ]+$/, "")}...`;
  }

  return lines;
}

function normalizeProjects(projects) {
  return projects.map((project) => ({
    name: project.name || "Untitled",
    slug: project.slug || "",
    categoryLabel: project.categoryLabel || "Project",
    featured: Boolean(project.featured),
    headline: project.headline?.en || project.cardDescription?.en || "",
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    date: project.date || "",
  }));
}

function renderProjectCard(project) {
  const title = escapeXml(project.name);
  const category = escapeXml(project.categoryLabel.toUpperCase());
  const headlineLines = wrapText(project.headline, 48, 3);
  const techLines = wrapText(project.techStack.slice(0, 4).join(" • "), 54, 2);
  const url = escapeXml(`https://carolina-s-santos.github.io/portfolio/project/?slug=${project.slug}`);
  const headlineStartY = 136;
  const headlineStep = 28;
  const headlineEndY = headlineStartY + Math.max(0, headlineLines.length - 1) * headlineStep;
  const techStartY = headlineEndY + 42;
  const techStep = 22;
  const dateY = 248;

  return `
  <a href="${url}">
    <g transform="translate(48, 120)">
      <rect width="864" height="280" rx="20" fill="#111214" stroke="#24262B" />
      <text x="32" y="40" fill="#7CB7FF" font-size="12" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">${category}</text>
      <text x="32" y="92" fill="#F3F4F6" font-size="38" font-weight="700" font-family="Avenir Next, Segoe UI, Arial, sans-serif">${title}</text>
      ${headlineLines.map((line, index) => `
      <text x="32" y="${headlineStartY + index * headlineStep}" fill="#A1A1AA" font-size="21" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>`).join("")}
      ${techLines.map((line, index) => `
      <text x="32" y="${techStartY + index * techStep}" fill="#71717A" font-size="15" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>`).join("")}
      <text x="816" y="${dateY}" text-anchor="end" fill="#F3F4F6" font-size="14" font-family="Segoe UI, Arial, sans-serif">${escapeXml(project.date)}</text>
      <line x1="680" y1="54" x2="816" y2="54" stroke="#24262B" />
      <line x1="720" y1="92" x2="816" y2="92" stroke="#24262B" />
      <line x1="756" y1="130" x2="816" y2="130" stroke="#7CB7FF" />
      <line x1="696" y1="168" x2="816" y2="168" stroke="#24262B" />
    </g>
  </a>`;
}

function buildSvg(projects) {
  const selected = projects.filter((project) => project.featured).slice(0, 1);
  const project = (selected.length ? selected : projects.slice(0, 1))[0];

  if (!project) {
    return `
<svg width="960" height="460" viewBox="0 0 960 460" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="960" height="460" rx="24" fill="#0B0B0C" />
  <rect x="24" y="24" width="912" height="412" rx="18" fill="#111214" stroke="#24262B" />
  <text x="48" y="80" fill="#F3F4F6" font-size="32" font-weight="700" font-family="Avenir Next, Segoe UI, Arial, sans-serif">No projects yet</text>
</svg>`.trimStart();
  }

  return `
<svg width="960" height="460" viewBox="0 0 960 460" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="latestProjectsTitle latestProjectsDesc">
  <title id="latestProjectsTitle">Latest Project</title>
  <desc id="latestProjectsDesc">Current selected project from Carolina Santos portfolio.</desc>
  <rect width="960" height="460" rx="24" fill="#0B0B0C" />
  <rect x="24" y="24" width="912" height="412" rx="18" fill="#111214" stroke="#24262B" />
  <text x="48" y="72" fill="#7CB7FF" font-size="12" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">SELECTED WORK</text>
  <text x="48" y="104" fill="#F3F4F6" font-size="30" font-weight="700" font-family="Avenir Next, Segoe UI, Arial, sans-serif">Carolina Santos</text>
  ${renderProjectCard(project)}
</svg>`.trimStart();
}

function main() {
  const raw = fs.readFileSync(projectsPath, "utf8");
  const projects = normalizeProjects(JSON.parse(raw));
  fs.writeFileSync(outputPath, buildSvg(projects));
  console.log(`Generated ${path.relative(rootDir, outputPath)}`);
}

main();
