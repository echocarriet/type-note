<script>
import BottomToolbar from './components/BottomToolbar.vue'
import EditorActions from './components/EditorActions.vue'
import NoteInput from './components/NoteInput.vue'
import StickerPreview from './components/StickerPreview.vue'
import { deleteFont, getFonts, saveFont } from './services/fontDb'
import { useEditorStore } from './stores/editor'
import { renderStickerPng } from './utils/renderSticker'

const FALLBACK_FONT = '-apple-system'

function fontFamilyFor(id) {
  return `type-note-${id.replaceAll('-', '')}`
}

async function registerFont(fontRecord) {
  const fontFace = new FontFace(fontRecord.family, await fontRecord.file.arrayBuffer())
  const loadedFace = await fontFace.load()
  document.fonts.add(loadedFace)
}

export default {
  name: 'App',
  components: {
    BottomToolbar,
    EditorActions,
    NoteInput,
    StickerPreview,
  },

  data() {
    return {
      fonts: [],
      selectedFontId: '',
      activePanel: '',
      status: '',
      statusType: 'neutral',
      isLoading: true,
      isRendering: false,
    }
  },

  computed: {
    editor() {
      return useEditorStore()
    },

    selectedFont() {
      return this.fonts.find((font) => font.id === this.selectedFontId) || null
    },

    activeFontFamily() {
      return this.selectedFont?.family || FALLBACK_FONT
    },

    previewStyle() {
      return {
        color: this.editor.textColor,
        fontFamily: `'${this.activeFontFamily}', sans-serif`,
        letterSpacing: `${this.editor.letterSpacing}px`,
        lineHeight: this.editor.lineHeight,
        textAlign: this.editor.align,
      }
    },
  },

  async mounted() {
    await this.restoreFonts()
  },

  methods: {
    setStatus(message, type = 'neutral') {
      this.status = message
      this.statusType = type
    },

    togglePanel(panel) {
      this.activePanel = this.activePanel === panel ? '' : panel
    },

    resetStyle() {
      this.editor.resetStyle()
      this.setStatus('已重設樣式，文字內容保留。', 'success')
    },

    async restoreFonts() {
      this.isLoading = true

      try {
        const savedFonts = (await getFonts()).sort(
          (left, right) => right.lastUsedAt - left.lastUsedAt,
        )

        for (const font of savedFonts) await registerFont(font)

        this.fonts = savedFonts
        if (savedFonts.length) this.selectedFontId = savedFonts[0].id
      } catch (error) {
        console.error(error)
        this.setStatus('無法從 IndexedDB 恢復字型。', 'error')
      } finally {
        this.isLoading = false
      }
    },

    async handleFontFile(event) {
      const input = event.target
      const file = input.files?.[0]

      if (!file) return

      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['ttf', 'otf'].includes(extension)) {
        this.setStatus('請選擇 .ttf 或 .otf 字型檔。', 'error')
        input.value = ''
        return
      }

      this.isLoading = true
      this.setStatus('正在載入字型…')

      try {
        const id = crypto.randomUUID()
        const fontRecord = {
          id,
          name: file.name.replace(/\.(ttf|otf)$/i, ''),
          family: fontFamilyFor(id),
          fileName: file.name,
          type: 'custom',
          file,
          lastUsedAt: Date.now(),
        }

        await registerFont(fontRecord)
        await saveFont(fontRecord)
        this.fonts = [fontRecord, ...this.fonts]
        this.selectedFontId = id
        this.setStatus(`${fontRecord.name} 已儲存在這台裝置。`, 'success')
      } catch (error) {
        console.error(error)
        this.setStatus('字型無法載入，請改用另一個 .ttf 或 .otf 檔。', 'error')
      } finally {
        this.isLoading = false
        input.value = ''
      }
    },

    async selectFont(font) {
      this.selectedFontId = font.id
      font.lastUsedAt = Date.now()
      await saveFont(font)
      this.setStatus(`目前使用 ${font.name}。`, 'success')
    },

    async removeFont(font) {
      try {
        await deleteFont(font.id)
        this.fonts = this.fonts.filter((item) => item.id !== font.id)
        if (this.selectedFontId === font.id) {
          this.selectedFontId = this.fonts[0]?.id || ''
        }
        this.setStatus(`${font.name} 已從這台裝置刪除。`, 'success')
      } catch (error) {
        console.error(error)
        this.setStatus('無法刪除字型。', 'error')
      }
    },

    createPngBlob() {
      return renderStickerPng({
        text: this.editor.text,
        fontFamily: this.activeFontFamily,
        color: this.editor.textColor,
        letterSpacing: this.editor.letterSpacing,
        lineHeight: this.editor.lineHeight,
        align: this.editor.align,
      })
    },

    copyPng() {
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        this.setStatus('這個瀏覽器不支援 PNG Clipboard API。', 'error')
        return
      }

      this.isRendering = true
      const blobPromise = this.createPngBlob()
      const clipboardItem = new ClipboardItem({ 'image/png': blobPromise })

      navigator.clipboard
        .write([clipboardItem])
        .then(() => {
          this.setStatus('已複製 PNG，可以到 Instagram Story 貼上。', 'success')
        })
        .catch((error) => {
          console.error(error)
          this.setStatus('複製失敗。請確認使用 HTTPS 並直接點擊複製按鈕。', 'error')
        })
        .finally(() => {
          this.isRendering = false
        })
    },
  },
}
</script>

