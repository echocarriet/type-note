<script>
import { GripVertical, LoaderCircle, Plus, Star, Trash2 } from '@lucide/vue'
import Sortable from 'sortablejs'
import BottomToolbar from './components/BottomToolbar.vue'
import NoteInput from './components/NoteInput.vue'
import StickerPreview from './components/StickerPreview.vue'
import ToastMessage from './components/ToastMessage.vue'
import { BUILTIN_FONTS, COMMON_COLORS } from './data/builtinFonts'
import {
  DECORATIONS,
  KAOMOJI,
  KAOMOJI_CATEGORIES,
  SYMBOLS,
  SYMBOL_CATEGORIES,
  decorationKey,
} from './data/decorations'
import { deleteFont, getFonts, saveFont } from './services/fontDb'
import { useEditorStore } from './stores/editor'
import { hashFile } from './utils/fileHash'
import { renderStickerPng } from './utils/renderSticker'

const RECENT_FONTS_KEY = 'type-note-recent-fonts'
const RECENT_DECORATIONS_KEY = 'type-note-recent-decorations'
const FAVORITE_DECORATIONS_KEY = 'type-note-favorite-decorations'
const registeredFontFaces = new Map()

function fontFamilyFor(id) {
  return `type-note-${id.replaceAll('-', '')}`
}

async function registerFont(fontRecord) {
  const fontFace = new FontFace(fontRecord.family, await fontRecord.file.arrayBuffer())
  const loadedFace = await fontFace.load()

  const previousFace = registeredFontFaces.get(fontRecord.id)
  if (previousFace) document.fonts.delete(previousFace)

  document.fonts.add(loadedFace)
  registeredFontFaces.set(fontRecord.id, loadedFace)
}

function unregisterFont(id) {
  const fontFace = registeredFontFaces.get(id)
  if (!fontFace) return

  document.fonts.delete(fontFace)
  registeredFontFaces.delete(id)
}

