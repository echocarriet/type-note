<script>
import { Copy, LoaderCircle, Trash2, UndoDot } from '@lucide/vue'

export default {
  name: 'StickerPreview',
  components: {
    Copy,
    LoaderCircle,
    Trash2,
    UndoDot,
  },
  props: {
    text: {
      type: String,
      required: true,
    },
    previewStyle: {
      type: Object,
      required: true,
    },
    isCopying: {
      type: Boolean,
      default: false,
    },
    canUndo: {
      type: Boolean,
      default: false,
    },
    previewHeight: {
      type: Number,
      default: 0,
    },
    lineCount: {
      type: Number,
      default: 1,
    },
  },
  emits: ['delete', 'undo', 'copy'],
}
</script>

<template>
  <section
    class="preview-surface relative flex shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-stone-200/80 px-7 pb-6 pt-14 transition-[height] duration-200 motion-reduce:transition-none"
    :style="{ height: previewHeight ? `${previewHeight}px` : '50dvh' }"
  >
    <div class="absolute right-3 top-3 z-10 flex items-center gap-1.5">
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-stone-500 shadow-sm backdrop-blur-sm transition active:bg-white/90"
        type="button"
        aria-label="刪除文字"
        @click="$emit('delete')"
      >
        <Trash2 :size="18" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-stone-600 shadow-sm backdrop-blur-sm transition active:bg-white/90 disabled:opacity-35"
        type="button"
        :disabled="!canUndo"
        aria-label="復原上一步"
        @click="$emit('undo')"
      >
        <UndoDot :size="19" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        class="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-stone-900 shadow-sm backdrop-blur-sm transition active:bg-white/90 disabled:opacity-45"
        type="button"
        :disabled="isCopying"
        :aria-label="isCopying ? '正在複製 PNG' : '複製 PNG'"
        @click="$emit('copy')"
      >
        <LoaderCircle v-if="isCopying" class="animate-spin" :size="20" :stroke-width="1.75" aria-hidden="true" />
        <Copy v-else :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>

    <p
      class="preview-text max-h-full max-w-full overflow-auto whitespace-pre-wrap break-words text-4xl"
      :style="previewStyle"
    >{{ text }}</p>
  </section>
</template>
