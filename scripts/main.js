// Frontstage renderer powered by localStorage; seeds prototype data on first load.
const STORAGE_KEY = 'cvData';
const THEME_KEY = 'cvTheme';
const THEMES = ['dark', 'light', 'tech', 'ocean', 'sunset', 'forest', 'purple'];
const THEME_LABELS = {
  dark: '深色',
  light: '亮色',
  ocean: '冷光',
  tech: '科技',
  sunset: '暖霞',
  forest: '松霧',
  purple: '紫夢'
};

// GitHub 配置
const GITHUB_REPO_OWNER = 'terry076223';
const GITHUB_REPO_NAME = 'terry-CV';
const GITHUB_BRANCH = 'main';
const CV_DATA_FILE = 'cv-data.json';
const GITHUB_TOKEN_KEY = 'cvGitHubToken';

const defaultData = {
  profile: {
    name: '劉昱宏',
    title: '數據分析師（具前後端協作能力）',
    heroDescription: '東海大學統計研究所畢，熟悉 Python / SAS / R，具備前端 Angular 與後端 Spring Boot 協作與資料流設計能力。',
    aboutDescription: '',
    location: 'Taiwan',
    email: 'contact@example.com',
    phone: '+886-900-000-000',
    links: [
      { label: 'GitHub', href: 'https://github.com/', icon: 'fa-brands fa-github' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: 'fa-brands fa-linkedin' }
    ]
  },
  skills: [
    { id: crypto.randomUUID(), name: '資料分析', items: [{ name: 'Python（Pandas/NumPy）', level: '熟練' }, { name: 'SAS', level: '剛接觸' }, { name: 'R', level: '入門' }, { name: '統計建模', level: '進階' }] },
    { id: crypto.randomUUID(), name: '前端協作', items: [{ name: 'Angular', level: '入門' }, { name: 'RWD / CSS3', level: '進階' }, { name: 'UI/UX 觀念', level: '入門' }] },
    { id: crypto.randomUUID(), name: '後端協作', items: [{ name: 'Spring Boot', level: '入門' }, { name: 'RESTful API', level: '入門' }, { name: '資料流與介接設計', level: '進階' }] }
  ],
  experience: [
    { id: crypto.randomUUID(), type: 'Work', company: '中山醫學大學', role: '資料分析相關', period: '1 年', summary: '參與醫學資料分析與研究支援。' },
    { id: crypto.randomUUID(), type: 'Work', company: '雲林科技大學', role: '資料分析相關', period: '4 年', summary: '學術資料處理、研究數據建模與分析。' },
    { id: crypto.randomUUID(), type: 'Work', company: '精誠集團子公司台灣資服（TIST）', role: '數據分析師', period: '3 年', summary: '企業資料分析、報表與系統協作，與前後端團隊協作。' },
    { id: crypto.randomUUID(), type: 'Education', company: '東海大學統計研究所', role: '碩士', period: '最高學歷', summary: '統計理論與應用、資料分析方法。' }
  ],
  achievements: [],
  courses: [],
  certificates: [],
  awards: [],
  projects: []
};

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  try {
    const parsed = JSON.parse(raw);
    migrateAchievements(parsed);
    migrateProfileFields(parsed);
    return parsed;
  } catch (err) {
    console.error('Failed to parse cv data, resetting.', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
}

function getGitHubToken() {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

async function loadDataFromGitHub() {
  try {
    // Use jsDelivr CDN first (has proper CORS headers)
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/${CV_DATA_FILE}?t=${Date.now()}`;
    let response = await fetch(cdnUrl);
    
    // Fallback to raw.githubusercontent if CDN fails
    if (!response.ok) {
      const publicUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${CV_DATA_FILE}?t=${Date.now()}`;
      response = await fetch(publicUrl);
    }

    // Fallback to authenticated API if public fetch fails and token exists
    if (!response.ok) {
      const token = getGitHubToken();
      if (!token) throw new Error(`Failed to fetch public raw: ${response.status}`);
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${CV_DATA_FILE}`;
      response = await fetch(apiUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3.raw'
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

function migrateAchievements(data) {
  if (!data) return;
  if (!Array.isArray(data.courses)) data.courses = [];
  if (!Array.isArray(data.certificates)) data.certificates = [];
  if (!Array.isArray(data.awards)) data.awards = [];
  if (Array.isArray(data.achievements) && data.achievements.length) {
    data.achievements.forEach(item => {
      const copy = { ...item, id: item.id || crypto.randomUUID() };
      const t = (item.type || '').toLowerCase();
      if (t.includes('課程')) data.courses.push(copy);
      else if (t.includes('證照')) data.certificates.push(copy);
      else if (t.includes('獎') || t.includes('award')) data.awards.push(copy);
      else data.courses.push(copy);
    });
    data.achievements = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function migrateProfileFields(data) {
  // 将旧字段 intro 和 aboutSection1 迁移到新字段 heroDescription 和 aboutDescription
  if (!data || !data.profile) return;
  
  // 迁移 intro → heroDescription
  if (!data.profile.heroDescription && data.profile.intro) {
    data.profile.heroDescription = data.profile.intro;
    delete data.profile.intro;
  }
  
  // 迁移 aboutSection1 → aboutDescription
  if (!data.profile.aboutDescription && data.profile.aboutSection1) {
    data.profile.aboutDescription = data.profile.aboutSection1;
    delete data.profile.aboutSection1;
  }
  
  // 确保新字段存在
  if (!data.profile.heroDescription) data.profile.heroDescription = '';
  if (!data.profile.aboutDescription) data.profile.aboutDescription = '';
}

// Helper function to convert newlines to <br> tags for proper line break display
function formatLineBreaks(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}

function renderProfile(data) {
  const { profile } = data;
  document.getElementById('hero-name').textContent = profile.name;
  document.getElementById('hero-title').textContent = profile.title;
  document.getElementById('hero-intro').innerHTML = formatLineBreaks(profile.heroDescription);
  const footerName = document.getElementById('footer-name');
  if (footerName) {
    footerName.textContent = `© ${new Date().getFullYear()} ${profile.name || ''}`.trim();
  }
  const avatar = document.getElementById('hero-avatar');
  if (avatar) {
    if (profile.avatarPath) {
      let src = profile.avatarPath;
      if (src.startsWith('assets/images/')) {
        src = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/${src}`;
      }
      if (src.startsWith('https://cdn.jsdelivr.net/')) {
        src = `${src}?t=${Date.now()}`; // cache-busting
      }
      avatar.src = src;
    } else if (profile.avatarBase64) {
      avatar.src = profile.avatarBase64;
    } else {
      avatar.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#0a0d18'/><circle cx='120' cy='90' r='50' fill='#2470a0'/><rect x='60' y='150' width='120' height='50' rx='25' fill='#a696c8'/></svg>`);
    }
  }

  const meta = document.getElementById('hero-meta');
  meta.innerHTML = '';
  [profile.location, profile.email, profile.phone]
    .filter(Boolean)
    .forEach(item => {
      const span = document.createElement('span');
      span.className = 'badge';
      span.textContent = item;
      meta.appendChild(span);
    });

  const about = document.getElementById('about-content');
  if (about) {
    // 顯示關於我區塊的內容，若為空則顯示首頁簡介
    const content = profile.aboutDescription || profile.heroDescription;
    about.innerHTML = `
      <h3>${profile.title}</h3>
      <p>${formatLineBreaks(content)}</p>
      <div class="links">
        ${profile.links.map(link => `<a href="${link.href}" target="_blank"><i class="${link.icon}"></i> ${link.label}</a>`).join('')}
      </div>
    `;
  }
}

