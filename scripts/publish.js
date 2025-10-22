import fs from "fs";
import axios from "axios";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

// --- Variables d'environnement ---
const CONFLUENCE_URL = process.env.CONFLUENCE_URL;
const CONFLUENCE_USER = process.env.CONFLUENCE_USER;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

const SPACE_KEY = "MFS"; // 🔹 espace cible

const AUTH = {
  username: CONFLUENCE_USER,
  password: CONFLUENCE_API_TOKEN
};

// --- Fonction pour créer une page ---
async function uploadPage(title, html) {
  try {
    const response = await axios.post(
      `${CONFLUENCE_URL}/rest/api/content/`,
      {
        type: "page",
        title: title,
        space: { key: SPACE_KEY },
        body: {
          storage: {
            value: html,
            representation: "storage"
          }
        }
      },
      { auth: AUTH, headers: { "Content-Type": "application/json" } }
    );

    const pageId = response.data.id;
    console.log(`✅ Page "${title}" créée : ${CONFLUENCE_URL}/pages/${pageId}`);
  } catch (err) {
    console.error(`❌ Erreur pour ${title}:`, err.response?.data || err.message);
  }
}

// --- Lecture des fichiers Markdown ---
async function main() {
  const docsPath = "docs";

  // Vérifie que le dossier docs existe
  if (!fs.existsSync(docsPath)) {
    console.error(`❌ Le dossier "${docsPath}" n'existe pas !`);
    return;
  }

  const files = fs.readdirSync(docsPath).filter(f => f.endsWith(".md"));

  for (const file of files) {
    const content = fs.readFileSync(`${docsPath}/${file}`, "utf8");
    const html = md.render(content);
    const title = file.replace(".md", "");
    await uploadPage(title, html);
  }
}

main();