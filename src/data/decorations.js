export const SYMBOL_CATEGORIES = [
  {
    id: 'common',
    label: '常用',
    items: ['♡', '♥︎', '✦', '✧', '୨୧', '𐙚', '𓂃', '𓈒𓏸', '⋆', '˚'],
  },
  {
    id: 'heart-star',
    label: '愛心與星星',
    items: ['❥', 'ღ', 'ෆ', '𓆩♡𓆪', '☆', '★', '⭒', '𖤐'],
  },
  {
    id: 'flower-decoration',
    label: '花朵與裝飾',
    items: ['❀', '✿', '❁', 'ꕤ', '𓆸', '𖧷', '⚘', '꒰ ꒱', '₊˚', '˖ ࣪', '⋆｡°✩'],
  },
  {
    id: 'arrow-line',
    label: '箭頭與線條',
    items: ['→', '←', '↑', '↓', '↗', '↘', '↔', '○', '●', '◌', '•', '─', '━', '〜', '﹏', '⋯'],
  },
  {
    id: 'bracket',
    label: '括號',
    items: ['（ ）', '〔 〕', '【 】', '〈 〉', '《 》', '「 」', '『 』'],
  },
]

export const KAOMOJI_CATEGORIES = [
  {
    id: 'happy-cute',
    label: '開心可愛',
    items: ['(˶ᵔ ᵕ ᵔ˶)', '(◍•ᴗ•◍)', '(*´▽`*)', '(๑˃ᴗ˂)ﻭ', '૮ ˶ᵔ ᵕ ᵔ˶ ა', '(｡•ㅅ•｡)♡', 'ʕ•ᴥ•ʔ', 'ฅ^•ﻌ•^ฅ', '(⸝⸝ᵕᴗᵕ⸝⸝)'],
  },
  {
    id: 'love-shy',
    label: '愛心害羞',
    items: ['( ˘ ³˘)♥', '(♡˙︶˙♡)', '(灬♥ω♥灬)', '♡(˃͈ દ ˂͈ ༶ )', '(´｡• ᵕ •｡`) ♡', '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', '(〃▽〃)', '(⁄˘⁄ ⁄ ω⁄ ⁄ ˘⁄)', '(｡･･｡)', '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)'],
  },
  {
    id: 'sad-tired',
    label: '難過無奈',
    items: ['(╥﹏╥)', '(っ˘̩╭╮˘̩)っ', '(｡•́︿•̀｡)', '(ಥ﹏ಥ)', '(இ﹏இ`)', '(´･_･`)', '(￣▽￣*)ゞ', '┐(´～｀)┌', '(－_－) zzZ', '(눈_눈)'],
  },
  {
    id: 'cheer-thanks',
    label: '加油謝謝',
    items: ['٩(ˊᗜˋ*)و', '(ง •̀_•́)ง', 'ᕦ(ò_óˇ)ᕤ', '୧(๑•̀ᗝ•́)૭', 'ᕙ(⇀‸↼‶)ᕗ', '(ㅅ´ ˘ `)', '(*ᴗ͈ˬᴗ͈)ꕤ*.ﾟ', '(人´∀`)', '♡⸜(˶˃ ᵕ ˂˶)⸝♡', '(*˘︶˘人)'],
  },
]

function createItems(categories, type) {
  return categories.flatMap((category) =>
    category.items.map((value, index) => ({
      id: `${category.id}-${index + 1}`,
      value,
      category: category.id,
      type,
    })),
  )
}

export const SYMBOLS = createItems(SYMBOL_CATEGORIES, 'symbol')
export const KAOMOJI = createItems(KAOMOJI_CATEGORIES, 'kaomoji')
export const DECORATIONS = [...SYMBOLS, ...KAOMOJI]

export function decorationKey(item) {
  return `${item.type}:${item.id}`
}