function renderSkills(data) {
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';
  data.skills.forEach(skill => {
    const card = document.createElement('div');
    card.className = 'card skill-card';
    const toScore = (lvl) => {
      const map = {
        '剛接觸': 1,
        '入門': 2,
        '進階': 4,
        '熟練': 5
      };
      if (!lvl) return 0;
      return map[lvl] ?? 3; // default 中間值
    };
    const meterHtml = (score) => {
      const cells = Array.from({ length: 5 }, (_, i) => `<span class=\"level-cell${i < score ? ' filled' : ''}\"></span>`).join('');
      return `<span class=\"level-meter\">${cells}</span>`;
    };
    const itemsHtml = (skill.items || []).map(item => {
        const levelBadge = item.level ? `<span class="badge">${item.level}</span>` : '<span class="badge badge-empty"></span>';
      const score = toScore(item.level);
        return `
          <li class="skill-item">
            <span class="skill-name">${item.name}</span>
            ${levelBadge}
            ${meterHtml(score)}
          </li>
        `;
    }).join('');
    card.innerHTML = `
      <h3>${skill.name}</h3>
      <ul>${itemsHtml}</ul>
    `;
    grid.appendChild(card);
  });
}

function renderExperience(data) {
  const workWrap = document.getElementById('work-timeline');
  const eduWrap = document.getElementById('education-timeline');
  if (workWrap) workWrap.innerHTML = '';
  if (eduWrap) eduWrap.innerHTML = '';

  const workItems = (data.experience || []).filter(i => (i.type || '').toLowerCase() === 'work');
  const eduItems = (data.experience || []).filter(i => (i.type || '').toLowerCase() === 'education');
  
  console.log('渲染經歷:', { workItems: workItems.length, eduItems: eduItems.length });

  workItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.style.setProperty('--y-offset', `${idx * 24}px`);
    div.innerHTML = `
      <div class="badge">工作</div>
      <h3>${item.company} — ${item.role}</h3>
      <p class="text-muted">${item.period}</p>
      <p>${formatLineBreaks(item.summary)}</p>
      <span class="connector"></span>
    `;
    if (workWrap) workWrap.appendChild(div);
  });

  eduItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.style.setProperty('--y-offset', `${idx * 24}px`);
    div.innerHTML = `
      <div class="badge">學歷</div>
      <h3>${item.company} — ${item.role}</h3>
      <p class="text-muted">${item.period}</p>
      <p>${formatLineBreaks(item.summary)}</p>
      <span class="connector"></span>
    `;
    if (eduWrap) eduWrap.appendChild(div);
  });
}

