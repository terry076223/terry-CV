// GitHub API Image Uploader & Data Sync
const GITHUB_REPO_OWNER = 'terry076223'; // 你的 GitHub 使用者名稱
const GITHUB_REPO_NAME = 'cv-'; // 你的 repo 名稱
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN_KEY = 'cvGitHubToken';
const CV_DATA_FILE = 'cv-data.json';

function getGitHubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

function setGitHubToken(token) {
  localStorage.setItem(GITHUB_TOKEN_KEY, token);
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
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Add image: ${fileName}`,
            content: base64Content,
            branch: GITHUB_BRANCH
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '上傳失敗');
        }

        const result = await response.json();
        if (onProgress) onProgress(100);
        
        // 返回相對路徑
        resolve(filePath);
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
          'Authorization': `token ${token}`,
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

  try {
    // 先取得目前檔案的 SHA（用於更新）
    const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CV_DATA_FILE}`;
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = '';
    if (getResponse.ok) {
      const existing = await getResponse.json();
      sha = existing.sha;
    }

    // 上傳更新的 JSON
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update CV data: ${new Date().toLocaleString('zh-TW')}`,
        content: content,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {})
      })
    });

    if (!putResponse.ok) {
      const error = await putResponse.json();
      throw new Error(error.message || '儲存失敗');
    }

    console.log('✅ Saved cvData to GitHub');
    return true;
  } catch (error) {
    console.error('❌ Failed to save to GitHub:', error);
    throw error;
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
