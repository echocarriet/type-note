<script>
export default {
  name: 'NoteInput',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue', 'line-count'],
  data() {
    return {
      selectionStart: this.modelValue.length,
      selectionEnd: this.modelValue.length,
      lineCount: 1,
      resizeObserver: null,
      isFocused: false,
      hasEdited: false,
    }
  },
  computed: {
    showEditorLabel() {
      return !this.isFocused && !this.hasEdited
    },
  },
  watch: {
    modelValue() {
      this.$nextTick(() => this.resizeTextarea())
    },
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(() => this.resizeTextarea())
    this.resizeObserver.observe(this.$el)
    this.resizeTextarea()
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect()
  },
  methods: {
    updateValue(event) {
      this.hasEdited = true
      this.$emit('update:modelValue', event.target.value)
      this.captureSelection(event)
      this.$nextTick(() => this.resizeTextarea())
    },

    focusInput() {
      this.$refs.input?.focus()
    },

    handleFocus() {
      this.isFocused = true
    },

    handleBlur(event) {
      this.isFocused = false
      this.captureSelection(event)
    },

    captureSelection(event) {
      const input = event?.target || this.$refs.input
      if (!input) return

      this.selectionStart = input.selectionStart ?? this.modelValue.length
      this.selectionEnd = input.selectionEnd ?? this.selectionStart
    },

    resizeTextarea() {
      const input = this.$refs.input
      if (!input) return

      input.style.height = '0px'
      const style = getComputedStyle(input)
      const lineHeight = Number.parseFloat(style.lineHeight) || 28
      const verticalPadding =
        Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      const maxHeight = lineHeight * 4 + verticalPadding
      const contentHeight = Math.max(lineHeight, input.scrollHeight - verticalPadding)
      const nextLineCount = Math.min(4, Math.max(1, Math.ceil((contentHeight - 1) / lineHeight)))

      input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`
      input.style.overflowY = input.scrollHeight > maxHeight + 1 ? 'auto' : 'hidden'

      if (nextLineCount !== this.lineCount) {
        this.lineCount = nextLineCount
        this.$emit('line-count', nextLineCount)
      }
    },

    insertText(value, { focus = false } = {}) {
      const start = Math.min(this.selectionStart, this.modelValue.length)
      const end = Math.min(this.selectionEnd, this.modelValue.length)
      const nextValue = `${this.modelValue.slice(0, start)}${value}${this.modelValue.slice(end)}`
      const nextCursor = start + value.length

      this.hasEdited = true
      this.$emit('update:modelValue', nextValue)
      this.selectionStart = nextCursor
      this.selectionEnd = nextCursor

      this.$nextTick(() => {
        this.resizeTextarea()
        if (focus) {
          this.$refs.input?.focus()
          this.$refs.input?.setSelectionRange(nextCursor, nextCursor)
        }
      })
    },

    blur() {
      this.captureSelection()
      this.isFocused = false
      this.$refs.input?.blur()
    },
  },
}
</script>

<template>
  <div
    class="shrink-0 cursor-text rounded-2xl border border-transparent bg-white/55 px-1 py-3 transition-[background-color,border-color,box-shadow] duration-150"
    :class="isFocused ? 'border-stone-200 bg-white shadow-[0_6px_20px_rgba(62,54,47,0.06)] ring-1 ring-stone-200/70' : ''"
    @click="focusInput"
  >
    <Transition name="editor-label">
      <label
        v-if="showEditorLabel"
        class="mb-1 block px-3 text-xs font-medium tracking-[0.04em] text-stone-500"
        for="sticker-text"
      >編輯文字</label>
    </Transition>
    <textarea
      ref="input"
      id="sticker-text"
      class="block w-full resize-none bg-transparent px-3 text-lg leading-relaxed text-stone-900 outline-none placeholder:text-stone-400"
      rows="1"
      :value="modelValue"
      placeholder="輸入文字…"
      @blur="handleBlur"
      @click="captureSelection"
      @focus="handleFocus"
      @input="updateValue"
      @keyup="captureSelection"
      @select="captureSelection"
    />
  </div>
</template>