export default {
  name: 'App',
  components: {
    BottomToolbar,
    GripVertical,
    LoaderCircle,
    NoteInput,
    Plus,
    Star,
    StickerPreview,
    ToastMessage,
    Trash2,
  },

  data() {
    return {
      builtinFonts: BUILTIN_FONTS,
      commonColors: COMMON_COLORS,
      fonts: [],
      selectedFontKey: 'builtin:system-sans',
      recentFontKeys: [],
      decorationTab: 'symbol',
      decorationFilter: {
        symbol: 'all',
        kaomoji: 'all',
      },
      recentDecorationKeys: [],
      favoriteDecorationKeys: [],
      activePanel: '',
      inputLineCount: 1,
      viewportHeight: 0,
      toast: null,
      toastTimer: null,
      isLoading: true,
      isRendering: false,
      fontSorter: null,
    }
  },

  computed: {
    editor() {
      return useEditorStore()
    },

    selectedCustomFont() {
      if (!this.selectedFontKey.startsWith('custom:')) return null
      const id = this.selectedFontKey.slice('custom:'.length)
      return this.fonts.find((font) => font.id === id) || null
    },

    activeFontFamily() {
      if (this.selectedCustomFont) {
        return `'${this.selectedCustomFont.family}', sans-serif`
      }

      const id = this.selectedFontKey.slice('builtin:'.length)
      return this.builtinFonts.find((font) => font.id === id)?.family || this.builtinFonts[0].family
    },

    recentFonts() {
      return this.recentFontKeys
        .map((key) => {
          if (key.startsWith('builtin:')) {
            const font = this.builtinFonts.find((item) => item.id === key.slice('builtin:'.length))
            return font ? { key, ...font, type: 'builtin' } : null
          }

          const font = this.fonts.find((item) => item.id === key.slice('custom:'.length))
          return font ? { key, ...font, type: 'custom' } : null
        })
        .filter(Boolean)
    },

    decorationCategories() {
      return this.decorationTab === 'symbol' ? SYMBOL_CATEGORIES : KAOMOJI_CATEGORIES
    },

    activeDecorationFilter() {
      return this.decorationFilter[this.decorationTab]
    },

    visibleDecorationSections() {
      const items = this.decorationTab === 'symbol' ? SYMBOLS : KAOMOJI

      if (this.activeDecorationFilter === 'recent') {
        const recentItems = this.recentDecorationKeys
          .map((key) => DECORATIONS.find((item) => decorationKey(item) === key))
          .filter((item) => item?.type === this.decorationTab)
        return recentItems.length ? [{ id: 'recent', label: '最近使用', items: recentItems }] : []
      }

      if (this.activeDecorationFilter === 'favorite') {
        const favoriteItems = items.filter((item) =>
          this.favoriteDecorationKeys.includes(decorationKey(item)),
        )
        return favoriteItems.length ? [{ id: 'favorite', label: '收藏', items: favoriteItems }] : []
      }

      return this.decorationCategories.map((category) => ({
        id: category.id,
        label: category.label,
        items: items.filter((item) => item.category === category.id),
      }))
    },

    previewStyle() {
      return {
        color: this.editor.textColor,
        fontFamily: this.activeFontFamily,
        letterSpacing: `${this.editor.letterSpacing}px`,
        lineHeight: this.editor.lineHeight,
        textAlign: this.editor.align,
      }
    },
  },

  async mounted() {
    this.updateViewportHeight()
    window.addEventListener('resize', this.updateViewportHeight)
    window.visualViewport?.addEventListener('resize', this.updateViewportHeight)
    window.visualViewport?.addEventListener('scroll', this.updateViewportHeight)
    this.restoreDecorationPreferences()
    await this.restoreFonts()
  },

  beforeUnmount() {
    this.destroyFontSorter()
    this.clearToast()
    window.removeEventListener('resize', this.updateViewportHeight)
    window.visualViewport?.removeEventListener('resize', this.updateViewportHeight)
    window.visualViewport?.removeEventListener('scroll', this.updateViewportHeight)
  },

  methods: {
    decorationKey,

    updateViewportHeight() {
      this.viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight)
    },

    showToast(message, type = 'success', duration = 1500) {
      this.clearToast()
      this.toast = { id: Date.now(), message, type }
      this.toastTimer = window.setTimeout(() => {
        this.toast = null
        this.toastTimer = null
      }, duration)
    },

    clearToast() {
      if (this.toastTimer) window.clearTimeout(this.toastTimer)
      this.toastTimer = null
      this.toast = null
    },

    togglePanel(panel) {
      this.$refs.noteInput?.blur()
      this.activePanel = this.activePanel === panel ? '' : panel

      if (this.activePanel === 'font') {
        this.$nextTick(() => this.initializeFontSorter())
      } else {
        this.destroyFontSorter()
      }
    },

    initializeFontSorter() {
      this.destroyFontSorter()
      if (!this.$refs.fontList) return

      this.fontSorter = Sortable.create(this.$refs.fontList, {
        animation: 180,
        handle: '.drag-handle',
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 3,
        ghostClass: 'font-sort-ghost',
        chosenClass: 'font-sort-chosen',
        onEnd: ({ oldIndex, newIndex }) => this.reorderFonts(oldIndex, newIndex),
      })
    },

    destroyFontSorter() {
      this.fontSorter?.destroy()
      this.fontSorter = null
    },

    async reorderFonts(oldIndex, newIndex) {
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) return

      const [movedFont] = this.fonts.splice(oldIndex, 1)
      this.fonts.splice(newIndex, 0, movedFont)

      try {
        await Promise.all(
          this.fonts.map((font, index) => {
            font.sortOrder = index
            return saveFont(font)
          }),
        )
      } catch (error) {
        console.error(error)
      }
    },

    resetStyle() {
      this.editor.resetStyle()
    },

    rememberFont(key) {
      this.recentFontKeys = [key, ...this.recentFontKeys.filter((item) => item !== key)].slice(0, 3)
      localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(this.recentFontKeys))
    },

    restoreDecorationPreferences() {
      try {
        const recent = JSON.parse(localStorage.getItem(RECENT_DECORATIONS_KEY) || '[]')
        const favorites = JSON.parse(localStorage.getItem(FAVORITE_DECORATIONS_KEY) || '[]')
        if (Array.isArray(recent)) this.recentDecorationKeys = recent.slice(0, 20)
        if (Array.isArray(favorites)) this.favoriteDecorationKeys = favorites
      } catch (error) {
        console.error(error)
        this.recentDecorationKeys = []
        this.favoriteDecorationKeys = []
      }
    },

    setDecorationTab(tab) {
      this.decorationTab = tab
    },

    setDecorationFilter(filter) {
      this.decorationFilter[this.decorationTab] = filter
    },

    insertDecoration(item) {
      this.$refs.noteInput?.insertText(item.value)
      const key = decorationKey(item)
      this.recentDecorationKeys = [
        key,
        ...this.recentDecorationKeys.filter((recentKey) => recentKey !== key),
      ].slice(0, 20)
      localStorage.setItem(RECENT_DECORATIONS_KEY, JSON.stringify(this.recentDecorationKeys))
    },

    toggleDecorationFavorite(item) {
      const key = decorationKey(item)
      if (this.favoriteDecorationKeys.includes(key)) {
        this.favoriteDecorationKeys = this.favoriteDecorationKeys.filter(
          (favoriteKey) => favoriteKey !== key,
        )
      } else {
        this.favoriteDecorationKeys = [...this.favoriteDecorationKeys, key]
      }
      localStorage.setItem(FAVORITE_DECORATIONS_KEY, JSON.stringify(this.favoriteDecorationKeys))
    },

    isDecorationFavorite(item) {
      return this.favoriteDecorationKeys.includes(decorationKey(item))
    },

    selectBuiltinFont(font) {
      this.selectedFontKey = `builtin:${font.id}`
      this.rememberFont(this.selectedFontKey)
    },

    selectRecentFont(font) {
      if (font.type === 'builtin') this.selectBuiltinFont(font)
      else this.selectCustomFont(font)
    },

    setTextColor(color) {
      this.editor.textColor = color.toUpperCase()
    },

    handleHexColor(event) {
      let value = event.target.value.trim()
      if (!value.startsWith('#')) value = `#${value}`

      if (/^#[0-9a-f]{3}$/i.test(value)) {
        value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      }

      if (/^#[0-9a-f]{6}$/i.test(value)) {
        this.setTextColor(value)
      } else {
        event.target.value = this.editor.textColor
        console.error(new Error('請輸入有效的 HEX 色碼。'))
      }
    },

    async restoreFonts() {
      this.isLoading = true

      try {
        const savedFonts = (await getFonts()).sort((left, right) => {
          const leftOrder = Number.isInteger(left.sortOrder) ? left.sortOrder : Number.MAX_SAFE_INTEGER
          const rightOrder = Number.isInteger(right.sortOrder) ? right.sortOrder : Number.MAX_SAFE_INTEGER
          return leftOrder - rightOrder || right.lastUsedAt - left.lastUsedAt
        })

        for (const [index, font] of savedFonts.entries()) {
          let shouldSave = false

          if (!font.hash) {
            font.hash = await hashFile(font.file)
            shouldSave = true
          }

          if (!Number.isInteger(font.sortOrder)) {
            font.sortOrder = index
            shouldSave = true
          }

          if (shouldSave) await saveFont(font)
          await registerFont(font)
        }

        this.fonts = savedFonts

        try {
          const storedRecentFonts = JSON.parse(localStorage.getItem(RECENT_FONTS_KEY) || '[]')
          if (Array.isArray(storedRecentFonts)) this.recentFontKeys = storedRecentFonts.slice(0, 3)
        } catch {
          this.recentFontKeys = []
        }

        const firstAvailableRecentFont = this.recentFonts[0]
        if (firstAvailableRecentFont) this.selectedFontKey = firstAvailableRecentFont.key
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },

    async handleFontFile(event) {
      const input = event.target
      const file = input.files?.[0]
      let newFontId = null

      if (!file) return

      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['ttf', 'otf'].includes(extension)) {
        console.error(new Error('請選擇 .ttf 或 .otf 字型檔。'))
        input.value = ''
        return
      }

      this.isLoading = true

      try {
        const hash = await hashFile(file)
        const duplicateFont = this.fonts.find((font) => font.hash === hash)

        if (duplicateFont) {
          this.selectedFontKey = `custom:${duplicateFont.id}`
          this.rememberFont(this.selectedFontKey)
          this.showToast(`「${duplicateFont.name}」已加入，不會重複儲存。`, 'warning', 2500)
          return
        }

        const id = crypto.randomUUID()
        newFontId = id
        const fontRecord = {
          id,
          name: file.name.replace(/\.(ttf|otf)$/i, ''),
          family: fontFamilyFor(id),
          fileName: file.name,
          type: 'custom',
          file,
          hash,
          sortOrder: 0,
          lastUsedAt: Date.now(),
        }

        await registerFont(fontRecord)
        await Promise.all(
          this.fonts.map((font, index) => {
            font.sortOrder = index + 1
            return saveFont(font)
          }),
        )
        await saveFont(fontRecord)
        this.fonts = [fontRecord, ...this.fonts]
        this.selectedFontKey = `custom:${id}`
        this.rememberFont(this.selectedFontKey)
        this.showToast(`${fontRecord.name} 已儲存在這台裝置。`)
        this.$nextTick(() => this.initializeFontSorter())
      } catch (error) {
        if (newFontId) unregisterFont(newFontId)
        console.error(error)
      } finally {
        this.isLoading = false
        input.value = ''
      }
    },

    async selectCustomFont(font) {
      this.selectedFontKey = `custom:${font.id}`
      font.lastUsedAt = Date.now()
      await saveFont(font)
      this.rememberFont(this.selectedFontKey)
    },

    async removeFont(font) {
      try {
        await deleteFont(font.id)
        unregisterFont(font.id)
        this.fonts = this.fonts.filter((item) => item.id !== font.id)
        const removedKey = `custom:${font.id}`
        this.recentFontKeys = this.recentFontKeys.filter((key) => key !== removedKey)
        localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(this.recentFontKeys))
        if (this.selectedFontKey === removedKey) {
          this.selectedFontKey = 'builtin:system-sans'
        }
        this.showToast(`${font.name} 已從這台裝置刪除。`)
        this.$nextTick(() => this.initializeFontSorter())
      } catch (error) {
        console.error(error)
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
        console.error(new Error('這個瀏覽器不支援 PNG Clipboard API。'))
        return
      }

      this.isRendering = true
      let clipboardItem

      try {
        clipboardItem = new ClipboardItem({ 'image/png': this.createPngBlob() })
      } catch (error) {
        console.error(error)
        this.isRendering = false
        return
      }

      navigator.clipboard
        .write([clipboardItem])
        .then(() => {
          this.showToast('已複製 PNG，可以到 Instagram Story 貼上。')
        })
        .catch((error) => {
          console.error(error)
        })
        .finally(() => {
          this.isRendering = false
        })
    },
  },
}
</script>

