<template>
  <div
    class="filters-wrapper"
    :class="{ 'is-compact': isFiltersCompact }"
  >
    <div class="filters-group">
      <!-- Date Range Picker -->
      <div class="date-range-fields">
        <input
          aria-label="Date de début"
          class="date-input"
          type="date"
          :disabled="!currentNetwork"
          :value="formatDateForInput(filters.dateRange[0])"
          @input="setDateRangeValue(0, $event)"
        >
        <span
          aria-hidden="true"
          class="date-range-separator"
        >-</span>
        <input
          aria-label="Date de fin"
          class="date-input"
          type="date"
          :disabled="!currentNetwork"
          :value="formatDateForInput(filters.dateRange[1])"
          @input="setDateRangeValue(1, $event)"
        >
      </div>

      <!-- Quick Date Filters -->
      <div class="quick-filters">
        <SgButton
          v-for="filter in quickDateFilters" 
          :key="filter.value"
          :label="filter.label"
          :outlined="filters.quickDate !== filter.value"
          :severity="filters.quickDate === filter.value ? 'primary' : 'secondary'"
          size="small"
          :disabled="!currentNetwork"
          @click="selectQuickDate(filter.value)"
        />
      </div>

      <!-- Filters -->
      <SgMultiSelect
        v-model="filters.selectedFilters"
        :options="filterOptions"
        aria-label="Filtres"
        :disabled="!currentNetwork"
      />

      <!-- Sort Options -->
      <select
        v-model="filters.sort"
        class="sort-select"
        aria-label="Trier par"
        :disabled="!currentNetwork"
      >
        <option
          :value="null"
          disabled
        >
          Trier par
        </option>
        <option
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Reset Button -->
      <SgButton
        v-sg-tooltip="$t('filters.reset_tooltip')"
        :aria-label="$t('filters.reset_tooltip')"
        icon="pi pi-filter-slash" 
        text
        severity="secondary"
        :disabled="!currentNetwork"
        @click="resetFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { RESPONSIVE_BREAKPOINTS } from '@/design-tokens'
import type { MenuItem } from '../types'
import SgButton from './ui/SgButton.vue'
import SgMultiSelect from './ui/SgMultiSelect.vue'

interface FilterOption {
  label: string
  value: string
}

interface Filters {
  dateRange: [Date | null, Date | null]
  quickDate: string | null
  selectedFilters: string[]
  sort: string | null
}

const props = defineProps<{
  currentNetwork: MenuItem | null
}>()

const filters = ref<Filters>({
  dateRange: [null, null],
  quickDate: null,
  selectedFilters: [],
  sort: null
})

const quickDateFilters: FilterOption[] = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours', value: 'week' },
  { label: '30 jours', value: 'month' },
  { label: 'Cette année', value: 'year' }
]

const isFiltersCompact = useMediaQuery(`(max-width: ${RESPONSIVE_BREAKPOINTS.filtersCompact}px)`)

const filterOptions: FilterOption[] = [
  { label: 'Publications', value: 'posts' },
  { label: 'Commentaires', value: 'comments' },
  { label: 'Mentions', value: 'mentions' },
  { label: 'Messages privés', value: 'dm' }
]

const sortOptions: FilterOption[] = [
  { label: 'Plus récent', value: 'newest' },
  { label: 'Plus ancien', value: 'oldest' },
  { label: 'Plus populaire', value: 'popular' },
  { label: 'Plus commentés', value: 'comments' }
]

const selectQuickDate = (value: string) => {
  filters.value.quickDate = value
  filters.value.dateRange = [null, null]
}

const formatDateForInput = (date: Date | null) => {
  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateInput = (value: string) => {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`)
}

const setDateRangeValue = (index: 0 | 1, event: Event) => {
  const target = event.target as HTMLInputElement
  const nextRange: [Date | null, Date | null] = [...filters.value.dateRange]
  nextRange[index] = parseDateInput(target.value)
  filters.value.dateRange = nextRange
  filters.value.quickDate = null
}

const resetFilters = () => {
  filters.value = {
    dateRange: [null, null],
    quickDate: null,
    selectedFilters: [],
    sort: null
  }
}

const emit = defineEmits<{
  'filter-change': [filters: Filters]
}>()

watch(filters, (newFilters) => {
  emit('filter-change', newFilters)
}, { deep: true })
</script>

<style scoped>
.filters-wrapper {
  display: flex;
  align-items: center;
  width: var(--sg-size-100pct);
  min-width: 0;
}

.filters-group {
  display: flex;
  align-items: center;
  gap: var(--sg-filter-gap);
  flex: 1;
  width: var(--sg-size-100pct);
  min-width: 0;
  flex-wrap: wrap;
}

.quick-filters {
  display: flex;
  gap: var(--sg-space-0d5rem);
  flex-wrap: wrap;
  overflow-x: auto;
  scrollbar-width: var(--sg-size-none);
  -ms-overflow-style: none;
  width: var(--sg-size-100pct);
  min-width: 0;
}

.quick-filters::-webkit-scrollbar {
  display: none;
}

.date-range-fields {
  display: flex;
  align-items: center;
  gap: var(--sg-filter-date-gap);
  flex-shrink: 0;
}

.date-input {
  width: var(--sg-filter-date-width);
  min-height: var(--sg-field-min-height);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  padding: var(--sg-field-padding);
  font: inherit;
}

.date-input:disabled {
  cursor: not-allowed;
  opacity: var(--sg-opacity-disabled);
}

.date-range-separator {
  color: var(--sg-color-text-muted);
}

.sort-select,
:deep(.sg-multiselect) {
  min-height: var(--sg-field-min-height);
  border: 1px solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
}

:deep(.sg-multiselect) { width: var(--sg-filter-multi-width); }
.sort-select { width: var(--sg-filter-sort-width); padding: var(--sg-field-padding); }
.date-input:focus-visible, .sort-select:focus-visible { outline: var(--sg-focus-ring); outline-offset: var(--sg-focus-offset); }
.sort-select:disabled { cursor: not-allowed; opacity: var(--sg-opacity-disabled); }

.filters-wrapper.is-compact {
  flex-direction: column;
  align-items: stretch;
}

.filters-wrapper.is-compact .filters-group {
  flex-wrap: wrap;
  gap: var(--sg-space-0d5rem);
}

.filters-wrapper.is-compact :deep(.sg-multiselect),
.filters-wrapper.is-compact .sort-select,
.filters-wrapper.is-compact .date-range-fields,
.filters-wrapper.is-compact .quick-filters,
.filters-wrapper.is-compact :deep(button),
.filters-wrapper.is-compact .date-input {
  width: var(--sg-sidebar-fill-size);
}

.filters-wrapper.is-compact .date-input {
  width: min(100%, var(--sg-filter-date-width));
}

.filters-wrapper.is-compact .sort-select {
  width: var(--sg-sidebar-fill-size);
  min-width: 0;
}
</style>
