import { defineStore } from 'pinia'

const DEFAULT_STYLE = {
  textColor: '#282522',
  letterSpacing: 0,
  lineHeight: 1.4,
  align: 'center',
  writingMode: 'horizontal',
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    text: '',
    ...DEFAULT_STYLE,
  }),

  actions: {
    resetStyle() {
      Object.assign(this, DEFAULT_STYLE)
    },
  },
})