function renderGrouped(list, targetId, badgeLabel) {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // 若該項目有照片路徑或 base64，顯示圖片版本（適用課程/證照/獎狀）
    if (item.photoPath || item.photoBase64) {
      let photoSrc = item.photoPath || item.photoBase64;
      // If using a repo-relative path, convert to jsDelivr CDN URL for reliability
      if (typeof photoSrc === 'string' && photoSrc.startsWith('assets/images/')) {
        photoSrc = `https://cdn.jsdelivr.net/gh/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}@${GITHUB_BRANCH}/${photoSrc}`;
      }
      // Cache-busting to avoid stale CDN images in incognito/Edge
      if (typeof photoSrc === 'string' && photoSrc.startsWith('https://cdn.jsdelivr.net/')) {
        photoSrc = `${photoSrc}?t=${Date.now()}`;
      }
      const linkHtml = item.link ? `<a href="${item.link}" target="_blank">查看</a>` : '';
      card.classList.add('award-card-with-photo');
      card.innerHTML = `
        <div class="badge">${badgeLabel}</div>
        <img src="${photoSrc}" class="award-photo" />
        <h3>${item.name}</h3>
        <p class="text-muted">${item.issuer || ''}${item.year ? ' · ' + item.year : ''}</p>
        <p>${formatLineBreaks(item.desc || '')}</p>
        ${linkHtml}
      `;
    } else {
      // 預設卡片版本
      const linkHtml = item.link ? `<a href="${item.link}" target="_blank">查看</a>` : '';
      card.innerHTML = `
        <div class="badge">${badgeLabel}</div>
        <h3>${item.name}</h3>
        <p class="text-muted">${item.issuer || ''}${item.year ? ' · ' + item.year : ''}</p>
        <p>${formatLineBreaks(item.desc || '')}</p>
        ${linkHtml}
      `;
    }
    grid.appendChild(card);
  });
}

