<script>
import { Copy, LoaderCircle, UndoDot } from '@lucide/vue'

export default {
  name: 'StickerPreview',
  components: {
    Copy,
    LoaderCircle,
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
    lineCount: {
      type: Number,
      default: 1,
    },
  },
  emits: ['reset', 'copy'],
  computed: {
    heightClass() {
      return {
        1: 'h-[clamp(180px,30dvh,256px)]',
        2: 'h-[clamp(172px,27dvh,232px)]',
        3: 'h-[clamp(164px,24dvh,216px)]',
        4: 'h-[clamp(156px,21dvh,200px)]',
      }[Math.min(4, Math.max(1, this.lineCount))]
    },
  },
}
</script>

<template>
  <section
    class="preview-surface relative flex shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-stone-200/80 px-7 pb-6 pt-14 transition-[height] duration-200 motion-reduce:transition-none"
    :class="heightClass"
  >
    <div class="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-white/55 p-1 backdrop-blur-sm">
      <button
        class="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition active:bg-white/80"
        type="button"
        aria-label="重設樣式"
        @click="$emit('reset')"
      >
        <UndoDot :size="20" :stroke-width="1.75" aria-hidden="true" />
      </button>
      <button
        class="flex h-11 w-11 items-center justify-center rounded-full text-stone-900 transition active:bg-white/80 disabled:opacity-45"
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
    >{{ text || '今天也要慢慢來 ♡' }}</p>
  </section>
</template>
