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
}
</script>

<template>
  <div class="border-b border-stone-200 py-5">
    <label class="sr-only" for="sticker-text">貼圖文字</label>
    <textarea
      id="sticker-text"
      class="min-h-24 w-full resize-none bg-transparent px-3 text-lg leading-relaxed text-stone-900 outline-none placeholder:text-stone-400"
      :value="modelValue"
      placeholder="輸入文字…"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>
