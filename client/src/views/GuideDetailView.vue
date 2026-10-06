<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Guide } from '@utpost/shared'
import { get } from '@/api'

const route = useRoute()
const guide = ref<Guide | null>(null)
const error = ref('')

const fetchGuide = async (slug: string) => {
  guide.value = null
  error.value = ''
  try {
    guide.value = await get<Guide>(`/guides/${slug}`)
  } catch {
    error.value = 'Kunde inte hämta guiden'
  }
}

// Route-parametrar är string | string[]. /guider/:slug ger alltid en string.
watch(
  () => route.params.slug,
  (slug) => {
    if (typeof slug === 'string') fetchGuide(slug)
  },
  { immediate: true },
)
</script>

<template>
  <p v-if="error">{{ error }}</p>
  <p v-else-if="!guide">Laddar...</p>
  <article v-else class="guide">
    <h1>{{ guide.title }}</h1>
    <p class="muted">{{ guide.region }} · {{ guide.difficulty }} · {{ guide.length_km }} km</p>
    <div v-html="guide.body_html" />
  </article>
</template>