function renderProjects(data) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  data.projects.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card project';
    const linkHtml = item.link ? `<a class="btn ghost" href="${item.link}" target="_blank">前往</a>` : '';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${formatLineBreaks(item.desc)}</p>
      <div class="tags">${item.tech.split('/').map(tag => `<span>${tag.trim()}</span>`).join('')}</div>
      ${linkHtml}
    `;
    grid.appendChild(card);
  });
}

function renderContact(data) {
  const card = document.getElementById('contact-card');
  const profile = data.profile;
  card.innerHTML = `
    <div class="card">
      <p><i class="fa-solid fa-location-dot"></i> ${profile.location}</p>
      <p><i class="fa-solid fa-envelope"></i> ${profile.email}</p>
      <p><i class="fa-solid fa-phone"></i> ${profile.phone}</p>
      <div class="links">
        ${profile.links.map(link => `<a href="${link.href}" target="_blank"><i class="${link.icon}"></i> ${link.label}</a>`).join('')}
      </div>
    </div>
  `;
}

function setupContactForm() {
  const modal = document.getElementById('contact-modal');
  const btn = document.getElementById('contact-btn-hero');
  const closeBtn = document.getElementById('modal-close');
  const overlay = document.getElementById('modal-overlay');
  const form = document.getElementById('contact-form');
  
  if (!modal || !btn || !form) return;
  
  // Open modal
  btn.addEventListener('click', () => {
    modal.classList.add('active');
  });
  
  // Close modal
  const closeModal = () => {
    modal.classList.remove('active');
    form.reset();
  };
  
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    
    if (!name || !email || !message) {
      alert('請填寫所有欄位');
      return;
    }
    
    // Save message to localStorage
    const messages = JSON.parse(localStorage.getItem('cvMessages') || '[]');
    messages.push({
      id: crypto.randomUUID(),
      name,
      email,
      message,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('cvMessages', JSON.stringify(messages));
    
    // Show success message
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '已送出！';
    submitBtn.style.background = 'var(--accent-2)';
    
    // Close modal after 1.5 seconds
    setTimeout(() => {
      closeModal();
      submitBtn.textContent = originalText;
      submitBtn.style.background = '';
    }, 1500);
  });
}

function renderAll() {
  const data = loadData();
  renderProfile(data);
  renderSkills(data);
  renderExperience(data);
  renderGrouped(data.courses || [], 'courses-grid', '課程');
  renderGrouped(data.certificates || [], 'certificates-grid', '證照');
  renderGrouped(data.awards || [], 'awards-grid', '獎狀');
  renderProjects(data);
  renderContact(data);
}

// 在頁面載入時從 GitHub 同步資料
async function syncDataFromGitHub() {
  try {
    // 只在 localStorage 为空时才从 GitHub 同步，避免覆盖后台的修改
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      const gitHubData = await loadDataFromGitHub();
      if (gitHubData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gitHubData));
        console.log('✅ Initial sync: Loaded data from GitHub');
        // 重新渲染 UI
        renderAll();
      }
    } else {
      console.log('✅ Using existing localStorage data (skip GitHub sync)');
    }
  } catch (err) {
    console.warn('GitHub sync skipped:', err.message);
  }
}

// 初始化已由 bootstrapFront() 在文件末尾处理
// 不再需要 DOMContentLoaded 监听器，避免重复初始化

function applyTheme(theme) {
  const body = document.body;
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  const next = theme && THEMES.includes(theme) ? theme : current;
  
  // Remove all theme classes
  THEMES.forEach(t => {
    if (t !== 'dark') body.classList.remove(`theme-${t}`);
  });
  
  // Apply new theme
  if (next !== 'dark') {
    body.classList.add(`theme-${next}`);
  }
  
  localStorage.setItem(THEME_KEY, next);
  
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = `主題：${THEME_LABELS[next]}`;
}

function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    const current = localStorage.getItem(THEME_KEY) || 'dark';
    const currentIndex = THEMES.indexOf(current);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex]);
  });
  
  applyTheme();
}

async function bootstrapFront() {
  try {
    // 檢查 localStorage 是否已有資料
    const localData = localStorage.getItem(STORAGE_KEY);
    
    if (!localData) {
      // 只有在 localStorage 為空時才從 GitHub 載入
      const gitHubData = await loadDataFromGitHub();
      if (gitHubData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gitHubData));
        console.log('✅ Initial sync: Loaded data from GitHub to localStorage');
      }
    } else {
      console.log('✅ Using existing localStorage data (skip GitHub sync to preserve admin changes)');
    }
  } catch (err) {
    console.warn('GitHub sync skipped:', err.message);
  } finally {
    // 渲染頁面
    renderAll();
    setupThemeToggle();
    setupContactForm();
  }
}

bootstrapFront();
