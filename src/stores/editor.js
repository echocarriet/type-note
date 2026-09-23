import { defineStore } from 'pinia'

const DEFAULT_BOX = {
  type: 'none',
  fillColor: '#FFFFFF',
  fillOpacity: 1,
  strokeColor: '#282522',
  strokeOpacity: 1,
  strokeWidth: 2,
  radius: 24,
  paddingX: 28,
  paddingY: 16,
}

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
    box: { ...DEFAULT_BOX },
  }),

  actions: {
    resetStyle() {
      Object.assign(this, DEFAULT_STYLE)
      this.box = { ...DEFAULT_BOX }
    },
  },
})
