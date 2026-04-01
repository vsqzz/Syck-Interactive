/**
 * GitHub JSON API storage utilities.
 * Reads/writes JSON files in a GitHub repo via the Contents API.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN!
const GITHUB_REPO = process.env.GITHUB_REPO! // e.g. "vsqzz/Realestkai---Assets"
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? "main"

const BASE_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents`

interface GitHubFileResponse {
  sha: string
  content: string
  encoding: string
}

async function githubRequest(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${path}?ref=${GITHUB_BRANCH}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
    cache: "no-store",
  })
  return res
}

export async function readJsonFile<T>(filePath: string): Promise<{ data: T; sha: string }> {
  const res = await githubRequest(filePath)

  if (res.status === 404) {
    return { data: [] as unknown as T, sha: "" }
  }

  if (!res.ok) {
    throw new Error(`GitHub read error ${res.status}: ${await res.text()}`)
  }

  const file: GitHubFileResponse = await res.json()
  const decoded = Buffer.from(file.content, "base64").toString("utf-8")
  return { data: JSON.parse(decoded) as T, sha: file.sha }
}

export async function writeJsonFile<T>(filePath: string, data: T, sha: string): Promise<void> {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64")
  const body: any = {
    message: `Update ${filePath}`,
    content,
    branch: GITHUB_BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(`${BASE_URL}/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`GitHub write error ${res.status}: ${await res.text()}`)
  }
}

/** Atomic read-modify-write helper */
export async function updateJsonFile<T extends any[]>(
  filePath: string,
  updater: (current: T) => T
): Promise<void> {
  const { data, sha } = await readJsonFile<T>(filePath)
  const updated = updater(data)
  await writeJsonFile(filePath, updated, sha)
}
