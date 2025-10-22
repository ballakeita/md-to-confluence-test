import fs from "fs";
import axios from "axios";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();

const CONFLUENCE_URL = process.env.CONFLUENCE_URL;
const CONFLUENCE_USER = process.env.CONFLUENCE_USER;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

const SPACE_KEY = "MFS"; // 🔧 à adapter
const AUTH = {
  username: CONFLUENCE_USER,
  password: CONFLUENCE_API_TOKEN
};

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

    console.log(`✅ Page "${title}" créée : ${CONFLUENCE_URL}${response.data._links.webui}`);

  } catch (err) {
    console.error(`❌ Erreur pour ${title}:`, err.response?.data || err.message);
  }
}

async function main() {
  const files = fs.readdirSync("docs").filter(f => f.endsWith(".md"));

  for (const file of files) {
    const content = fs.readFileSync(`docs/${file}`, "utf8");
    const html = md.render(content);
    const title = file.replace(".md", "");
    await uploadPage(title, html);
  }
}

main();