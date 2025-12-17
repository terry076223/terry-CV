// GitHub API Image Uploader & Data Sync
const GITHUB_REPO_OWNER = 'terry076223'; // 你的 GitHub 使用者名稱
const GITHUB_REPO_NAME = 'terry-CV'; // 你的 repo 名稱
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN_KEY = 'githubToken'; // 修正：與 admin 頁面一致
const CV_DATA_FILE = 'cv-data.json';

function getGitHubToken() {
  const token = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
  console.log('🔑 Token check:', token ? `存在 (長度 ${token.length})` : '未設定');
  return token;
}

function setGitHubToken(token) {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
  console.log('✅ Token 已儲存');
}

async function uploadImageToGitHub(file, onProgress) {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('請先設定 GitHub Token');
  }

  // 生成檔案名稱（時間戳 + 原檔名）
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = `assets/images/${fileName}`;

  // 讀取檔案為 base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const base64Content = reader.result.split(',')[1]; // 移除 data:image/...;base64,
        
        // GitHub API: 上傳檔案
        const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Add image: ${fileName}`,
            content: base64Content,
            branch: GITHUB_BRANCH
          })
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ GitHub API Error:', { status: response.status, error });
          throw new Error(`上傳失敗 (${response.status}): ${error.message || JSON.stringify(error)}`);
        }

        const result = await response.json();
        if (onProgress) onProgress(100);
        
        // 返回 CDN 路徑，避免瀏覽器快取與相對路徑問題
        const cdnPath = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/${filePath}`;
        resolve(cdnPath);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('讀取檔案失敗'));
    reader.readAsDataURL(file);
  });
}

// GitHub 資料同步函數
async function loadDataFromGitHub() {
  try {
    // Try public raw URL first (no token required)
    const publicUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${CV_DATA_FILE}?t=${Date.now()}`;
    let response = await fetch(publicUrl, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    // If public fetch fails, try authenticated API when token exists
    if (!response.ok) {
      const token = getGitHubToken();
      if (!token) throw new Error(`Failed to fetch public raw: ${response.status}`);
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CV_DATA_FILE}`;
      response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) throw new Error(`Failed to fetch via API: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Loaded cvData from GitHub');
    return data;
  } catch (error) {
    console.warn('⚠️ Failed to load from GitHub:', error.message);
    return null;
  }
}

async function saveDataToGitHub(data) {
  const token = getGitHubToken();
  if (!token) {
    throw new Error('請先設定 GitHub Token');
  }

  // Retry logic to mitigate 409 conflicts when branch head moves between GET and PUT
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CV_DATA_FILE}`;
      // Always fetch latest SHA before each PUT
      const getResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (getResponse.ok) {
        const existing = await getResponse.json();
        sha = existing.sha;
      } else if (getResponse.status !== 404) {
        const err = await getResponse.json().catch(() => ({}));
        throw new Error(`Failed to fetch file SHA (${getResponse.status}): ${err.message || 'unknown error'}`);
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
      const putBody = {
        message: `Update CV data: ${new Date().toLocaleString('zh-TW')}`,
        content: content,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {})
      };

      const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(putBody)
      });

      if (!putResponse.ok) {
        // If 409, retry after short delay
        if (putResponse.status === 409 && attempt < maxRetries) {
          console.warn(`⚠️ PUT 409 conflict, retrying (${attempt}/${maxRetries - 1})...`);
          await new Promise(r => setTimeout(r, 400));
          continue;
        }
        const error = await putResponse.json().catch(() => ({}));
        console.error('❌ GitHub API Error:', { status: putResponse.status, error });
        throw new Error(`儲存失敗 (${putResponse.status}): ${error.message || JSON.stringify(error)}`);
      }

      console.log('✅ Saved cvData to GitHub');
      return true;
    } catch (err) {
      if (attempt >= maxRetries) {
        console.error('❌ Failed to save to GitHub after retries:', err);
        throw err;
      }
    }
  }
}

function showUploadProgress(buttonId, message) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.disabled = true;
    btn.textContent = message;
  }
}

function resetUploadButton(buttonId, originalText) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
