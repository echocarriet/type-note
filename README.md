# Type Note

Type Note 是以 iPhone Safari 為主要使用情境的透明文字貼圖 Web App。

目前 repository 只實作 Phase 1 技術驗證頁，用來確認：

- Safari 載入使用者選擇的 `.ttf` / `.otf`
- IndexedDB 保存並在重新開啟後恢復字型
- Canvas 以自訂字型輸出透明 PNG
- Clipboard API 複製 `image/png`
- PNG 可貼到 Instagram Story

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
