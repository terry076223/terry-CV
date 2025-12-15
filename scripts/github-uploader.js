// GitHub API Image Uploader
const GITHUB_REPO_OWNER = 'terry076223'; // 你的 GitHub 使用者名稱
const GITHUB_REPO_NAME = 'cv-'; // 你的 repo 名稱
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN_KEY = 'cvGitHubToken';

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
