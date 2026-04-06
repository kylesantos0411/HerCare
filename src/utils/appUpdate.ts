import { APP_VERSION, GITHUB_LATEST_RELEASE_URL } from './appInfo';

const GITHUB_LATEST_RELEASE_API = 'https://api.github.com/repos/kylesantos0411/HerCare/releases/latest';
const APK_ASSET_PATTERN = /\.apk$/i;

export interface AppUpdateInfo {
  version: string;
  tagName: string;
  releaseUrl: string;
  apkUrl: string | null;
  publishedAt: string | null;
}

interface GitHubReleaseAsset {
  browser_download_url?: string;
  name?: string;
}

interface GitHubLatestReleaseResponse {
  tag_name?: string;
  html_url?: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '');
}

function toVersionParts(value: string) {
  return normalizeVersion(value)
    .split('.')
    .map((segment) => Number.parseInt(segment, 10))
    .filter((segment) => Number.isFinite(segment));
}

export function compareAppVersions(left: string, right: string) {
  const leftParts = toVersionParts(left);
  const rightParts = toVersionParts(right);
  const totalLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < totalLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) {
      return 1;
    }

    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
}

function parseLatestRelease(payload: GitHubLatestReleaseResponse): AppUpdateInfo | null {
  const tagName = typeof payload.tag_name === 'string' ? payload.tag_name : '';
  const version = normalizeVersion(tagName);

  if (!version) {
    return null;
  }

  const assets = Array.isArray(payload.assets) ? payload.assets : [];
  const apkAsset =
    assets.find((asset) => typeof asset.name === 'string' && APK_ASSET_PATTERN.test(asset.name)) ??
    assets.find(
      (asset) =>
        typeof asset.browser_download_url === 'string' && APK_ASSET_PATTERN.test(asset.browser_download_url),
    ) ??
    null;

  return {
    version,
    tagName,
    releaseUrl: typeof payload.html_url === 'string' && payload.html_url ? payload.html_url : GITHUB_LATEST_RELEASE_URL,
    apkUrl: typeof apkAsset?.browser_download_url === 'string' ? apkAsset.browser_download_url : null,
    publishedAt: typeof payload.published_at === 'string' ? payload.published_at : null,
  };
}

export async function fetchLatestAppUpdate(signal?: AbortSignal) {
  const response = await fetch(GITHUB_LATEST_RELEASE_API, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`GitHub update check failed with ${response.status}.`);
  }

  const payload = (await response.json()) as GitHubLatestReleaseResponse;

  return parseLatestRelease(payload);
}

export function hasNewerAppUpdate(update: AppUpdateInfo | null, currentVersion = APP_VERSION) {
  if (!update) {
    return false;
  }

  return compareAppVersions(update.version, currentVersion) > 0;
}

export function openAppUpdatePage(update: AppUpdateInfo) {
  const targetUrl = update.releaseUrl || GITHUB_LATEST_RELEASE_URL;
  const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    window.location.assign(targetUrl);
  }
}
