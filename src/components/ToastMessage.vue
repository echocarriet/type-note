<script>
export default {
  name: 'ToastMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'success',
    },
  },
}
</script>

<template>
  <div
    class="w-max max-w-[calc(100%_-_2rem)] whitespace-normal rounded-full border px-4 py-2.5 text-center text-sm font-medium shadow-[0_8px_28px_rgba(48,42,36,0.16)] backdrop-blur"
    :class="type === 'warning' ? 'border-amber-200 bg-amber-50/95 text-amber-900' : 'border-stone-200 bg-stone-900/92 text-white'"
    role="status"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>
