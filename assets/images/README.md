# 圖片上傳指南

## 如何新增圖片

### 1. 準備圖片
- 將圖片放到 `assets/images/` 目錄
- 建議檔名：`course1.jpg`、`cert1.jpg`、`award1.jpg` 等

### 2. 在後台輸入路徑
- 打開後台管理
- 在「課程照片路徑」、「證照照片路徑」或「獎狀照片路徑」欄位
- 輸入：`assets/images/your-image.jpg`

### 3. 推送到 GitHub
```powershell
git add assets/images/
git commit -m "Add new images"
git push origin main
```

### 4. 等待 Cloudflare 自動部署
- Cloudflare Pages 會自動偵測 GitHub 更新
- 約 1-2 分鐘後所有人都能看到新圖片
- 不同電腦、不同瀏覽器都能同步顯示

## 優點
✅ 所有電腦都能看到同樣的圖片  
✅ 不會因清除快取而遺失  
✅ 圖片品質不受壓縮影響  
✅ 可以分享給任何人

## 範例
假設你要新增一張課程證書圖片：

1. 將 `python-cert.jpg` 複製到 `d:/GPT_coplit/CV/assets/images/`
2. 後台「課程照片路徑」輸入：`assets/images/python-cert.jpg`
3. 執行：
   ```powershell
   git add .
   git commit -m "Add Python certificate image"
   git push origin main
   ```
4. 完成！Cloudflare 自動部署後，所有人都能看到這張圖片
