<script>
import { deleteFont, getFonts, saveFont } from './services/fontDb'
import { renderStickerPng } from './utils/renderSticker'

const FALLBACK_FONT = '-apple-system'

function fontFamilyFor(id) {
  return `type-note-${id.replaceAll('-', '')}`
}

async function registerFont(fontRecord) {
  const fontFace = new FontFace(fontRecord.family, await fontRecord.file.arrayBuffer())
  const loadedFace = await fontFace.load()
  document.fonts.add(loadedFace)
  return loadedFace
}

export default {
  name: 'App',

  data() {
    return {
      text: '今天也要慢慢來 ♡',
      textColor: '#282522',
      fonts: [],
      selectedFontId: '',
      status: '尚未加入自訂字型。',
      statusType: 'neutral',
      isLoading: true,
      isRendering: false,
    }
  },

  computed: {
    selectedFont() {
      return this.fonts.find((font) => font.id === this.selectedFontId) || null
    },

    activeFontFamily() {
      return this.selectedFont?.family || FALLBACK_FONT
    },

    previewStyle() {
      return {
        color: this.textColor,
        fontFamily: `'${this.activeFontFamily}', sans-serif`,
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

    async restoreFonts() {
      this.isLoading = true

      try {
        const savedFonts = (await getFonts()).sort(
          (left, right) => right.lastUsedAt - left.lastUsedAt,
        )

        for (const font of savedFonts) {
          await registerFont(font)
        }

        this.fonts = savedFonts

        if (savedFonts.length) {
          this.selectedFontId = savedFonts[0].id
          this.setStatus(`已從 IndexedDB 恢復 ${savedFonts.length} 個字型。`, 'success')
        }
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
        text: this.text,
        fontFamily: this.activeFontFamily,
        color: this.textColor,
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
          this.setStatus('PNG 已複製，請切換到 Instagram Story 貼上。', 'success')
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
  <main class="safe-bottom mx-auto flex min-h-svh w-full max-w-2xl flex-col px-5 pt-6 sm:px-8 sm:pt-10">
    <header class="mb-7 flex items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Phase 1 · 技術驗證
        </p>
        <h1 class="font-serif text-3xl tracking-tight text-stone-900">type note</h1>
      </div>
      <span class="rounded-full border border-stone-300 bg-white/60 px-3 py-1.5 text-xs text-stone-600">
        iOS Safari 17+
      </span>
    </header>

    <section class="checkerboard mb-5 flex min-h-64 items-center justify-center rounded-[28px] border border-stone-200 p-8 shadow-[0_18px_50px_rgba(74,64,53,0.07)]">
      <p
        class="max-w-full whitespace-pre-wrap break-words text-center text-4xl leading-[1.4]"
        :style="previewStyle"
      >{{ text || '今天也要慢慢來 ♡' }}</p>
    </section>

    <section class="mb-5 rounded-[24px] border border-stone-200 bg-white/75 p-5 shadow-[0_12px_35px_rgba(74,64,53,0.05)] backdrop-blur">
      <label class="mb-2 block text-sm font-medium text-stone-700" for="sticker-text">測試文字</label>
      <textarea
        id="sticker-text"
        v-model="text"
        class="min-h-24 w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base leading-relaxed text-stone-900 outline-none transition focus:border-stone-500"
        placeholder="輸入要測試的文字"
      />

      <div class="mt-4 flex items-center gap-3">
        <label class="text-sm font-medium text-stone-700" for="text-color">文字顏色</label>
        <input
          id="text-color"
          v-model="textColor"
          type="color"
          class="h-10 w-14 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
        >
        <code class="text-sm text-stone-500">{{ textColor }}</code>
      </div>
    </section>

    <section class="mb-5 rounded-[24px] border border-stone-200 bg-white/75 p-5 shadow-[0_12px_35px_rgba(74,64,53,0.05)] backdrop-blur">
      <div class="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 class="font-medium text-stone-900">自訂字型</h2>
          <p class="mt-1 text-sm text-stone-500">檔案只保存在目前瀏覽器的 IndexedDB。</p>
        </div>
        <label class="cursor-pointer rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition active:scale-[0.98]">
          加入字型
          <input
            class="sr-only"
            type="file"
            accept=".ttf,.otf,font/ttf,font/otf"
            :disabled="isLoading"
            @change="handleFontFile"
          >
        </label>
      </div>

      <div v-if="fonts.length" class="space-y-2">
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
          <button
            class="rounded-full px-3 py-2 text-xs text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            type="button"
            @click="removeFont(font)"
          >刪除</button>
        </div>
      </div>
      <p v-else class="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
        尚未加入字型
      </p>
    </section>

    <section class="mb-5">
      <button
        class="w-full rounded-2xl bg-stone-900 px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-stone-400/20 transition active:scale-[0.98] disabled:opacity-50"
        type="button"
        :disabled="isRendering"
        @click="copyPng"
      >複製 PNG</button>
    </section>

    <p
      class="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
      :class="{
        'border-emerald-200 bg-emerald-50 text-emerald-800': statusType === 'success',
        'border-red-200 bg-red-50 text-red-800': statusType === 'error',
        'border-stone-200 bg-white/60 text-stone-600': statusType === 'neutral',
      }"
      role="status"
    >{{ status }}</p>

    <ol class="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-600">
      <li>加入一個 .ttf 或 .otf 字型並確認預覽。</li>
      <li>重新整理或關閉 Safari 後再開啟，確認字型自動恢復。</li>
      <li>複製 PNG，切換到 Instagram Story 後貼上並放大。</li>
    </ol>
  </main>
</template>
