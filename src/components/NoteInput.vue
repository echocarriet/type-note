<script>
export default {
  name: 'NoteInput',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      selectionStart: this.modelValue.length,
      selectionEnd: this.modelValue.length,
    }
  },
  methods: {
    updateValue(event) {
      this.$emit('update:modelValue', event.target.value)
      this.captureSelection(event)
    },

    captureSelection(event) {
      const input = event?.target || this.$refs.input
      if (!input) return

      this.selectionStart = input.selectionStart ?? this.modelValue.length
      this.selectionEnd = input.selectionEnd ?? this.selectionStart
    },

    insertText(value) {
      const start = Math.min(this.selectionStart, this.modelValue.length)
      const end = Math.min(this.selectionEnd, this.modelValue.length)
      const nextValue = `${this.modelValue.slice(0, start)}${value}${this.modelValue.slice(end)}`
      const nextCursor = start + value.length

      this.$emit('update:modelValue', nextValue)
      this.selectionStart = nextCursor
      this.selectionEnd = nextCursor

      this.$nextTick(() => {
        this.$refs.input?.focus()
        this.$refs.input?.setSelectionRange(nextCursor, nextCursor)
      })
    },
  },
}
</script>

<template>
  <div class="border-b border-stone-200 py-5">
    <label class="sr-only" for="sticker-text">貼圖文字</label>
    <textarea
      ref="input"
      id="sticker-text"
      class="min-h-24 w-full resize-none bg-transparent px-3 text-lg leading-relaxed text-stone-900 outline-none placeholder:text-stone-400"
      :value="modelValue"
      placeholder="輸入文字…"
      @blur="captureSelection"
      @click="captureSelection"
      @input="updateValue"
      @keyup="captureSelection"
      @select="captureSelection"
    />
  </div>
</template>
