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

function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxChars) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  const consumedWords = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumedWords < words.length && lines.length) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].replace(/[. ]+$/, "")}...`;
  }

  return lines;
}

function gradientFor(index) {
  const palettes = [
    ["#49a3ff", "#1756b7"],
    ["#7de2d1", "#1c7f8b"],
    ["#86a8ff", "#354fb7"],
    ["#90d7ff", "#21689d"],
  ];
  return palettes[index % palettes.length];
}

function renderCard(project, index) {
  const x = index % 2 === 0 ? 56 : 508;
  const y = index < 2 ? 92 : 356;
  const [accentStart] = gradientFor(index);
  const headlineLines = wrapText(project.headline, 34, 3);
  const techLine = wrapText(project.techStack.slice(0, 4).join(" • "), 34, 2);
  const category = escapeXml(project.categoryLabel);
  const name = escapeXml(project.name);
  const url = escapeXml(`https://carolina-s-santos.github.io/portfolio/project/?slug=${project.slug}`);

  return `
    <a href="${url}">
      <g transform="translate(${x}, ${y})">
        <rect width="396" height="220" rx="24" fill="rgba(16,30,51,0.96)" stroke="rgba(121,153,191,0.24)" />
        <rect x="0" y="0" width="396" height="220" rx="24" fill="url(#cardGlow${index})" opacity="0.16" />
        <text x="28" y="34" fill="${accentStart}" font-size="12" font-family="Segoe UI, Arial, sans-serif" letter-spacing="1.8">${category.toUpperCase()}</text>
        <text x="28" y="72" fill="#ecf3ff" font-size="28" font-weight="700" font-family="Segoe UI, Arial, sans-serif">${name}</text>
        ${headlineLines.map((line, lineIndex) => `
          <text x="28" y="${106 + lineIndex * 24}" fill="#9bb0ca" font-size="18" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>
        `).join("")}
        ${techLine.map((line, lineIndex) => `
          <text x="28" y="${168 + lineIndex * 20}" fill="#7386a1" font-size="14" font-family="Segoe UI, Arial, sans-serif">${escapeXml(line)}</text>
        `).join("")}
        <text x="28" y="196" fill="#81f0b8" font-size="12" font-family="Segoe UI, Arial, sans-serif" letter-spacing="1.5">${escapeXml(project.date)}</text>
      </g>
    </a>
  `;
}

function buildSvg(projects) {
  const selected = projects
    .filter((project) => project.featured)
    .slice(0, 4);
  const fallback = selected.length ? selected : projects.slice(0, 4);

  const defs = fallback
    .map((project, index) => {
      const [accentStart, accentEnd] = gradientFor(index);
      return `
    <linearGradient id="cardGlow${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentStart}" />
      <stop offset="100%" stop-color="${accentEnd}" />
    </linearGradient>`;
    })
    .join("");
  const cards = fallback.map((project, index) => renderCard(project, index)).join("");

  return `
<svg width="960" height="640" viewBox="0 0 960 640" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="latestProjectsTitle latestProjectsDesc">
  <title id="latestProjectsTitle">Latest Projects</title>
  <desc id="latestProjectsDesc">A summary of four selected portfolio projects.</desc>
  <defs>${defs}
  </defs>
  <rect width="960" height="640" rx="32" fill="#07111f" />
  <rect x="16" y="16" width="928" height="608" rx="26" fill="rgba(9,21,37,0.9)" stroke="rgba(121,153,191,0.18)" />
  <circle cx="124" cy="82" r="92" fill="#49a3ff" opacity="0.18" />
  <circle cx="884" cy="40" r="140" fill="#1f5eb8" opacity="0.12" />
  <text x="56" y="54" fill="#49a3ff" font-size="14" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2.2">LATEST WORK</text>
  <text x="56" y="84" fill="#ecf3ff" font-size="28" font-weight="700" font-family="Segoe UI, Arial, sans-serif">Carolina Santos • Selected Projects</text>
  <text x="56" y="116" fill="#9bb0ca" font-size="16" font-family="Segoe UI, Arial, sans-serif">Product-oriented apps, academic builds and technical explorations from the portfolio.</text>
  ${cards}
</svg>
`.trimStart();
}

function main() {
  const raw = fs.readFileSync(projectsPath, "utf8");
  const projects = normalizeProjects(JSON.parse(raw));
  const svg = buildSvg(projects);
  fs.writeFileSync(outputPath, svg);
  console.log(`Generated ${path.relative(rootDir, outputPath)}`);
}

main();
