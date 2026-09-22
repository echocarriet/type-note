<script>
const TOOLS = [
  { id: 'font', icon: 'Aa', label: '字體', enabled: true },
  { id: 'symbols', icon: '✦', label: '符號', enabled: true },
  { id: 'layout', icon: '↔', label: '排版', enabled: true },
  { id: 'box', icon: '▢', label: '文字框', enabled: false },
]

export default {
  name: 'BottomToolbar',
  props: {
    activePanel: {
      type: String,
      default: '',
    },
  },
  emits: ['select'],
  data() {
    return { tools: TOOLS }
  },
}
</script>

<template>
  <nav class="sticky bottom-0 z-20 mt-auto border-t border-stone-200 bg-[#f7f4ee]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur" aria-label="編輯工具">
    <div class="grid grid-cols-4">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-stone-500 transition disabled:opacity-35"
        :class="activePanel === tool.id ? 'bg-white/80 text-stone-950' : ''"
        type="button"
        :disabled="!tool.enabled"
        :aria-pressed="activePanel === tool.id"
        @click="$emit('select', tool.id)"
      >
        <span class="text-xl leading-none" aria-hidden="true">{{ tool.icon }}</span>
        <span class="text-xs">{{ tool.label }}</span>
      </button>
    </div>
  </nav>
</template>