<template>
  <main
    class="mx-auto flex min-h-0 w-full max-w-[480px] flex-col overflow-hidden bg-[#faf8f4] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-[0_0_70px_rgba(64,55,46,0.08)] sm:px-6"
    :style="{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }"
  >
    <div class="relative shrink-0">
      <StickerPreview
        :text="editor.text"
        :preview-style="previewStyle"
        :is-copying="isRendering"
        :line-count="inputLineCount"
        @reset="resetStyle"
        @copy="copyPng"
      />

      <Transition name="toast">
        <ToastMessage
          v-if="toast"
          :key="toast.id"
          class="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2"
          :message="toast.message"
          :type="toast.type"
        />
      </Transition>
    </div>

    <div class="flex min-h-0 flex-1 flex-col pt-3">
      <NoteInput
        ref="noteInput"
        v-model="editor.text"
        @line-count="inputLineCount = $event"
      />

      <section v-if="activePanel" class="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-t-[26px] border border-b-0 border-stone-200 bg-white/80 p-5 pb-7 shadow-[0_-14px_40px_rgba(72,63,54,0.06)]">
      <template v-if="activePanel === 'font'">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="font-medium text-stone-900">字體</h2>
            <p class="mt-1 text-xs text-stone-500">字型只保存在目前瀏覽器。</p>
          </div>
          <label class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white active:scale-[0.98]">
            <LoaderCircle v-if="isLoading" class="animate-spin" :size="18" :stroke-width="1.75" aria-hidden="true" />
            <Plus v-else :size="18" :stroke-width="1.75" aria-hidden="true" />
            {{ isLoading ? '載入中…' : '加入字型' }}
            <input
              class="sr-only"
              type="file"
              accept=".ttf,.otf,font/ttf,font/otf"
              :disabled="isLoading"
              @change="handleFontFile"
            >
          </label>
        </div>

        <div class="mb-6">
          <h3 class="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">內建字體</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="font in builtinFonts"
              :key="font.id"
              class="min-h-16 rounded-2xl border px-2 py-3 text-sm transition"
              :class="selectedFontKey === `builtin:${font.id}` ? 'border-stone-700 bg-stone-50 text-stone-950' : 'border-stone-200 bg-white text-stone-600'"
              :style="{ fontFamily: font.family }"
              type="button"
              @click="selectBuiltinFont(font)"
            >{{ font.name }}</button>
          </div>
        </div>

        <div v-if="recentFonts.length" class="mb-6">
          <h3 class="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">最近使用</h3>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="font in recentFonts"
              :key="font.key"
              class="shrink-0 rounded-full border px-4 py-2 text-sm"
              :class="selectedFontKey === font.key ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-200 bg-white text-stone-600'"
              :style="{ fontFamily: font.type === 'custom' ? `'${font.family}', sans-serif` : font.family }"
              type="button"
              @click="selectRecentFont(font)"
            >{{ font.name }}</button>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">文字顏色</h3>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="color in commonColors"
              :key="color"
              class="h-9 w-9 rounded-full border-2 shadow-sm transition"
              :class="editor.textColor.toUpperCase() === color ? 'border-stone-800' : 'border-white'"
              :style="{ backgroundColor: color }"
              type="button"
              :aria-label="`文字顏色 ${color}`"
              @click="setTextColor(color)"
            />
            <label class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600">
              <Plus :size="18" :stroke-width="1.75" aria-hidden="true" />
              <input id="text-color" v-model="editor.textColor" class="sr-only" type="color">
            </label>
            <input
              class="ml-auto h-10 w-24 rounded-xl border border-stone-200 bg-white px-3 text-center font-mono text-xs uppercase text-stone-700 outline-none focus:border-stone-500"
              :value="editor.textColor"
              aria-label="HEX 色碼"
              maxlength="7"
              @change="handleHexColor"
            >
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-400">我的字體</h3>
          <div v-if="fonts.length" ref="fontList" class="space-y-2">
          <div
            v-for="font in fonts"
            :key="font.id"
            :data-id="font.id"
            class="font-sort-row flex select-none items-center gap-3 rounded-2xl border px-3 py-3"
            :class="selectedFontKey === `custom:${font.id}` ? 'border-stone-700 bg-stone-50' : 'border-stone-200 bg-white'"
          >
            <button class="min-w-0 flex-1 text-left" type="button" @click="selectCustomFont(font)">
              <span class="block truncate text-lg text-stone-900" :style="{ fontFamily: `'${font.family}', sans-serif` }">{{ font.name }}</span>
              <span class="block truncate text-xs text-stone-500">{{ font.fileName }}</span>
            </button>
            <button
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-400 active:bg-stone-100"
              type="button"
              :aria-label="`刪除 ${font.name}`"
              @click="removeFont(font)"
            >
              <Trash2 :size="19" :stroke-width="1.75" aria-hidden="true" />
            </button>
            <button
              class="drag-handle flex h-11 w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-full text-stone-400 active:cursor-grabbing active:bg-stone-100"
              type="button"
              :aria-label="`拖拉排序 ${font.name}`"
            >
              <GripVertical :size="20" :stroke-width="1.75" aria-hidden="true" />
            </button>
          </div>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">尚未加入自訂字型</p>
        </div>
      </template>

      <template v-if="activePanel === 'symbols'">
        <div class="mb-4 flex rounded-2xl bg-stone-100 p-1" role="tablist" aria-label="符號類型">
          <button
            v-for="tab in [{ id: 'symbol', label: '符號' }, { id: 'kaomoji', label: '顏文字' }]"
            :key="tab.id"
            class="min-h-10 flex-1 rounded-xl text-sm font-medium transition"
            :class="decorationTab === tab.id ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'"
            type="button"
            role="tab"
            :aria-selected="decorationTab === tab.id"
            @click="setDecorationTab(tab.id)"
          >{{ tab.label }}</button>
        </div>

        <div class="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1">
          <button
            v-for="filter in [{ id: 'all', label: '全部' }, { id: 'recent', label: '最近' }, { id: 'favorite', label: '收藏' }]"
            :key="filter.id"
            class="min-h-9 rounded-xl text-xs transition"
            :class="activeDecorationFilter === filter.id ? 'bg-white font-medium text-stone-950 shadow-sm' : 'text-stone-500'"
            type="button"
            @click="setDecorationFilter(filter.id)"
          >{{ filter.label }}</button>
        </div>

        <div
          v-if="visibleDecorationSections.length"
          class="space-y-5 pr-1"
        >
          <section v-for="section in visibleDecorationSections" :key="section.id">
            <h3 class="sticky top-0 z-10 mb-2 bg-white/95 py-1 text-xs font-medium tracking-[0.08em] text-stone-500 backdrop-blur">
              {{ section.label }}
            </h3>
            <div
              class="grid gap-2"
              :class="decorationTab === 'symbol' ? 'grid-cols-5' : 'grid-cols-1'"
            >
              <div
                v-for="item in section.items"
                :key="decorationKey(item)"
                class="relative flex min-h-14 items-center rounded-2xl border border-stone-200 bg-white"
              >
                <button
                  class="min-w-0 flex-1 px-2 py-3 text-center text-stone-800"
                  :class="decorationTab === 'symbol' ? 'text-xl' : 'pr-11 text-base'"
                  type="button"
                  :aria-label="`插入 ${item.value}`"
                  @click="insertDecoration(item)"
                >{{ item.value }}</button>
                <button
                  class="absolute right-0.5 top-0.5 flex h-7 w-7 items-center justify-center rounded-full"
                  :class="isDecorationFavorite(item) ? 'text-amber-500' : 'text-stone-300'"
                  type="button"
                  :aria-label="isDecorationFavorite(item) ? `取消收藏 ${item.value}` : `收藏 ${item.value}`"
                  :aria-pressed="isDecorationFavorite(item)"
                  @click="toggleDecorationFavorite(item)"
                >
                  <Star
                    :size="15"
                    :stroke-width="1.75"
                    :fill="isDecorationFavorite(item) ? 'currentColor' : 'none'"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-stone-300 px-4 py-8 text-center text-sm text-stone-500">
          {{ activeDecorationFilter === 'recent' ? '還沒有最近使用的項目' : '還沒有收藏的項目' }}
        </p>
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
      <div v-else class="min-h-0 flex-1" />
    </div>

    <BottomToolbar :active-panel="activePanel" @select="togglePanel" />
  </main>
</template>
