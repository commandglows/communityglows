<template>
  <div class="gmail-container">
    <div class="gmail-header">
      <h2>Gmail</h2>
      <div
        v-if="store.gmail.unreadCount"
        class="unread-count"
      >
        {{ store.gmail.unreadCount }} non lu(s)
      </div>
    </div>

    <CrmToolbar class="crm-toolbar-container" />

    <div class="gmail-content">
      <!-- Liste des emails -->
      <div class="emails-section">
        <div
          v-if="loading"
          class="loading-state"
        >
          <i
            class="pi pi-spin pi-spinner status-icon"
          ></i>
          <p>Chargement des emails...</p>
        </div>

        <div
          v-else-if="!store.gmail.emails?.length"
          class="empty-state"
        >
          <i
            class="pi pi-inbox status-icon"
          ></i>
          <p>Aucun email à afficher</p>
        </div>

        <div
          v-else
          class="emails-list"
        >
          <div 
            v-for="email in store.gmail.emails" 
            :key="email.id" 
            class="email-item" 
            :class="{ 'unread': !email.isRead }"
            @click="openEmail(email)"
          >
            <div class="email-header">
              <SocialAvatar 
                :user="{
                  username: email.sender.name,
                  avatar: email.sender.avatar
                }" 
                size="normal" 
              />
              <span class="sender">{{ email.sender.name }}</span>
              <Button
                v-tooltip.left="$t('gmail.add_to_kanban')"
                icon="pi pi-plus"
                text
                rounded
                @click.stop="addToKanban(email)"
              />
              <span class="date">{{ formatDate(email.date) }}</span>
            </div>
            <div class="email-content">
              <h3>{{ email.subject }}</h3>
              <p>{{ email.preview }}</p>
            </div>
            <div
              v-if="email.labels?.length"
              class="email-labels"
            >
              <span
                v-for="label in email.labels"
                :key="label"
                class="label"
              >{{ label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban -->
      <div class="kanban-section">
        <KanbanBoard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SocialAvatar from '../feed/SocialAvatar.vue'
import KanbanBoard from '../kanban/KanbanBoard.vue'
import CrmToolbar from '../CrmToolbar.vue'
import { formatDate } from '../../utils/dateFormatter'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import { useKanbanStore } from '@/stores/kanban'
import Button from 'primevue/button'
import type { Email } from '../../types'

const store = useSocialNetworksStore()
const kanbanStore = useKanbanStore()
const loading = ref(true)

const openEmail = (email: Email) => {
  const emailToUpdate = store.gmail.emails.find(e => e.id === email.id)
  if (emailToUpdate) {
    emailToUpdate.isRead = true
  }
}

const addToKanban = (email: Email) => {
  kanbanStore.addEmailToKanban(email)
}

onMounted(async () => {
  try {
    await store.fetchGmailData()
    await kanbanStore.initialize()
  } catch (error) {
    console.error('Erreur lors du chargement des emails:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.gmail-container {
  height: var(--sg-sidebar-fill-size);
  padding: var(--sg-crm-content-padding);
  display: flex;
  flex-direction: column;
}

.gmail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sg-crm-section-spacing);
}

.crm-toolbar-container {
  flex-shrink: 0;
  margin-bottom: var(--sg-crm-section-spacing);
}

.gmail-header h2 {
  margin: 0;
}

.unread-count {
  background: var(--primary-color);
  color: white;
  padding: var(--sg-crm-unread-padding-block) var(--sg-crm-unread-padding-inline);
  border-radius: var(--sg-crm-pill-radius);
  font-size: var(--sg-crm-secondary-copy-size);
}

.gmail-content {
  display: flex;
  gap: var(--sg-crm-section-spacing);
  flex: 1;
  overflow: hidden;
}

.emails-section {
  flex: 1;
  overflow-y: auto;
}

.kanban-section {
  flex: 1;
  overflow: hidden;
  background: var(--surface-ground);
  border-radius: var(--sg-crm-card-radius);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: var(--sg-crm-empty-height);
  color: var(--text-color-secondary);
}

.status-icon {
  font-size: var(--sg-crm-status-icon-size);
}

.loading-state p,
.empty-state p {
  margin-top: var(--sg-crm-section-spacing);
}

.emails-list {
  display: flex;
  flex-direction: column;
  gap: var(--sg-crm-section-spacing);
}

.email-item {
  background: var(--surface-card);
  border-radius: var(--sg-crm-card-radius);
  padding: var(--sg-crm-card-padding);
  border: 1px solid var(--surface-border);
  transition: var(--sg-crm-card-transition);
  cursor: pointer;
}

.email-item:hover {
  transform: translateY(var(--sg-crm-card-hover-offset));
  box-shadow: var(--sg-crm-card-hover-shadow);
}

.email-item.unread {
  background: var(--surface-hover);
  font-weight: bold;
}

.email-header {
  display: flex;
  align-items: center;
  gap: var(--sg-crm-item-gap);
  margin-bottom: var(--sg-crm-item-gap);
}

.sender {
  font-weight: bold;
  flex: 1;
}

.date {
  color: var(--text-color-secondary);
  font-size: var(--sg-crm-secondary-copy-size);
}

.email-content h3 {
  margin: var(--sg-crm-item-gap) 0;
  font-size: var(--sg-crm-heading-size);
}

.email-content p {
  margin: 0;
  color: var(--text-color-secondary);
}

.email-labels {
  display: flex;
  gap: var(--sg-crm-item-gap);
  margin-top: var(--sg-crm-item-gap);
}

.label {
  background: var(--primary-color);
  color: white;
  padding: var(--sg-crm-label-padding-block) var(--sg-crm-label-padding-inline);
  border-radius: var(--sg-crm-label-radius);
  font-size: var(--sg-crm-label-size);
}

@media (max-width: 1024px) {
  .gmail-content {
    flex-direction: column;
  }

  .emails-section,
  .kanban-section {
    flex: none;
    height: var(--sg-crm-empty-height);
  }
}
</style> 
