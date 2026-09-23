<script>
import { Copy, LoaderCircle, Trash2, UndoDot } from '@lucide/vue'
import { createCurveLayout } from '../utils/curveLayout'

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
    boxStyle: {
      type: Object,
      required: true,
    },
    curve: {
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
  computed: {
    curvedLineLayouts() {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const fontSize = Number.parseFloat(this.previewStyle.fontSize) || 36
      const letterSpacing = Number.parseFloat(this.previewStyle.letterSpacing) || 0

      if (context) context.font = `${fontSize}px ${this.previewStyle.fontFamily}`

      return this.text.split('\n').map((line) => {
        const characters = this.getGraphemes(line || ' ')
        const widths = characters.map((character) =>
          context?.measureText(character).width || fontSize,
        )

        return {
          characters,
          layout: createCurveLayout(widths, letterSpacing, this.curve.amount),
        }
      })
    },

    curvedTextStyle() {
      return {
        color: this.previewStyle.color,
        fontFamily: this.previewStyle.fontFamily,
        fontSize: this.previewStyle.fontSize,
        lineHeight: this.previewStyle.lineHeight,
        textAlign: this.previewStyle.textAlign,
      }
    },

    curveLineAlignment() {
      return {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
      }[this.previewStyle.textAlign] || 'center'
    },
  },
  methods: {
    getGraphemes(text) {
      if (typeof Intl.Segmenter === 'function') {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        return Array.from(segmenter.segment(text), ({ segment }) => segment)
      }

      return Array.from(text)
    },

    curveLineStyle(layout) {
      return {
        alignItems: 'baseline',
        display: 'flex',
        justifyContent: this.curveLineAlignment,
        paddingBottom: this.curve.amount < 0 ? `${layout.heightOffset}px` : '0',
        paddingTop: this.curve.amount > 0 ? `${layout.heightOffset}px` : '0',
        width: '100%',
      }
    },

    curveCharacterStyle(index, line) {
      const glyph = line.layout.glyphs[index]

      return {
        display: 'inline-block',
        marginRight: index < line.characters.length - 1 ? this.previewStyle.letterSpacing : '0',
        transform: `translate(${glyph.translateX}px, ${glyph.translateY}px) rotate(${glyph.rotation}deg)`,
        transformOrigin: 'center',
        whiteSpace: 'pre',
      }
    },
  },
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

    <div
      class="preview-box max-h-full max-w-full"
      :class="curve.enabled ? 'overflow-visible' : 'overflow-auto'"
      :style="boxStyle"
    >
      <div
        v-if="curve.enabled"
        class="curved-preview flex max-h-full max-w-full flex-col overflow-visible"
        :style="curvedTextStyle"
      >
        <div
          v-for="(line, lineIndex) in curvedLineLayouts"
          :key="lineIndex"
          :style="curveLineStyle(line.layout)"
        >
          <span
            v-for="(character, characterIndex) in line.characters"
            :key="`${lineIndex}-${characterIndex}`"
            :style="curveCharacterStyle(characterIndex, line)"
          >{{ character }}</span>
        </div>
      </div>
      <p
        v-else
        class="preview-text max-h-full max-w-full whitespace-pre-wrap break-words text-4xl"
        :style="previewStyle"
      >{{ text }}</p>
    </div>
  </section>
</template>
