<script setup lang="ts">
import { useQuery } from '@urql/vue'
import { RouterLink } from 'vue-router'
import { graphql } from '../gql'

// Turlistan via GraphQL (M5). Via REST hämtade /api/tours alla mätpunkter för en tabell med
// fem kolumner; nu ber frågan om det tabellen behöver. Det här är samma fråga som mäts i README
// (Mätning före/efter) och i integrationstestet: 135 databasfrågor i M4, 4 med DataLoader.
const TurerDocument = graphql(/* GraphQL */ `
  query Turer {
    tours {
      id
      title
      distanceM
      startedAt
      user {
        displayName
      }
      guide {
        title
        slug
      }
      photos {
        id
      }
    }
  }
`)

const { data, fetching, error } = useQuery({ query: TurerDocument })
</script>

<template>
  <p v-if="error" role="alert">Kunde inte hämta turerna</p>
  <p v-else-if="fetching || !data">Laddar turer...</p>
  <p v-else-if="data.tours.length === 0">Inga turer än</p>
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
        <tr v-for="tour in data.tours" :key="tour.id">
          <td>
            <RouterLink :to="`/turer/${tour.id}`">{{ tour.title }}</RouterLink>
          </td>
          <td>{{ tour.user.displayName }}</td>
          <td>{{ tour.guide ? tour.guide.title : '-' }}</td>
          <td>{{ Math.round(tour.distanceM / 100) / 10 }} km</td>
          <td>{{ tour.photos.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
