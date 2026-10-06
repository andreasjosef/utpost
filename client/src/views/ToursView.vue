<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { TourWithRelations } from '@utpost/shared'
import { get } from '@/api'

const tours = ref<TourWithRelations[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    tours.value = await get<TourWithRelations[]>('/tours')
  } catch {
    error.value = 'Kunde inte hämta turerna'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <p v-if="loading">Laddar turer...</p>
  <p v-else-if="error">{{ error }}</p>
  <div v-else>
    <h1>Turer</h1>
    <table class="tours">
      <thead>
        <tr>
          <th>Tur</th>
          <th>Av</th>
          <th>Guide</th>
          <th>Längd</th>
          <th>Bilder</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tour in tours" :key="tour.id">
          <td>
            <RouterLink :to="`/turer/${tour.id}`">{{ tour.title }}</RouterLink>
          </td>
          <td>{{ tour.user?.display_name }}</td>
          <td>{{ tour.guide ? tour.guide.title : '-' }}</td>
          <td>{{ Math.round(tour.distance_m / 100) / 10 }} km</td>
          <td>{{ tour.photos.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