<template>
  <main class="mx-auto flex min-h-svh w-full max-w-[480px] flex-col bg-[#faf8f4] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] shadow-[0_0_70px_rgba(64,55,46,0.08)] sm:px-6">
    <header class="flex min-h-12 items-center justify-between px-1">
      <h1 class="font-serif text-lg tracking-tight text-stone-900">type note</h1>
      <button class="min-h-11 min-w-11 rounded-full text-xl text-stone-700 active:bg-stone-100" type="button" aria-label="更多選項">···</button>
    </header>

    <StickerPreview :text="editor.text" :preview-style="previewStyle" />

    <EditorActions
      :is-copying="isRendering"
      @reset="resetStyle"
      @copy="copyPng"
    />

    <NoteInput v-model="editor.text" />

    <section v-if="activePanel" class="mt-4 rounded-t-[26px] border border-b-0 border-stone-200 bg-white/80 p-5 shadow-[0_-14px_40px_rgba(72,63,54,0.06)]">
      <template v-if="activePanel === 'font'">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="font-medium text-stone-900">字體</h2>
            <p class="mt-1 text-xs text-stone-500">字型只保存在目前瀏覽器。</p>
          </div>
          <label class="cursor-pointer rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white active:scale-[0.98]">
            ＋ 加入字型
            <input
              class="sr-only"
              type="file"
              accept=".ttf,.otf,font/ttf,font/otf"
              :disabled="isLoading"
              @change="handleFontFile"
            >
          </label>
        </div>

        <div class="mb-5 flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
          <label class="text-sm text-stone-700" for="text-color">文字顏色</label>
          <div class="flex items-center gap-2">
            <code class="text-xs text-stone-500">{{ editor.textColor }}</code>
            <input
              id="text-color"
              v-model="editor.textColor"
              type="color"
              class="h-9 w-11 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
            >
          </div>
        </div>

        <div v-if="fonts.length" class="max-h-64 space-y-2 overflow-y-auto">
          <div
            v-for="font in fonts"
            :key="font.id"
            class="flex items-center gap-3 rounded-2xl border px-3 py-3"
            :class="selectedFontId === font.id ? 'border-stone-700 bg-stone-50' : 'border-stone-200 bg-white'"
          >
            <button class="min-w-0 flex-1 text-left" type="button" @click="selectFont(font)">
              <span class="block truncate text-lg text-stone-900" :style="{ fontFamily: `'${font.family}', sans-serif` }">{{ font.name }}</span>
              <span class="block truncate text-xs text-stone-500">{{ font.fileName }}</span>
            </button>
            <button class="rounded-full px-3 py-2 text-xs text-stone-500 active:bg-stone-100" type="button" @click="removeFont(font)">刪除</button>
          </div>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">尚未加入自訂字型</p>
      </template>

      <template v-if="activePanel === 'layout'">
        <h2 class="mb-5 font-medium text-stone-900">排版</h2>

        <div class="mb-6">
          <p class="mb-2 text-sm text-stone-700">對齊</p>
          <div class="grid grid-cols-3 rounded-2xl bg-stone-100 p-1">
            <button
              v-for="option in [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }]"
              :key="option.value"
              class="rounded-xl px-3 py-2 text-sm transition"
              :class="editor.align === option.value ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'"
              type="button"
              @click="editor.align = option.value"
            >{{ option.label }}</button>
          </div>
        </div>

        <label class="mb-6 block">
          <span class="mb-2 flex justify-between text-sm text-stone-700">
            <span>字距</span><span>{{ editor.letterSpacing }} px</span>
          </span>
          <input v-model.number="editor.letterSpacing" class="w-full accent-stone-800" type="range" min="-4" max="20" step="1">
        </label>

        <label class="block">
          <span class="mb-2 flex justify-between text-sm text-stone-700">
            <span>行距</span><span>{{ editor.lineHeight.toFixed(1) }}</span>
          </span>
          <input v-model.number="editor.lineHeight" class="w-full accent-stone-800" type="range" min="0.8" max="2.4" step="0.1">
        </label>
      </template>
    </section>

    <p
      v-if="status"
      class="mx-1 my-3 rounded-xl px-3 py-2 text-center text-xs"
      :class="statusType === 'error' ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'"
      role="status"
    >{{ status }}</p>

    <BottomToolbar :active-panel="activePanel" @select="togglePanel" />
  </main>
</template>
