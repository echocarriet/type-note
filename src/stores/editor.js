import { defineStore } from 'pinia'

const DEFAULT_STYLE = {
  textColor: '#282522',
  letterSpacing: 0,
  lineHeight: 1.4,
  align: 'center',
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    text: '今天也要慢慢來 ♡',
    ...DEFAULT_STYLE,
  }),

  actions: {
    resetStyle() {
      Object.assign(this, DEFAULT_STYLE)
    },
  },
})
