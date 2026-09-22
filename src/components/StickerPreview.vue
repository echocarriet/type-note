<script>
export default {
  name: 'StickerPreview',
  props: {
    text: {
      type: String,
      required: true,
    },
    previewStyle: {
      type: Object,
      required: true,
    },
  },
}
</script>

<template>
  <section class="preview-surface flex min-h-64 items-center justify-center rounded-[26px] border border-stone-200/80 px-7 py-10">
    <p
      class="max-w-full whitespace-pre-wrap break-words text-4xl"
      :style="previewStyle"
    >{{ text || '今天也要慢慢來 ♡' }}</p>
  </section>
</template>
