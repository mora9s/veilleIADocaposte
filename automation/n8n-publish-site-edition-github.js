// n8n Code node — place after the anti-duplicate gate.
// Upserts the validated static edition in GitHub, triggering Vercel through Git integration.
async function publishEdition() {
const input = $input.first().json;
if (input.skipTeams) {
  return [{ json: { ...input, sitePublication: { status: 'skipped_duplicate', path: null, commitSha: null } } }];
}
const edition = input.siteEdition;
const token = $env.GITHUB_TOKEN_VEILLE_IA;
const owner = 'mora9s';
const repository = 'veilleIADocaposte';
const branch = 'main';

if (!token) throw new Error('GITHUB_TOKEN_VEILLE_IA absent');
if (!edition || !/^\d{4}-\d{2}-\d{2}$/.test(edition.slug || '')) {
  throw new Error('siteEdition absente ou slug invalide');
}
if (!Array.isArray(edition.stories) || edition.stories.length !== 3) {
  throw new Error('siteEdition doit contenir exactement 3 actualités');
}

const filePath = `content/editions/${edition.slug}.json`;
const apiUrl = `https://api.github.com/repos/${owner}/${repository}/contents/${filePath}`;
const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'n8n-veille-ia-publisher',
};
const fileText = `${JSON.stringify(edition, null, 2)}\n`;
let existing = null;

try {
  existing = await this.helpers.httpRequest({ method: 'GET', url: apiUrl, headers, qs: { ref: branch }, json: true });
} catch (error) {
  const status = error?.statusCode || error?.response?.statusCode || error?.response?.status;
  if (status !== 404) throw error;
}

if (existing?.content) {
  const current = Buffer.from(String(existing.content).replace(/\s/g, ''), 'base64').toString('utf8');
  if (current === fileText) {
    return [{ json: { ...input, sitePublication: { status: 'unchanged', path: filePath, commitSha: null } } }];
  }
}

const body = {
  message: `${existing?.sha ? 'chore' : 'feat'}: publish AI news edition ${edition.slug}`,
  content: Buffer.from(fileText, 'utf8').toString('base64'),
  branch,
  ...(existing?.sha ? { sha: existing.sha } : {}),
};
const result = await this.helpers.httpRequest({ method: 'PUT', url: apiUrl, headers, body, json: true });
const commitSha = result?.commit?.sha;
if (!commitSha) throw new Error('GitHub n’a retourné aucun SHA de commit');

return [{ json: {
  ...input,
  sitePublication: {
    status: existing?.sha ? 'updated' : 'created',
    path: filePath,
    commitSha,
    htmlUrl: result?.content?.html_url || null,
  },
} }];
}

return publishEdition.call(this);
