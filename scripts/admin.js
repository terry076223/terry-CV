// Admin prototype: client-side only, login is for demonstration. Do NOT use in production.
const STORAGE_KEY = 'cvData';
const SESSION_KEY = 'cvAdminSession';
const PASSWORD_KEY = 'cvAdminPassword';
const VALID_USER = { username: 'terry', password: '055912071' };

const defaultData = {
  profile: {
    name: '劉昱宏',
    title: '數據分析師（具前後端協作能力）',
    intro: '東海大學統計研究所畢，熟悉 Python / SAS / R，具備前端 Angular 與後端 Spring Boot 協作與資料流設計能力。',
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
  // 會在 bootstrap 時非同步從 GitHub 載入
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  try {
    const parsed = JSON.parse(raw);
    migrateAchievements(parsed);
    return parsed;
  } catch (err) {
    console.error('Failed to parse cv data, resetting.', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
}

function saveData(data) {
  // 同時儲存到 localStorage 和 GitHub
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  // 非同步上傳到 GitHub（不阻斷 UI）
  if (window.saveDataToGitHub) {
    saveDataToGitHub(data).catch(err => {
      console.error('Warning: GitHub save failed (but localStorage saved):', err);
      // 不顯示錯誤，因為 localStorage 已成功保存
    });
  }
}

function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = './login.html';
    return false;
  }
  const dashboard = document.getElementById('dashboard');
  if (dashboard) dashboard.classList.remove('hidden');
  return true;
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (username === VALID_USER.username && password === VALID_USER.password) {
    localStorage.setItem(SESSION_KEY, 'true');
    requireLogin();
  } else {
    alert('帳號或密碼錯誤（Prototype 示範用，無後端驗證）。');
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = './login.html';
}

function resetForm(formId) {
  document.getElementById(formId).reset();
  const hidden = document.querySelector(`#${formId} input[type="hidden"]`);
  if (hidden) hidden.value = '';
}

function upsertExperienceWork(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('exp-work-id').value || crypto.randomUUID();
  const payload = {
    id,
    type: 'Work',
    company: document.getElementById('exp-work-company').value.trim(),
    role: document.getElementById('exp-work-role').value.trim(),
    period: document.getElementById('exp-work-period').value.trim(),
    summary: document.getElementById('exp-work-summary').value.trim()
  };
  const existingIndex = (data.experience || []).findIndex(i => i.id === id);
  if (existingIndex >= 0) data.experience[existingIndex] = payload; else data.experience.unshift(payload);
  saveData(data);
  resetForm('exp-work-form');
  refreshUI();
}

function upsertExperienceEdu(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('exp-edu-id').value || crypto.randomUUID();
  const payload = {
    id,
    type: 'Education',
    company: document.getElementById('exp-edu-company').value.trim(),
    role: document.getElementById('exp-edu-role').value.trim(),
    period: document.getElementById('exp-edu-period').value.trim(),
    summary: document.getElementById('exp-edu-summary').value.trim()
  };
  const existingIndex = (data.experience || []).findIndex(i => i.id === id);
  if (existingIndex >= 0) data.experience[existingIndex] = payload; else data.experience.unshift(payload);
  saveData(data);
  resetForm('exp-edu-form');
  refreshUI();
}

function editExperienceWork(id) {
  const data = loadData();
  const item = (data.experience || []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('exp-work-id').value = item.id;
  document.getElementById('exp-work-company').value = item.company || '';
  document.getElementById('exp-work-role').value = item.role || '';
  document.getElementById('exp-work-period').value = item.period || '';
  document.getElementById('exp-work-summary').value = item.summary || '';
}

function editExperienceEdu(id) {
  const data = loadData();
  const item = (data.experience || []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('exp-edu-id').value = item.id;
  document.getElementById('exp-edu-company').value = item.company || '';
  document.getElementById('exp-edu-role').value = item.role || '';
  document.getElementById('exp-edu-period').value = item.period || '';
  document.getElementById('exp-edu-summary').value = item.summary || '';
}

function deleteExperience(id) {
  const data = loadData();
  data.experience = data.experience.filter(i => i.id !== id);
  saveData(data);
  refreshUI();
}

function upsertCert(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('cert-id').value || crypto.randomUUID();
  const payload = {
    id,
    name: document.getElementById('cert-name').value.trim(),
    issuer: document.getElementById('cert-issuer').value.trim(),
    year: document.getElementById('cert-year').value.trim(),
    link: document.getElementById('cert-link').value.trim(),
    desc: document.getElementById('cert-desc').value.trim(),
    photoPath: document.getElementById('cert-photo-path')?.value.trim() || ''
  };
  if (!Array.isArray(data.certificates)) data.certificates = [];
  const idx = data.certificates.findIndex(i => i.id === id);
  if (idx >= 0) data.certificates[idx] = payload; else data.certificates.unshift(payload);
  saveData(data);
  resetForm('cert-form');
  if (certPreview) {
    certPreview.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>';
    certPreview.removeAttribute('data-photoBase64');
  }
  refreshUI();
}

function editCert(id) {
  const data = loadData();
  const item = (data.certificates || []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('cert-id').value = item.id;
  document.getElementById('cert-name').value = item.name;
  document.getElementById('cert-issuer').value = item.issuer;
  document.getElementById('cert-year').value = item.year;
  document.getElementById('cert-link').value = item.link;
  document.getElementById('cert-desc').value = item.desc;
  const pathInput = document.getElementById('cert-photo-path');
  if (pathInput) pathInput.value = item.photoPath || '';
}

function deleteCert(id) {
  const data = loadData();
  data.certificates = (data.certificates || []).filter(i => i.id !== id);
  saveData(data);
  refreshUI();
}

function upsertCourse(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('course-id').value || crypto.randomUUID();
  const payload = {
    id,
    name: document.getElementById('course-name').value.trim(),
    issuer: document.getElementById('course-issuer').value.trim(),
    year: document.getElementById('course-year').value.trim(),
    link: document.getElementById('course-link').value.trim(),
    desc: document.getElementById('course-desc').value.trim(),
    photoPath: document.getElementById('course-photo-path')?.value.trim() || ''
  };
  if (!Array.isArray(data.courses)) data.courses = [];
  const idx = data.courses.findIndex(i => i.id === id);
  if (idx >= 0) data.courses[idx] = payload; else data.courses.unshift(payload);
  saveData(data);
  resetForm('course-form');
  if (coursePreview) {
    coursePreview.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>';
    coursePreview.removeAttribute('data-photoBase64');
  }
  refreshUI();
}

function editCourse(id) {
  const data = loadData();
  const item = (data.courses || []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('course-id').value = item.id;
  document.getElementById('course-name').value = item.name;
  document.getElementById('course-issuer').value = item.issuer;
  document.getElementById('course-year').value = item.year;
  document.getElementById('course-link').value = item.link;
  document.getElementById('course-desc').value = item.desc;
  const pathInput = document.getElementById('course-photo-path');
  if (pathInput) pathInput.value = item.photoPath || '';
}

function deleteCourse(id) {
  const data = loadData();
  data.courses = (data.courses || []).filter(i => i.id !== id);
  saveData(data);
  refreshUI();
}

function upsertAward(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('award-id').value || crypto.randomUUID();
  const payload = {
    id,
    name: document.getElementById('award-name').value.trim(),
    issuer: document.getElementById('award-issuer').value.trim(),
    year: document.getElementById('award-year').value.trim(),
    link: document.getElementById('award-link').value.trim(),
    desc: document.getElementById('award-desc').value.trim(),
    photoPath: document.getElementById('award-photo-path')?.value.trim() || ''
  };
  if (!Array.isArray(data.awards)) data.awards = [];
  const idx = data.awards.findIndex(i => i.id === id);
  if (idx >= 0) data.awards[idx] = payload; else data.awards.unshift(payload);
  saveData(data);
  resetForm('award-form');
  
  preview.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>';
  preview.removeAttribute('data-photoBase64');
  refreshUI();
}

function editAward(id) {
  const data = loadData();
  const item = (data.awards || []).find(i => i.id === id);
  if (!item) return;
  document.getElementById('award-id').value = item.id;
  document.getElementById('award-name').value = item.name;
  document.getElementById('award-issuer').value = item.issuer;
  document.getElementById('award-year').value = item.year;
  document.getElementById('award-link').value = item.link;
  document.getElementById('award-desc').value = item.desc;
  const pathInput = document.getElementById('award-photo-path');
  if (pathInput) pathInput.value = item.photoPath || '';
}

function deleteAward(id) {
  const data = loadData();
  data.awards = (data.awards || []).filter(i => i.id !== id);
  saveData(data);
  refreshUI();
}

function upsertProj(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('proj-id').value || crypto.randomUUID();
  const payload = {
    id,
    name: document.getElementById('proj-name').value.trim(),
    tech: document.getElementById('proj-tech').value.trim(),
    link: document.getElementById('proj-link').value.trim(),
    desc: document.getElementById('proj-desc').value.trim()
  };
  const idx = data.projects.findIndex(i => i.id === id);
  if (idx >= 0) data.projects[idx] = payload; else data.projects.unshift(payload);
  saveData(data);
  resetForm('proj-form');
  refreshUI();
}

function editProj(id) {
  const data = loadData();
  const item = data.projects.find(i => i.id === id);
  if (!item) return;
  document.getElementById('proj-id').value = item.id;
  document.getElementById('proj-name').value = item.name;
  document.getElementById('proj-tech').value = item.tech;
  document.getElementById('proj-link').value = item.link;
  document.getElementById('proj-desc').value = item.desc;
}

function deleteProj(id) {
  const data = loadData();
  data.projects = data.projects.filter(i => i.id !== id);
  saveData(data);
  refreshUI();
}

function renderLists() {
  try {
    const data = loadData();
    
    // Render work list
    const workList = document.getElementById('work-list');
    if (workList) {
      const workItems = (data.experience || []).filter(i => (i.type || '').toLowerCase() === 'work');
      workList.innerHTML = workItems.map(item => `
        <div class="list-item" data-id="${item.id}" data-type="exp-work">
          <h4>${item.company} — ${item.role}</h4>
          <div class="list-meta">${item.period} · 工作</div>
          <p>${item.summary}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }

    // Render education list
    const eduList = document.getElementById('edu-list');
    if (eduList) {
      const eduItems = (data.experience || []).filter(i => (i.type || '').toLowerCase() === 'education');
      eduList.innerHTML = eduItems.map(item => `
        <div class="list-item" data-id="${item.id}" data-type="exp-edu">
          <h4>${item.company} — ${item.role}</h4>
          <div class="list-meta">${item.period} · 學歷</div>
          <p>${item.summary}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }
    
    // Render project list
    const projList = document.getElementById('proj-list');
    if (projList) {
      projList.innerHTML = (data.projects || []).map(item => `
        <div class="list-item" data-id="${item.id}" data-type="proj">
          <h4>${item.name}</h4>
          <div class="list-meta">${item.tech}</div>
          <p>${item.desc}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }
    
    // Render course list
    const courseList = document.getElementById('course-list');
    if (courseList) {
      courseList.innerHTML = (data.courses || []).map(item => `
        <div class="list-item" data-id="${item.id}" data-type="course">
          <h4>${item.name}</h4>
          <div class="list-meta">${item.issuer} · ${item.year}</div>
          <p>${item.desc || ''}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }
    
    // Render certificate list
    const certList = document.getElementById('cert-list');
    if (certList) {
      certList.innerHTML = (data.certificates || []).map(item => `
        <div class="list-item" data-id="${item.id}" data-type="certificate">
          <h4>${item.name}</h4>
          <div class="list-meta">${item.issuer} · ${item.year}</div>
          <p>${item.desc || ''}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }
    
    // Render award list
    const awardList = document.getElementById('award-list');
    if (awardList) {
      awardList.innerHTML = (data.awards || []).map(item => `
        <div class="list-item" data-id="${item.id}" data-type="award">
          <h4>${item.name}</h4>
          <div class="list-meta">${item.issuer} · ${item.year}</div>
          <p>${item.desc || ''}</p>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('renderLists error:', err);
  }
}

function attachListHandlers() {
  document.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    const container = e.target.closest('.list-item');
    if (!container) return;
    const id = container.dataset.id;
    const type = container.dataset.type;
    if (type === 'exp-work') {
      if (action === 'edit') editExperienceWork(id);
      if (action === 'delete') deleteExperience(id);
    }
    if (type === 'exp-edu') {
      if (action === 'edit') editExperienceEdu(id);
      if (action === 'delete') deleteExperience(id);
    }
    if (type === 'cert') {
      if (action === 'edit') editCert(id);
      if (action === 'delete') deleteCert(id);
    }
    if (type === 'certificate') {
      if (action === 'edit') editCert(id);
      if (action === 'delete') deleteCert(id);
    }
    if (type === 'course') {
      if (action === 'edit') editCourse(id);
      if (action === 'delete') deleteCourse(id);
    }
    if (type === 'award') {
      if (action === 'edit') editAward(id);
      if (action === 'delete') deleteAward(id);
    }
    if (type === 'proj') {
      if (action === 'edit') editProj(id);
      if (action === 'delete') deleteProj(id);
    }
    if (type === 'skill') {
      if (action === 'edit') editSkill(id);
      if (action === 'delete') deleteSkill(id);
    }
  });
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const data = loadData();
  data.profile.name = document.getElementById('profile-name').value.trim();
  data.profile.title = document.getElementById('profile-title').value.trim();
  data.profile.location = document.getElementById('profile-location').value.trim();
  data.profile.email = document.getElementById('profile-email').value.trim();
  data.profile.phone = document.getElementById('profile-phone').value.trim();
  data.profile.intro = document.getElementById('profile-intro').value.trim();
  saveData(data);
  refreshUI();
}

function preloadProfileForm() {
  const data = loadData();
  document.getElementById('profile-name').value = data.profile.name || '';
  document.getElementById('profile-title').value = data.profile.title || '';
  document.getElementById('profile-location').value = data.profile.location || '';
  document.getElementById('profile-email').value = data.profile.email || '';
  document.getElementById('profile-phone').value = data.profile.phone || '';
  document.getElementById('profile-intro').value = data.profile.intro || '';
}

function handlePasswordChange(event) {
  event.preventDefault();
  const current = document.getElementById('pwd-current').value.trim();
  const next = document.getElementById('pwd-new').value.trim();
  const confirm = document.getElementById('pwd-confirm').value.trim();
  const expected = localStorage.getItem(PASSWORD_KEY) || VALID_USER.password;
  if (!current || !next || !confirm) {
    alert('請完整填寫目前密碼與新密碼。');
    return;
  }
  if (current !== expected) {
    alert('目前密碼不正確。');
    return;
  }
  if (next !== confirm) {
    alert('新密碼與確認密碼不一致。');
    return;
  }
  localStorage.setItem(PASSWORD_KEY, next);
  alert('密碼已更新。下次登入將生效。');
  document.getElementById('password-form').reset();
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    // Upload to GitHub and get CDN URL
    const cdnUrl = await uploadImageToGitHub(file);
    const data = loadData();
    data.profile.avatarPath = cdnUrl; // store CDN URL for cross-device visibility
    // Cleanup legacy base64 to reduce size
    if (data.profile.avatarBase64) delete data.profile.avatarBase64;
    saveData(data);
    
    // Automatically sync to GitHub
    alert('大頭貼已上傳，正在同步到 GitHub...');
    await saveDataToGitHub(data);
    alert('大頭貼已儲存並同步到 GitHub！');
    updateStats();
  } catch (err) {
    console.error('Avatar upload failed', err);
    alert(`上傳或同步失敗：${err.message || err}`);
  } finally {
    // Reset input value so same file can be re-selected
    event.target.value = '';
  }
}

function upsertSkill(event) {
  event.preventDefault();
  const data = loadData();
  const id = document.getElementById('skill-id').value || crypto.randomUUID();
  const name = document.getElementById('skill-name').value.trim();
  const itemsRaw = document.getElementById('skill-items').value.split(',').map(s => s.trim()).filter(Boolean);
  const items = itemsRaw.map(s => {
    const [itemName, level] = s.split('|').map(x => x?.trim());
    return { name: itemName || s, level: level || '' };
  });
  const payload = { id, name, items };
  // skills originally had no id; migrate: attach id if missing
  if (!Array.isArray(data.skills)) data.skills = [];
  const idx = data.skills.findIndex(s => s.id === id || s.name === name);
  if (idx >= 0) {
    data.skills[idx] = payload;
  } else {
    data.skills.push(payload);
  }
  saveData(data);
  resetForm('skill-form');
  renderSkillList();
}

function editSkill(id) {
  const data = loadData();
  const skill = data.skills.find(s => s.id === id);
  if (!skill) return;
  document.getElementById('skill-id').value = skill.id;
  document.getElementById('skill-name').value = skill.name;
  document.getElementById('skill-items').value = skill.items.map(i => `${i.name}${i.level ? '|' + i.level : ''}`).join(', ');
}

function deleteSkill(id) {
  const data = loadData();
  data.skills = data.skills.filter(s => s.id !== id);
  saveData(data);
  renderSkillList();
}

function renderSkillList() {
  try {
    const data = loadData();
    const list = document.getElementById('skill-list');
    if (!list) return;
    
    // Render skills WITHOUT modifying/saving data during render
    list.innerHTML = (data.skills || []).map(s => {
      const items = s.items || [];
      const itemsHtml = items.map(i => `${i.name || '—'}${i.level ? '（' + i.level + '）' : ''}`).join('、');
      return `
        <div class="list-item" data-id="${s.id}" data-type="skill">
          <h4>${s.name}</h4>
          <div class="list-meta">${itemsHtml}</div>
          <div class="list-actions">
            <button class="btn ghost" data-action="edit">編輯</button>
            <button class="btn" data-action="delete">刪除</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('renderSkillList error:', err);
  }
}

function attachSkillHandlers() {
  document.getElementById('skill-form').addEventListener('submit', upsertSkill);
  document.getElementById('skill-reset').addEventListener('click', () => resetForm('skill-form'));
  const awardPhoto = document.getElementById('award-photo');
  if (awardPhoto) {
    awardPhoto.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById('award-photo-preview');
        preview.innerHTML = `<img src="${reader.result}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
        preview.setAttribute('data-photoBase64', reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  const coursePhoto = document.getElementById('course-photo');
  if (coursePhoto) {
    coursePhoto.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById('course-photo-preview');
        preview.innerHTML = `<img src="${reader.result}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
        preview.setAttribute('data-photoBase64', reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  const certPhoto = document.getElementById('cert-photo');
  if (certPhoto) {
    certPhoto.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const preview = document.getElementById('cert-photo-preview');
        preview.innerHTML = `<img src="${reader.result}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
        preview.setAttribute('data-photoBase64', reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}

function updateStats() {
  try {
    const data = loadData();
    const statExp = document.getElementById('stat-exp');
    const statCert = document.getElementById('stat-cert');
    const statProj = document.getElementById('stat-proj');
    if (statExp) statExp.textContent = data.experience?.length || 0;
    if (statCert) statCert.textContent = ((data.courses?.length || 0) + (data.certificates?.length || 0) + (data.awards?.length || 0));
    if (statProj) statProj.textContent = data.projects?.length || 0;
  } catch (err) {
    console.error('updateStats error:', err);
  }
}

function refreshUI() {
  try {
    renderLists();
    renderSkillList();
    updateStats();
  } catch (err) {
    console.error('refreshUI error:', err);
  }
}

function bootstrap() {
  // Ensure seed data exists for first-time use.
  try {
    loadData();
    // Initialize default password if none stored
    if (!localStorage.getItem(PASSWORD_KEY)) {
      localStorage.setItem(PASSWORD_KEY, VALID_USER.password);
    }
    if (!requireLogin()) return; // redirect to login if not authenticated
    const dash = document.getElementById('dashboard');
    if (dash) dash.classList.remove('hidden');

    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);
    const pwdForm = document.getElementById('password-form');
    if (pwdForm) pwdForm.addEventListener('submit', handlePasswordChange);
    document.getElementById('profile-reset').addEventListener('click', preloadProfileForm);
    document.getElementById('profile-avatar').addEventListener('change', handleAvatarUpload);

    document.getElementById('exp-work-form').addEventListener('submit', upsertExperienceWork);
    document.getElementById('exp-work-reset').addEventListener('click', () => resetForm('exp-work-form'));
    document.getElementById('exp-edu-form').addEventListener('submit', upsertExperienceEdu);
    document.getElementById('exp-edu-reset').addEventListener('click', () => resetForm('exp-edu-form'));
    document.getElementById('course-form').addEventListener('submit', upsertCourse);
    document.getElementById('course-reset').addEventListener('click', () => {
      resetForm('course-form');
      const p = document.getElementById('course-photo-preview');
      if (p) { p.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>'; p.removeAttribute('data-photoBase64'); }
    });
    document.getElementById('cert-form').addEventListener('submit', upsertCert);
    document.getElementById('cert-reset').addEventListener('click', () => {
      resetForm('cert-form');
      const p = document.getElementById('cert-photo-preview');
      if (p) { p.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>'; p.removeAttribute('data-photoBase64'); }
    });
    document.getElementById('award-form').addEventListener('submit', upsertAward);
    document.getElementById('award-reset').addEventListener('click', () => {
      resetForm('award-form');
      const p = document.getElementById('award-photo-preview');
      if (p) { p.innerHTML = '<p style="color: #9aa1b5; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳照片後預覽</p>'; p.removeAttribute('data-photoBase64'); }
    });
    document.getElementById('proj-form').addEventListener('submit', upsertProj);
    document.getElementById('proj-reset').addEventListener('click', () => resetForm('proj-form'));

    // GitHub Token form handler
    const githubTokenForm = document.getElementById('github-token-form');
    if (githubTokenForm) {
      githubTokenForm.addEventListener('submit', handleGitHubTokenSubmit);
    }

    // Upload handlers for courses, certificates, and awards
    setupPhotoUpload('course');
    setupPhotoUpload('cert');
    setupPhotoUpload('award');

    attachListHandlers();
    attachSkillHandlers();
    preloadProfileForm();
    refreshUI();

    // 從 GitHub 載入最新資料（非同步）
    syncDataFromGitHub();
    
    // 檢查 Token 狀態
    checkTokenStatus();
  } catch (err) {
    console.error('Bootstrap error', err);
    alert('後台載入時發生錯誤，請重新整理或清除瀏覽器快取。');
  }
}

async function checkTokenStatus() {
  const token = getGitHubToken();
  const statusDiv = document.getElementById('token-status');
  
  if (!token) {
    if (statusDiv) {
      statusDiv.innerHTML = '<p style="color: #ff4757; font-size: 12px; margin: 0;">⚠️ 尚未設定 Token，無法上傳圖片</p>';
    }
    return;
  }
  
  if (statusDiv) {
    statusDiv.innerHTML = '<p style="color: #2aa8ff; font-size: 12px; margin: 0;">⏳ 驗證 Token...</p>';
  }
  
  try {
    // Check user identity
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!userResponse.ok) {
      throw new Error(`Token 無效 (${userResponse.status})`);
    }
    
    const user = await userResponse.json();
    
    // Check repo access
    const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!repoResponse.ok) {
      throw new Error(`無法存取 repo (${repoResponse.status})`);
    }
    
    const repo = await repoResponse.json();
    const permissions = repo.permissions || {};
    
    if (statusDiv) {
      if (permissions.push) {
        statusDiv.innerHTML = `
          <p style="color: #2ecc71; font-size: 12px; margin: 0;">✅ Token 有效！使用者: ${user.login}</p>
          <p style="font-size: 11px; color: #9aa1b5; margin: 4px 0 0 0;">權限: ✓ 寫入 | ✓ 讀取</p>
        `;
      } else {
        statusDiv.innerHTML = `
          <p style="color: #f39c12; font-size: 12px; margin: 0;">⚠️ Token 缺少寫入權限</p>
          <p style="font-size: 11px; color: #9aa1b5; margin: 4px 0 0 0;">請確認 Token 有 "Contents: Read and Write" 權限</p>
        `;
      }
    }
  } catch (err) {
    console.error('Token status check failed:', err);
    if (statusDiv) {
      statusDiv.innerHTML = `<p style="color: #ff4757; font-size: 12px; margin: 0;">❌ ${err.message}</p>`;
    }
  }
}

async function syncDataFromGitHub() {
  try {
    // 如果有設定 Token，試著從 GitHub 載入最新資料
    const gitHubData = await loadDataFromGitHub();
    if (gitHubData) {
      // 用 GitHub 資料取代 localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gitHubData));
      console.log('✅ Synced data from GitHub');
      // 重新整理 UI
      refreshUI();
      preloadProfileForm();
    }
  } catch (err) {
    console.warn('GitHub sync skipped:', err.message);
    // 失敗時使用 localStorage 的資料，不中斷使用者操作
  }
}

async function handleGitHubTokenSubmit(e) {
  e.preventDefault();
  const tokenInput = document.getElementById('github-token');
  const statusDiv = document.getElementById('token-status');
  const token = tokenInput.value.trim();
  
  if (!token) {
    alert('請輸入有效的 GitHub Token');
    return;
  }
  
  // Test token validity
  if (statusDiv) {
    statusDiv.innerHTML = '<p style="color: #2aa8ff;">⏳ 驗證 Token...</p>';
  }
  
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token 無效 (${response.status}): ${error.message}`);
    }
    
    const user = await response.json();
    setGitHubToken(token);
    
    if (statusDiv) {
      statusDiv.innerHTML = `<p style="color: #2ecc71;">✅ Token 有效！使用者: ${user.login}</p>`;
    }
    
    alert(`GitHub Token 已儲存成功！\n使用者: ${user.login}`);
    tokenInput.value = '';
    
    // Check repo access
    await checkRepoAccess();
  } catch (err) {
    console.error('Token validation failed:', err);
    if (statusDiv) {
      statusDiv.innerHTML = `<p style="color: #ff4757;">❌ ${err.message}</p>`;
    }
    alert(`Token 驗證失敗：${err.message}`);
  }
}

async function checkRepoAccess() {
  const token = getGitHubToken();
  const statusDiv = document.getElementById('token-status');
  
  if (!token) {
    if (statusDiv) {
      statusDiv.innerHTML = '<p style="color: #ff4757;">❌ 請先設定 GitHub Token</p>';
    }
    return;
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`無法存取 repo (${response.status}): ${error.message}`);
    }
    
    const repo = await response.json();
    const permissions = repo.permissions || {};
    
    if (statusDiv) {
      statusDiv.innerHTML = `
        <p style="color: #2ecc71;">✅ Repo 存取正常</p>
        <p style="font-size: 11px; color: #9aa1b5; margin: 4px 0 0 0;">
          權限: ${permissions.push ? '✓ 寫入' : '✗ 無寫入'} | ${permissions.pull ? '✓ 讀取' : '✗ 無讀取'}
        </p>
      `;
    }
    
    if (!permissions.push) {
      alert('⚠️ Token 缺少寫入權限！\n請確認 Token 有 "Contents: Read and Write" 權限。');
    }
  } catch (err) {
    console.error('Repo access check failed:', err);
    if (statusDiv) {
      statusDiv.innerHTML = `<p style="color: #ff4757;">❌ ${err.message}</p>`;
    }
  }
}

async function setupPhotoUpload(type) {
  const fileInput = document.getElementById(`${type}-photo-file`);
  if (!fileInput) return;

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const pathInput = document.getElementById(`${type}-photo-path`);
    const preview = document.getElementById(`${type}-photo-preview`);
    
    try {
      // Show uploading status
      if (preview) {
        preview.innerHTML = '<p style="color: #2aa8ff; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳中...</p>';
      }

      // Upload to GitHub (returns CDN URL with cache-busting)
      const uploadedPath = await uploadImageToGitHub(file, (progress) => {
        if (preview) {
          preview.innerHTML = `<p style="color: #2aa8ff; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳中 ${progress}%...</p>`;
        }
      });

      // Update path input with CDN URL
      if (pathInput) {
        pathInput.value = uploadedPath;
      }

      // Show preview
      if (preview) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          preview.innerHTML = `<img src="${ev.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" />`;
        };
        reader.readAsDataURL(file);
      }

      alert('圖片上傳成功！正在儲存資料到 GitHub...');
      
      // Automatically save data to GitHub after upload
      const data = loadData();
      await saveDataToGitHub(data);
      alert('資料已同步到 GitHub！');
    } catch (err) {
      console.error('Upload failed:', err);
      alert(`上傳或儲存失敗：${err.message}`);
      if (preview) {
        preview.innerHTML = '<p style="color: #ff4757; font-size: 12px; margin: 0; text-align: center; padding: 12px;">上傳失敗</p>';
      }
    }

    // Reset file input
    e.target.value = '';
  });
}

bootstrap();
