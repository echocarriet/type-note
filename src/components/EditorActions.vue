<script>
export default {
  name: 'EditorActions',
  props: {
    isCopying: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['reset', 'copy'],
}
</script>

<template>
  <div class="flex items-center justify-between border-b border-stone-200 px-1 py-3">
    <button
      class="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-stone-500 transition active:bg-stone-100"
      type="button"
      @click="$emit('reset')"
    >
      <span aria-hidden="true" class="text-lg">↶</span>
      重設
    </button>

    <button
      class="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-stone-900 transition active:bg-stone-100 disabled:opacity-45"
      type="button"
      :disabled="isCopying"
      @click="$emit('copy')"
    >
      <span aria-hidden="true" class="text-base">▣</span>
      {{ isCopying ? '複製中…' : '複製 PNG' }}
    </button>
  </div>
</template>
