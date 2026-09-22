# Type Note

Type Note 是以 iPhone Safari 為主要使用情境的透明文字貼圖 Web App。

Phase 1 技術驗證已完成：

- Safari 載入使用者選擇的 `.ttf` / `.otf`
- IndexedDB 保存並在重新開啟後恢復字型
- Canvas 以自訂字型輸出透明 PNG
- Clipboard API 複製 `image/png`
- PNG 可貼到 Instagram Story

Phase 2 文字基礎功能與 Phase 3 特殊符號功能已完成，目前包含：

- 即時文字預覽與無框文字輸入
- 預覽下方的重設與複製 PNG
- Pinia Editor State
- 文字顏色、字距、行距與對齊
- 內建字體、自訂字體與最近使用字體
- 以檔案內容辨識並阻擋重複字體
- 「我的字體」觸控拖拉排序與順序保存
- 常用色、Color Picker 與 HEX 色碼
- 字體與排版工具面板
- 符號與顏文字分頁及分類
- 在目前文字游標位置插入符號或顏文字
- 最近使用與收藏（保存在目前瀏覽器）
- 固定 Preview、1–4 行自動增高輸入區與單層工具面板捲動
- Lucide 操作圖示與重要操作 Toast

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Production 由 Cloudflare Pages 從 `main` 自動部署：

https://type-note.pages.dev

## iPhone validation

1. 在 iPhone Safari 開啟 production 網址。
2. 加入一個 `.ttf` 或 `.otf`，確認預覽使用該字型。
3. 重新整理及關閉 Safari 後重開，確認字型仍會自動恢復。
4. 點擊「複製 PNG」，切換到 Instagram Story 後貼上並測試透明背景與縮放。
