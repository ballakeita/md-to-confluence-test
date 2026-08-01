const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mdToHtml = require('markdown-to-html').markdownToHTML;

// CONFIGURATION
const config = require('../.confluence.json'); // ton fichier .json
const TOKEN = process.env.ATLASSIAN_API_TOKEN; // GitHub secret
const EMAIL = config.atlassianUserName;
const BASE_URL = config.confluenceBaseUrl;
const SPACE = 'MFS'; // espace Confluence
const PARENT_ID = config.confluenceParentId || null;
const DOCS_DIR = config.folderToPublish || 'docs';

// Helper pour créer ou mettre à jour la page
async function createOrUpdatePage(title, htmlContent) {
  try {
    // Vérifie si la page existe
    const searchUrl = `${BASE_URL}/rest/api/content?title=${encodeURIComponent(title)}&spaceKey=${SPACE}`;
    const searchResp = await axios.get(searchUrl, {
      auth: { username: EMAIL, password: TOKEN }
    });

    if (searchResp.data.size > 0) {
      // Page existante → mettre à jour
      const page = searchResp.data.results[0];
      const updateUrl = `${BASE_URL}/rest/api/content/${page.id}`;
      const version = page.version.number + 1;

      await axios.put(updateUrl, {
        id: page.id,
        type: 'page',
        title,
        space: { key: SPACE },
        body: {
          storage: { value: htmlContent, representation: 'storage' }
        },
        version: { number: version }
      }, { auth: { username: EMAIL, password: TOKEN } });

      console.log(`✅ Page "${title}" mise à jour`);
    } else {
      // Créer nouvelle page
      await axios.post(`${BASE_URL}/rest/api/content`, {
        type: 'page',
        title,
        space: { key: SPACE },
        ancestors: PARENT_ID ? [{ id: PARENT_ID }] : undefined,
        body: { storage: { value: htmlContent, representation: 'storage' } }
      }, { auth: { username: EMAIL, password: TOKEN } });

      console.log(`✅ Page "${title}" créée`);
    }
  } catch (err) {
    console.error(`❌ Erreur pour "${title}":`, err.message);
  }
}

// Parcours des fichiers Markdown
async function main() {
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const mdContent = fs.readFileSync(filePath, 'utf-8');
    const htmlContent = mdToHtml(mdContent);
    const title = path.basename(file, '.md'); // titre = nom fichier sans extension
    await createOrUpdatePage(title, htmlContent);
  }
}

main();
