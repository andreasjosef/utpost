<script setup>
import { ref, onMounted } from 'vue';

const guides = ref([]);

const fetchGuides = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/guides')
    if (!response.ok) throw new Error('Kunde inte hämta data')

    guides.value = await response.json()
  } catch (err) {
    console.log(err.message)
  }
}

onMounted(() => {
  fetchGuides()
})

const search = () => {
  fetch(`http://localhost:4000/api/guides/search?q=${query}`)
    .then((r) => r.json())
    .then(guides.value);
};
</script>

<template>
  <div>
    <h1>Guider</h1>
    <div className="searchrow">
      <!-- <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sök på namn eller landskap" /> -->
      <!-- <button className="btn-primary" @click="search">Sök</button> -->
    </div>
    <div className="grid">
      <ul>
        <li v-for="guide in guides" :key="guide.id">
          <h3>{{ guide.title }}</h3>
        </li>
      </ul>

    </div>
  </div>
</template>
