<template>
  <SplitterGroup
    direction="horizontal"
    @layout="handleResize"
  >
    <SplitterPanel
      v-show="modelValue"
      ref="sidebarPanel"
      :default-size="SIDEBAR_EXPANDED_SIZE"
      :min-size="3"
      :max-size="SIDEBAR_MAX_SIZE"
      :collapsed-size="0"
      collapsible
      class="sidebar"
      :class="{ 'icons-only': iconsOnly }"
    >
      <ContextMenuRoot @update:open="sidebarContextOpen = $event">
        <ContextMenuTrigger
          as-child
          @contextmenu="identifySidebarContextTarget"
        >
          <div
            ref="sidebarElement"
            class="sidebar-content"
            :class="{ 'content-centered': iconsOnly }"
            :style="sidebarStyle"
          >
            <div class="sidebar-main">
              <div
                v-if="controlBarPosition === 'top' || !iconsOnly"
                class="sidebar-header"
                :class="
                  iconsOnly
                    ? 'sidebar-header--centered'
                    : 'sidebar-header--spaced'
                "
              >
                <Button
                  v-if="controlBarPosition === 'top'"
                  v-sg-tooltip.right="'Toggle left sidebar'"
                  icon="pi pi-bars"
                  text
                  aria-label="Toggle left sidebar"
                  @click="toggleSidebar"
                />
                <h1
                  v-if="!iconsOnly"
                  class="app-title"
                >
                  CommunityGlows
                </h1>
              </div>

              <ProfileSwitcher
                :icons-only="iconsOnly"
                menu-direction="down"
                class="profile-switcher-top"
                @manage-profiles="emit('manage-profiles')"
                @open-settings="emit('open-settings')"
              />

              <div
                v-if="
                  networkEditMode ||
                  (sidebarPreferences.bentoDisplay === 'grouped' &&
                    !bentoHidden)
                "
                class="sidebar-bento-entry"
                ref="bentoEntry"
                :class="{
                  'sidebar-bento-entry--editing': networkEditMode,
                  'sidebar-bento-entry--hidden': bentoHidden,
                  'sidebar-bento-entry--open': bentoMenuOpen,
                }"
                @pointerenter="enterBentoMenu"
                @pointerleave="leaveBentoMenu"
                @keydown.esc.stop.prevent="dismissBentoMenu(true)"
                @keydown.down.prevent="focusBentoItem(1)"
                @keydown.up.prevent="focusBentoItem(-1)"
                @focusout="leaveBentoFocus"
              >
                <div class="sidebar-bento-entry__row">
                  <SidebarNavButton
                    :label="selectedBento?.name ?? 'Bento'"
                    :tooltip="
                      iconsOnly ? (selectedBento?.name ?? 'Bento') : undefined
                    "
                    :compact="iconsOnly"
                    :active="networkEditMode ? false : bentoActive"
                    :aria-pressed="networkEditMode ? !bentoHidden : bentoActive"
                    :aria-expanded="networkEditMode ? undefined : bentoMenuOpen"
                    :aria-haspopup="networkEditMode ? undefined : 'menu'"
                    @click="
                      networkEditMode
                        ? toggleBentoVisibility()
                        : toggleBentoMenu()
                    "
                  >
                    <template #icon>
                      <span
                        v-if="selectedBento"
                        class="sidebar-bento-scene__appearance"
                        aria-hidden="true"
                      >
                        {{ selectedBento.icon }}
                      </span>
                      <SgIcon
                        v-else
                        icon="pi pi-th-large"
                      />
                    </template>
                  </SidebarNavButton>
                  <span
                    v-if="networkEditMode"
                    class="network-visibility-indicator"
                    aria-hidden="true"
                  >
                    <i :class="bentoHidden ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                  </span>
                </div>
                <SidebarDropdownPanel
                  v-if="bentoMenuOpen && !iconsOnly"
                  class="sidebar-bento-menu"
                  role="menu"
                  aria-label="Bentos enregistrés"
                >
                  <div
                    v-for="scene in bentoScenes"
                    :key="scene.id"
                    class="sidebar-bento-scene"
                    @contextmenu.prevent="openSceneContextMenu(scene.id)"
                    @keydown.shift.f10.prevent="openSceneContextMenu(scene.id)"
                  >
                    <button
                      type="button"
                      class="sidebar-bento-scene__button"
                      :class="{
                        'sidebar-bento-scene__button--selected':
                          selectedBentoId === scene.id,
                      }"
                      role="menuitemradio"
                      :aria-checked="selectedBentoId === scene.id"
                      @click="requestSceneAction('load', scene.id)"
                    >
                      <span
                        class="sidebar-bento-scene__appearance"
                        aria-hidden="true"
                      >
                        {{ scene.icon }}
                      </span>
                      <span class="sidebar-bento-scene__name">
                        {{ scene.name }}
                      </span>
                      <SgIcon
                        v-if="selectedBentoId === scene.id"
                        icon="pi pi-check"
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      v-if="sceneContextMenuId === scene.id"
                      class="sidebar-bento-context-menu"
                      role="menu"
                      aria-label="Actions du Bento"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        @click="requestSceneAction('edit', scene.id)"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        @click="requestSceneAction('delete', scene.id)"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <div class="sidebar-bento-menu__footer">
                    <button
                      type="button"
                      role="menuitem"
                      @click="requestSceneAction('create')"
                    >
                      <SgIcon icon="pi pi-plus" />
                      <span>{{ $t("sidebar.bento_display.create") }}</span>
                    </button>
                    <button
                      v-if="selectedBentoId"
                      type="button"
                      role="menuitem"
                      @click="requestSceneAction('edit', selectedBentoId)"
                    >
                      <SgIcon icon="pi pi-pencil" />
                      <span>{{ $t("sidebar.bento_display.rename") }}</span>
                    </button>
                  </div>
                </SidebarDropdownPanel>
              </div>

              <KanbanDropdown class="sidebar-kanban-entry" :compact="iconsOnly" :active="kanbanActive" @open="emit('open-tasks', $event)" />

              <div
                class="sidebar-scrollable-content"
                data-keyboard-node="sidebar"
                tabindex="0"
                role="group"
                aria-label="Navigation"
                @keydown="navigateHierarchy"
              >
                <div
                  v-if="networkEditMode && !iconsOnly"
                  class="sidebar-network-search"
                >
                  <SgIcon
                    icon="pi pi-search"
                    aria-hidden="true"
                  />
                  <input
                    v-model="networkSearch"
                    type="search"
                    :aria-label="$t('sidebar.network_search.label')"
                    :placeholder="$t('sidebar.network_search.placeholder')"
                    autocomplete="off"
                    spellcheck="false"
                    @keydown.esc.stop="networkSearch = ''"
                  />
                  <button
                    v-if="networkSearch"
                    type="button"
                    class="sidebar-network-search__clear"
                    :aria-label="$t('sidebar.network_search.clear')"
                    @click="networkSearch = ''"
                  >
                    <SgIcon
                      icon="pi pi-times"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <slot
                  name="organization"
                  :compact="iconsOnly"
                />
                <p
                  v-if="
                    networkSearchNormalized &&
                    !filteredSidebarDisplaySections.some(
                      (section) => !section.header,
                    )
                  "
                  class="sidebar-network-search__empty"
                  role="status"
                >
                  {{ $t("sidebar.network_search.no_results") }}
                </p>
                <p
                  v-if="organizationError"
                  class="sidebar-organization-error"
                  role="alert"
                >
                  {{ organizationError }}
                </p>
                <span
                  class="sidebar-organization-announcement"
                  role="status"
                  aria-live="polite"
                >
                  {{ organizationAnnouncement }}
                </span>
                <div
                  v-sidebar-pointer-drag
                  class="menu-section network-menu-section"
                >
                  <section
                    v-for="group in filteredSidebarDisplaySections"
                    :key="group.renderKey"
                    :data-organization-group="group.id"
                    :data-keyboard-node="
                      group.header && group.id !== 'other'
                        ? `group:${group.id}`
                        : undefined
                    "
                    :data-keyboard-parent="
                      groupPreferences.parents[group.id]
                        ? `group:${groupPreferences.parents[group.id]}`
                        : 'sidebar'
                    "
                    :aria-label="
                      groupPreferences.names[group.id] || $t(group.labelKey)
                    "
                    tabindex="-1"
                    :data-group-tone="
                      group.id !== 'other'
                        ? sidebarGroupTones.get(group.id)
                        : undefined
                    "
                    :style="sidebarGroupSurfaces.get(group.renderKey)?.style"
                    :data-group-start="
                      sidebarGroupSurfaces.get(group.renderKey)?.start ||
                      undefined
                    "
                    :data-group-end="
                      sidebarGroupSurfaces.get(group.renderKey)?.end ||
                      undefined
                    "
                    :data-group-insertion-after="
                      groupAfterDropKey === group.renderKey || undefined
                    "
                    v-show="
                      networkSearchNormalized ||
                      !sidebarGroupAncestors(groupPreferences, group.id).some(
                        (id) => collapsedNetworkGroups.has(id),
                      )
                    "
                    :class="{
                      'sidebar-group-depth-2':
                        !iconsOnly &&
                        sidebarGroupAncestors(groupPreferences, group.id)
                          .length === 1,
                      'sidebar-group-depth-3':
                        !iconsOnly &&
                        sidebarGroupAncestors(groupPreferences, group.id)
                          .length === 2,
                    }"
                  >
                    <span
                      v-for="layer in sidebarGroupSurfaces.get(group.renderKey)
                        ?.layers"
                      :key="layer.id"
                      class="sidebar-group-surface"
                      aria-hidden="true"
                      :data-surface-group="layer.id"
                      :data-surface-highlight="
                        hoveredSidebarGroup === layer.id ||
                        isContextHighlighted('group', layer.id) ||
                        undefined
                      "
                      :style="layer.style"
                      :data-surface-start="layer.start || undefined"
                      :data-surface-end="layer.end || undefined"
                    />
                    <NetworkGroupHeader
                      v-if="group.header"
                      @mouseenter="hoveredSidebarGroup = group.id"
                      @mouseleave="hoveredSidebarGroup = ''"
                      draggable="false"
                      :data-sidebar-draggable="
                        group.id !== 'other' && !renameTarget
                      "
                      :data-drop-position="dropPositionFor('group', group.id)"
                      :title="$t('sidebar.organization.drag_hint')"
                      @dragstart="startSidebarDrag($event, 'group', group.id)"
                      @dragover="overSidebarGroup($event, group.id)"
                      @dragleave="leaveSidebarDrop"
                      @drop.stop="dropSidebarDrag"
                      @dragend="cancelSidebarDrag"
                      @keydown.alt.up.prevent="
                        moveSidebarByKey('group', group.id, -1)
                      "
                      @keydown.alt.down.prevent="
                        moveSidebarByKey('group', group.id, 1)
                      "
                      :data-sidebar-group="group.id"
                      :data-context-highlight="
                        isContextHighlighted('group', group.id) || undefined
                      "
                      :label="
                        groupPreferences.names[group.id] || $t(group.labelKey)
                      "
                      :icon="group.icon"
                      :selection="groupSelection(group.descendantItems)"
                      :count="
                        group.descendantItems.filter(
                          (item) => !isNetworkHiddenForProfile(item),
                        ).length
                      "
                      :total="group.descendantItems.length"
                      :selecting="networkEditMode"
                      :expanded="!collapsedNetworkGroups.has(group.id)"
                      :compact="iconsOnly"
                      @toggle="toggleNetworkGroup(group.descendantItems)"
                      @collapse="toggleNetworkGroupExpanded(group.id)"
                    >
                      <template #label>
                        <InlineSidebarLabel
                          :label="
                            groupPreferences.names[group.id] ||
                            $t(group.labelKey)
                          "
                          :editing="renameTarget === `group:${group.id}`"
                          @save="saveInlineName"
                          @cancel="renameTarget = ''"
                        />
                      </template>
                    </NetworkGroupHeader>
                    <div
                      v-show="
                        networkSearchNormalized ||
                        group.id === 'other' ||
                        !collapsedNetworkGroups.has(group.id)
                      "
                      class="menu-items"
                    >
                      <div
                        v-for="item in group.items"
                        :key="item.id"
                        class="menu-item-group"
                      >
                        <div
                          class="network-row"
                          :data-keyboard-node="`network:${item.id}`"
                          :data-keyboard-parent="
                            group.id === 'other'
                              ? 'sidebar'
                              : `group:${group.id}`
                          "
                          :aria-label="networkLabel(item)"
                          tabindex="-1"
                          role="group"
                          draggable="false"
                          :data-sidebar-draggable="!renameTarget"
                          :data-drop-position="
                            dropPositionFor('network', item.route.slice(1))
                          "
                          :title="$t('sidebar.organization.drag_hint')"
                          @dragstart="
                            startSidebarDrag(
                              $event,
                              'network',
                              item.route.slice(1),
                            )
                          "
                          @dragover.stop="
                            overSidebarNetwork(
                              $event,
                              item.route.slice(1),
                              group.id,
                            )
                          "
                          @dragleave="leaveSidebarDrop"
                          @drop.stop="dropSidebarDrag"
                          @dragend="cancelSidebarDrag"
                          @keydown.alt.up.prevent="
                            moveSidebarByKey('network', item.route.slice(1), -1)
                          "
                          @keydown.alt.down.prevent="
                            moveSidebarByKey('network', item.route.slice(1), 1)
                          "
                          :data-sidebar-network="item.route.slice(1)"
                          :data-context-highlight="
                            isContextHighlighted(
                              'network',
                              item.route.slice(1),
                            ) || undefined
                          "
                          :class="{
                            active: isNetworkActive(item),
                            'network-row--editing': networkEditMode,
                            'network-row--hidden':
                              isNetworkHiddenForProfile(item),
                          }"
                        >
                          <SidebarNavButton
                            :label="networkLabel(item)"
                            :tooltip="iconsOnly ? item.label : undefined"
                            :compact="iconsOnly"
                            :active="isNetworkActive(item)"
                            :aria-pressed="
                              networkEditMode
                                ? !isNetworkHiddenForProfile(item)
                                : undefined
                            "
                            @click="
                              networkEditMode
                                ? isSceneItem(item)
                                  ? navigateToNetwork(item)
                                  : toggleNetworkVisibility(item)
                                : navigateToNetwork(item)
                            "
                          >
                            <template #label>
                              <InlineSidebarLabel
                                :label="networkLabel(item)"
                                :editing="
                                  renameTarget ===
                                  `network:${item.route.slice(1)}`
                                "
                                @save="saveInlineName"
                                @cancel="renameTarget = ''"
                              />
                            </template>
                            <template #icon>
                              <span
                                class="sidebar-network-tile"
                                :class="{
                                  'sidebar-network-tile--colored':
                                    networkColors[canonicalSidebarId(item)],
                                }"
                                :style="{
                                  background:
                                    networkColors[canonicalSidebarId(item)],
                                }"
                              >
                                <SgIcon
                                  v-if="isSceneItem(item)"
                                  icon="pi pi-th-large"
                                />
                                <NetworkBrandIcon
                                  v-else
                                  :network-id="canonicalSidebarId(item)"
                                  :fallback-icon="item.icon"
                                />
                              </span>
                            </template>
                          </SidebarNavButton>
                          <span
                            v-if="networkEditMode"
                            class="network-visibility-indicator"
                            aria-hidden="true"
                          >
                            <i
                              :class="
                                isNetworkHiddenForProfile(item)
                                  ? 'pi pi-eye-slash'
                                  : 'pi pi-eye'
                              "
                            />
                          </span>
                          <Button
                            v-if="
                              networkEditMode &&
                              item.route.slice(1).startsWith('custom-') &&
                              !iconsOnly
                            "
                            icon="pi pi-times"
                            text
                            size="small"
                            :aria-label="$t('common.delete')"
                            @click="removeCustomLink(item.route.slice(1))"
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                  <div
                    v-if="sidebarDrag"
                    class="sidebar-root-drop"
                    :data-drop-position="rootDropActive ? 'inside' : undefined"
                    @dragover.prevent.stop="rootDropActive = true"
                    @dragleave="rootDropActive = false"
                    @drop.prevent.stop="dropAtRoot"
                  >
                    {{ $t("sidebar.organization.drop_root") }}
                  </div>
                </div>

                <!-- Custom Links -->
                <div
                  v-if="networkEditMode"
                  class="custom-links-section"
                >
                  <div
                    v-if="networkEditMode && !iconsOnly"
                    class="section-header"
                  >
                    <h3>{{ $t("sidebar.custom_links_section") }}</h3>
                    <Button
                      v-sg-tooltip.right="$t('links.add_tooltip')"
                      icon="pi pi-plus"
                      text
                      size="small"
                      type="button"
                      :aria-label="$t('links.add_button')"
                      @mouseenter="setAddLinkTooltipOverlay(true)"
                      @mouseleave="setAddLinkTooltipOverlay(false)"
                      @click="openAddLinkDialog"
                    />
                  </div>
                  <Button
                    v-if="networkEditMode && iconsOnly"
                    v-sg-tooltip.right="$t('links.add_tooltip')"
                    icon="pi pi-plus"
                    text
                    size="small"
                    class="custom-link-add-icon"
                    type="button"
                    :aria-label="$t('links.add_button')"
                    @mouseenter="setAddLinkTooltipOverlay(true)"
                    @mouseleave="setAddLinkTooltipOverlay(false)"
                    @click="openAddLinkDialog"
                  />
                </div>

                <SgDialog
                  v-model="showAddLinkDialog"
                  :title="$t('links.add_dialog_title')"
                  variant="sidebar"
                >
                  <form
                    class="add-link-form"
                    @submit.prevent="addCustomLink"
                  >
                    <p class="add-link-hint">
                      {{ $t("links.add_dialog_hint") }}
                    </p>

                    <label class="add-link-field">
                      <span>{{ $t("links.name_label") }}</span>
                      <input
                        v-model="newLinkLabel"
                        :placeholder="$t('links.name_placeholder')"
                        class="add-link-input"
                        autocomplete="off"
                      />
                    </label>

                    <label class="add-link-field">
                      <span>{{ $t("links.url_label") }}</span>
                      <input
                        v-model="newLinkUrl"
                        type="text"
                        inputmode="url"
                        :placeholder="$t('links.url_placeholder')"
                        class="add-link-input"
                        autocomplete="url"
                      />
                    </label>

                    <fieldset class="add-link-icon-field">
                      <legend>{{ $t("links.icon_label") }}</legend>
                      <div class="add-link-icon-grid">
                        <button
                          v-for="iconOption in customLinkIconOptions"
                          :key="iconOption.icon"
                          type="button"
                          class="add-link-icon-option"
                          :class="{
                            'add-link-icon-option--selected':
                              newLinkIcon === iconOption.icon,
                          }"
                          :aria-label="$t(iconOption.labelKey)"
                          :aria-pressed="newLinkIcon === iconOption.icon"
                          @click="newLinkIcon = iconOption.icon"
                        >
                          <SgIcon :icon="iconOption.icon" />
                        </button>
                      </div>
                    </fieldset>

                    <Button
                      :label="$t('common.add')"
                      icon="pi pi-plus"
                      type="submit"
                      :disabled="!newLinkLabel.trim() || !newLinkUrl.trim()"
                    />
                  </form>
                </SgDialog>
              </div>
            </div>

            <div
              v-if="controlBarPosition === 'bottom'"
              class="sidebar-bottom-toggle sidebar-bottom-toggle--left"
            >
              <Button
                v-sg-tooltip.right="'Toggle left sidebar'"
                icon="pi pi-bars"
                text
                aria-label="Toggle left sidebar"
                @click="toggleSidebar"
              />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent
            class="sidebar-network-context-menu"
            :side-offset="4"
            :data-context-kind="sidebarContextTarget.kind"
            :data-context-id="sidebarContextTarget.id"
            @close-auto-focus="beginPendingRename"
          >
            <template
              v-if="
                sidebarContextTarget.kind === 'group' &&
                sidebarContextTarget.id !== 'other'
              "
            >
              <ContextMenuItem
                class="sidebar-network-context-menu__item"
                @select="pendingRename = `group:${sidebarContextTarget.id}`"
              >
                <SgIcon
                  icon="pi pi-pencil"
                  aria-hidden="true"
                />
                {{ $t("sidebar.rename_group") }}
              </ContextMenuItem>
              <ContextMenuItem
                class="sidebar-network-context-menu__item"
                @select="deleteSidebarGroup"
              >
                <SgIcon
                  icon="pi pi-trash"
                  aria-hidden="true"
                />
                {{ $t("sidebar.delete_group") }}
              </ContextMenuItem>
            </template>
            <template
              v-if="
                sidebarContextTarget.kind !== 'panel' &&
                sidebarContextTarget.id !== 'other'
              "
            >
              <ContextMenuItem
                class="sidebar-network-context-menu__item"
                :disabled="!canMoveSidebarContext(-1)"
                @select="moveSidebarContext(-1)"
              >
                {{ $t("sidebar.organization.move_up") }}
              </ContextMenuItem>
              <ContextMenuItem
                class="sidebar-network-context-menu__item"
                :disabled="!canMoveSidebarContext(1)"
                @select="moveSidebarContext(1)"
              >
                {{ $t("sidebar.organization.move_down") }}
              </ContextMenuItem>
            </template>
            <ContextMenuItem
              v-if="canUngroupContext"
              class="sidebar-network-context-menu__item"
              @select="ungroupContext"
            >
              {{ $t("sidebarTabs.ungroup") }}
            </ContextMenuItem>
            <ContextMenuItem
              v-if="canDuplicateContext"
              class="sidebar-network-context-menu__item"
              @select="duplicateContextNetwork"
            >
              {{ $t("sidebar.duplicate") }}
            </ContextMenuItem>
            <ContextMenuItem
              v-if="
                sidebarContextTarget.id &&
                groupPreferences.copies[sidebarContextTarget.id]
              "
              class="sidebar-network-context-menu__item"
              @select="removeContextCopy"
            >
              {{ $t("sidebar.close_copy") }}
            </ContextMenuItem>
            <ContextMenuSub v-if="sidebarContextTarget.kind !== 'panel'">
              <ContextMenuSubTrigger class="sidebar-network-context-menu__item">
                {{ $t("sidebar.organization.move_to") }}
                <SgIcon icon="pi pi-chevron-right" />
              </ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent class="sidebar-network-context-menu">
                  <ContextMenuItem
                    v-for="group in allSidebarGroups"
                    :key="group.id"
                    class="sidebar-network-context-menu__item"
                    :disabled="
                      sidebarContextTarget.kind === 'group'
                        ? !canNestSidebarGroup(
                            groupPreferences,
                            sidebarContextTarget.id!,
                            group.id === 'other' ? '' : group.id,
                          )
                        : contextNetworkGroup === group.id
                    "
                    @select="moveContextDestination(group.id)"
                  >
                    {{
                      group.id === "other"
                        ? $t("sidebar.organization.root")
                        : groupPreferences.names[group.id] || $t(group.labelKey)
                    }}
                  </ContextMenuItem>
                  <ContextMenuSeparator
                    v-if="sidebarContextTarget.kind === 'network'"
                    class="theme-mode-separator"
                  />
                  <ContextMenuItem
                    class="sidebar-network-context-menu__item"
                    :disabled="!canCreateContextGroup"
                    v-if="sidebarContextTarget.kind === 'network'"
                    @select="createSidebarGroup(sidebarContextTarget.id, true)"
                  >
                    {{ $t("sidebar.organization.create") }}
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
            <ContextMenuItem
              v-if="sidebarContextTarget.kind === 'network'"
              class="sidebar-network-context-menu__item"
              @select="
                sidebarContextTarget.id?.startsWith('bento-scene:')
                  ? requestSceneAction(
                      'edit',
                      sidebarContextTarget.id.slice('bento-scene:'.length),
                    )
                  : (pendingRename = `network:${sidebarContextTarget.id}`)
              "
            >
              <SgIcon
                icon="pi pi-pencil"
                aria-hidden="true"
              />
              {{
                $t(
                  sidebarContextTarget.id?.startsWith("bento-scene:")
                    ? "sidebar.bento_display.rename"
                    : "sidebar.rename_network",
                )
              }}
            </ContextMenuItem>
            <ContextMenuItem
              v-if="sidebarContextTarget.id?.startsWith('bento-scene:')"
              class="sidebar-network-context-menu__item"
              @select="
                requestSceneAction(
                  'delete',
                  sidebarContextTarget.id.slice('bento-scene:'.length),
                )
              "
            >
              {{ $t("sidebar.bento_display.delete") }}
            </ContextMenuItem>
            <ContextMenuSeparator
              v-if="sidebarContextTarget.kind !== 'panel'"
              class="theme-mode-separator"
            />
            <ContextMenuItem
              class="sidebar-network-context-menu__item"
              @select="requestSceneAction('create')"
            >
              {{ $t("sidebar.bento_display.create") }}
            </ContextMenuItem>
            <ContextMenuItem
              class="sidebar-network-context-menu__item"
              :disabled="!canCreateContextGroup"
              @select="createSidebarGroup(undefined, true)"
            >
              {{ $t("sidebar.organization.create") }}
            </ContextMenuItem>
            <ContextMenuSeparator class="theme-mode-separator" />
            <ContextMenuItem
              class="sidebar-network-context-menu__item"
              @select="toggleNetworkEditMode"
            >
              <SgIcon
                :icon="networkEditMode ? 'pi pi-check' : 'pi pi-sliders-h'"
                aria-hidden="true"
              />
              {{
                $t(
                  networkEditMode
                    ? "sidebar.finish_editing_networks"
                    : "sidebar.edit_displayed_networks",
                )
              }}
            </ContextMenuItem>
            <ContextMenuItem
              class="sidebar-network-context-menu__item"
              @select="expandAllNetworkGroups"
            >
              <SgIcon
                icon="pi pi-chevron-down"
                aria-hidden="true"
              />
              {{ $t("sidebar.expand_all") }}
            </ContextMenuItem>
            <ContextMenuItem
              class="sidebar-network-context-menu__item"
              @select="collapseAllNetworkGroups"
            >
              <SgIcon
                icon="pi pi-chevron-up"
                aria-hidden="true"
              />
              {{ $t("sidebar.collapse_all") }}
            </ContextMenuItem>
            <ContextMenuSeparator class="theme-mode-separator" />
            <SidebarThemeMenu />
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenuRoot>
    </SplitterPanel>
    <SplitterResizeHandle
      v-show="modelValue"
      class="sidebar-resize-handle"
    />
    <SplitterPanel
      :default-size="100 - SIDEBAR_EXPANDED_SIZE"
      class="main-panel"
    >
      <slot></slot>
    </SplitterPanel>
  </SplitterGroup>
</template>

<script setup lang="ts">
import { navigateHierarchy } from "../utils/keyboardHierarchy"
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue"
import {
  SplitterGroup,
  SplitterPanel,
  SplitterResizeHandle,
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
} from "reka-ui"
import { useRouter, useRoute } from "vue-router"
import { useWebviewStore } from "@/stores/webviewState"
import { useProfilesStore } from "@/stores/profiles"
import SidebarThemeMenu from "./SidebarThemeMenu.vue"
import { useCustomLinksStore } from "@/stores/customLinks"
import { useSidebarPreferencesStore } from "@/stores/sidebarPreferences"
import { useDesktopWorkspacesStore } from "@/stores/desktopWorkspaces"
import { builtInSocialNetworks } from "@/config/socialNetworks"
import { networkGroupSelection } from "@/config/socialNetworkGroups"
import { useI18n } from "vue-i18n"
import { vSidebarPointerDrag } from "../directives/sidebarPointerDrag"
import {
  sidebarChildren,
  moveSidebarGroupAtItem,
  canNestSidebarGroup,
  nestSidebarGroup,
  sidebarGroupAncestors,
  duplicateSidebarNetwork,
  normalizeSidebarOrganization,
  organizeSidebarItems,
  sidebarItemGroup,
  moveSidebarItem,
  moveSidebarGroup,
  dissolveSidebarGroup,
  type SidebarOrganization,
} from "@/lib/sidebarOrganization"
import NetworkGroupHeader from "./NetworkGroupHeader.vue"
import type { MenuItem } from "../types"
import Button from "./ui/SgButton.vue"
import SgIcon from "./ui/SgIcon.vue"
import SgDialog from "./ui/SgDialog.vue"
import KanbanDropdown, { type KanbanDropdownTarget } from "./KanbanDropdown.vue"
import ProfileSwitcher from "./ProfileSwitcher.vue"
import SidebarDropdownPanel from "./SidebarDropdownPanel.vue"
import NetworkBrandIcon from "./NetworkBrandIcon.vue"
import SidebarNavButton from "./SidebarNavButton.vue"
import InlineSidebarLabel from "./InlineSidebarLabel.vue"
import { useSidebarSizing } from "../composables/useSidebarSizing"
import {
  clampSidebarSize,
  SIDEBAR_EXPANDED_SIZE,
  SIDEBAR_MAX_SIZE,
} from "./sidebarLayout"
import type { DesktopControlBarPosition } from "@/stores/desktopControlBar"

const router = useRouter()
const { t } = useI18n()
const route = useRoute()
const webviewStore = useWebviewStore()
const profilesStore = useProfilesStore()

const customLinksStore = useCustomLinksStore()
const desktopWorkspacesStore = useDesktopWorkspacesStore()
const sidebarPreferences = useSidebarPreferencesStore()

const bentoMenuPinned = ref(false)
const bentoMenuHovered = ref(false)
const bentoEntry = ref<HTMLElement | null>(null)
let bentoHoverTimer: ReturnType<typeof setTimeout> | undefined
function enterBentoMenu(event: PointerEvent) {
  if (event.pointerType !== "mouse" || networkEditMode.value) return
  clearTimeout(bentoHoverTimer)
  bentoMenuHovered.value = true
}
function leaveBentoMenu(event: PointerEvent) {
  if (event.pointerType !== "mouse") return
  clearTimeout(bentoHoverTimer)
  bentoHoverTimer = setTimeout(() => {
    if (!bentoEntry.value?.contains(document.activeElement))
      bentoMenuHovered.value = false
  }, 120)
}
function dismissBentoMenu(restoreFocus = false) {
  clearTimeout(bentoHoverTimer)
  bentoMenuPinned.value = false
  bentoMenuHovered.value = false
  sceneContextMenuId.value = null
  if (restoreFocus)
    bentoEntry.value
      ?.querySelector<HTMLButtonElement>(".sidebar-bento-entry__row button")
      ?.focus()
}
function leaveBentoFocus(event: FocusEvent) {
  if (!bentoEntry.value?.contains(event.relatedTarget as Node | null))
    dismissBentoMenu()
}
async function focusBentoItem(direction: number) {
  if (networkEditMode.value || !bentoScenes.value.length) return
  bentoMenuPinned.value = true
  await nextTick()
  const items = [
    ...bentoEntry.value!.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"], [role="menuitemradio"]',
    ),
  ]
  const index = items.indexOf(document.activeElement as HTMLButtonElement)
  items[
    index < 0
      ? direction > 0
        ? 0
        : items.length - 1
      : (index + direction + items.length) % items.length
  ]?.focus()
}
const sceneContextMenuId = ref<string | null>(null)
const bentoScenes = computed(() =>
  desktopWorkspacesStore.workspaceState.layouts.filter(
    (scene) => scene.profileId === profilesStore.activeProfileId,
  ),
)
const selectedBentoId = computed(() => {
  const id =
    desktopWorkspacesStore.workspaceState.selectedLayoutIds[
      profilesStore.activeProfileId
    ]
  return bentoScenes.value.some((scene) => scene.id === id) ? id : ""
})
const selectedBento = computed(() =>
  bentoScenes.value.find((scene) => scene.id === selectedBentoId.value),
)
const bentoMenuOpen = computed(
  () =>
    !networkEditMode.value &&
    bentoScenes.value.length > 0 &&
    (bentoMenuPinned.value || bentoMenuHovered.value),
)

function desktopSceneCatalog(profileId: string) {
  const catalog = new Map(
    builtInSocialNetworks.map((network) => [
      network.id,
      { canonicalUrl: network.url, allowSubdomains: true },
    ]),
  )
  for (const link of customLinksStore.getLinks(profileId)) {
    catalog.set(link.id, {
      canonicalUrl: link.url,
      allowSubdomains: false,
    })
  }
  return catalog
}

function toggleBentoMenu() {
  clearTimeout(bentoHoverTimer)
  if (bentoScenes.value.length > 0) {
    if (bentoMenuPinned.value) dismissBentoMenu()
    else bentoMenuPinned.value = true
  } else {
    bentoMenuPinned.value = false
  }
  sceneContextMenuId.value = null
  emit("toggle-bento")
}

function requestSceneAction(
  action: "create" | "load" | "edit" | "delete",
  sceneId?: string,
) {
  if (!props.bentoActive) emit("toggle-bento")
  bentoMenuPinned.value = true
  sceneContextMenuId.value = null
  desktopWorkspacesStore.requestSceneCommand(action, sceneId)
}

function openSceneContextMenu(sceneId: string) {
  bentoMenuPinned.value = true
  sceneContextMenuId.value = sceneId
}

function closeBentoMenus(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest(".sidebar-bento-entry"))
    return
  dismissBentoMenu()
}

const showAddLinkDialog = ref(false)
const newLinkLabel = ref("")
const newLinkUrl = ref("")
const newLinkIcon = ref("pi pi-link")

const customLinkIconOptions = [
  { icon: "pi pi-link", labelKey: "links.icons.link" },
  { icon: "pi pi-globe", labelKey: "links.icons.website" },
  { icon: "pi pi-briefcase", labelKey: "links.icons.business" },
  { icon: "pi pi-video", labelKey: "links.icons.video" },
  { icon: "pi pi-image", labelKey: "links.icons.image" },
  { icon: "pi pi-users", labelKey: "links.icons.community" },
  { icon: "pi pi-envelope", labelKey: "links.icons.email" },
  { icon: "pi pi-bookmark", labelKey: "links.icons.bookmark" },
] as const

function openAddLinkDialog() {
  newLinkLabel.value = ""
  newLinkUrl.value = ""
  newLinkIcon.value = "pi pi-link"
  setAddLinkTooltipOverlay(true)
  showAddLinkDialog.value = true
}

function setAddLinkTooltipOverlay(active: boolean) {
  window.dispatchEvent(
    new CustomEvent("communityglows-webview-overlay-state", {
      detail: { active },
    }),
  )
}

watch(showAddLinkDialog, (isOpen) => {
  if (!isOpen) {
    setAddLinkTooltipOverlay(false)
  }
})

const props = defineProps<{
  modelValue: boolean
  controlBarPosition: DesktopControlBarPosition
  bentoActive: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "network-selected": [network: MenuItem]
  "manage-profiles": []
  "open-settings": []
  "open-tasks": [target?: KanbanDropdownTarget]
  "toggle-bento": []
  "close-network-instance": [instanceId: string, networkId: string]
  "duplicate-network-instance": [
    networkId: string,
    instanceId: string,
    sourceInstanceId?: string,
  ]
}>()

const sidebarElement = ref<HTMLElement | null>(null)
const { compact: iconsOnly, style: sidebarStyle } =
  useSidebarSizing(sidebarElement)
const sidebarPanel = ref<{
  collapse: () => void
  getSize: () => number
  resize: (size: number) => void
} | null>(null)
const lastVisibleSidebarSize = ref(SIDEBAR_EXPANDED_SIZE)

onMounted(() => {
  const profileId = profilesStore.activeProfileId
  desktopWorkspacesStore.initialize(
    desktopSceneCatalog(profileId),
    profilesStore.activeProfile?.localOnly ? "" : profileId,
  )
  document.addEventListener("pointerdown", closeBentoMenus)
  window.addEventListener("blur", cancelSidebarDrag)
  window.addEventListener("keydown", cancelSidebarDragOnEscape)
  document.addEventListener("visibilitychange", cancelSidebarDrag)
  window.addEventListener("dragend", cancelSidebarDrag)
  if (!props.modelValue) sidebarPanel.value?.collapse()
})

// Keep the splitter and its default slot mounted while the panel is hidden.
// Replacing the whole splitter branch used to remount the central native
// WebView host, which closed/reopened WebView2 and produced a visible flash.
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      const currentSize = sidebarPanel.value?.getSize()
      if (typeof currentSize === "number" && currentSize > 0) {
        lastVisibleSidebarSize.value = currentSize
      }
      sidebarPanel.value?.collapse()
      return
    }
    await nextTick()
    sidebarPanel.value?.resize(clampSidebarSize(lastVisibleSidebarSize.value))
  },
)

const toggleSidebar = () => emit("update:modelValue", !props.modelValue)

const handleResize = (sizes: number[]) => {
  if (!props.modelValue) return
  const newSize = sizes[0]
  if (typeof newSize !== "number") return

  if (newSize > 0) lastVisibleSidebarSize.value = clampSidebarSize(newSize)
}

const builtinMenuItems = builtInSocialNetworks.map((network, index) => ({
  id: index + 1,
  label: network.label,
  icon: network.icon,
  route: network.route,
}))

const menuItems = ref<MenuItem[]>(builtinMenuItems)

const networkEditMode = ref(false)
const networkColors = Object.fromEntries(
  builtInSocialNetworks.map((network) => [
    network.id,
    network.tileColor ?? network.color,
  ]),
)

const sidebarContextTarget = ref<{
  kind: "panel" | "network" | "group"
  id?: string
}>({ kind: "panel" })

function identifySidebarContextTarget(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) return
  // Scenes keep their existing Modify/Delete menu.
  if (event.defaultPrevented) return
  const network = target.closest<HTMLElement>("[data-sidebar-network]")
  const group = target.closest<HTMLElement>(
    "[data-sidebar-group], [data-organization-group]",
  )
  sidebarContextTarget.value = network
    ? { kind: "network", id: network.dataset.sidebarNetwork }
    : group
      ? {
          kind: "group",
          id: group.dataset.sidebarGroup ?? group.dataset.organizationGroup,
        }
      : { kind: "panel" }
}
const BENTO_VISIBILITY_ID = "bento"

const bentoHidden = computed(() => {
  const profileId = profilesStore.activeProfileId
  return (
    !!profileId && profilesStore.isNetworkHidden(profileId, BENTO_VISIBILITY_ID)
  )
})

const isNetworkHiddenForProfile = (item: MenuItem) => {
  const profileId = profilesStore.activeProfileId
  return (
    !!profileId &&
    profilesStore.isNetworkHidden(
      profileId,
      groupPreferences.value.copies[item.route.slice(1)] ?? item.route.slice(1),
    )
  )
}

const toggleNetworkVisibility = (item: MenuItem) => {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  profilesStore.toggleNetworkHidden(profileId, canonicalSidebarId(item))
}

const collapsedNetworkGroups = ref(new Set<string>())
const groupPreferences = ref(normalizeSidebarOrganization(null))
const organizationError = ref("")
const organizationAnnouncement = ref("")
type SidebarDrag = { kind: "network" | "group"; id: string; profileId: string }
const sidebarDrag = ref<SidebarDrag | null>(null)
const rootDropActive = ref(false)
const sidebarDrop = ref<{
  kind: "network" | "group"
  id: string
  groupId: string
  position: "before" | "after" | "inside"
} | null>(null)
const renameTarget = ref("")
const pendingRename = ref("")
const sidebarContextOpen = ref(false)
let sidebarOrganizationOverlayActive = false
function setSidebarOrganizationOverlay(active: boolean) {
  if (sidebarOrganizationOverlayActive === active) return
  sidebarOrganizationOverlayActive = active
  window.dispatchEvent(
    new CustomEvent("communityglows-webview-overlay-state", {
      detail: { active },
    }),
  )
}
watch(
  () => sidebarContextOpen.value || !!sidebarDrag.value,
  setSidebarOrganizationOverlay,
)
function isContextHighlighted(kind: "group" | "network", id: string) {
  const key = `${kind}:${id}`
  return (
    renameTarget.value === key ||
    pendingRename.value === key ||
    (sidebarContextOpen.value &&
      sidebarContextTarget.value.kind === kind &&
      sidebarContextTarget.value.id === id)
  )
}
function beginPendingRename(event: Event) {
  if (!pendingRename.value) return
  event.preventDefault()
  const target = pendingRename.value
  requestAnimationFrame(() => {
    renameTarget.value = target
    pendingRename.value = ""
  })
}
const groupPreferencesKey = computed(
  () =>
    `communityglows.sidebar-groups.v1:${profilesStore.activeProfileId ?? "local"}`,
)
watch(
  groupPreferencesKey,
  (key) => {
    cancelSidebarDrag()
    pendingRename.value = ""
    renameTarget.value = ""
    collapsedNetworkGroups.value.clear()
    organizationError.value = ""
    groupPreferences.value = normalizeSidebarOrganization(null)
    try {
      groupPreferences.value = normalizeSidebarOrganization(
        JSON.parse(localStorage.getItem(key) ?? "null"),
      )
    } catch {
      /* Invalid preferences leave the default catalogue available. */
    }
  },
  { immediate: true },
)

function persistSidebarGroups(next: SidebarOrganization) {
  try {
    localStorage.setItem(groupPreferencesKey.value, JSON.stringify(next))
    groupPreferences.value = next
    organizationError.value = ""
    organizationAnnouncement.value = t("sidebar.organization.saved")
    return true
  } catch {
    organizationError.value = t("sidebar.organization.save_error")
    return false
  }
}

const sceneMenuItems = computed<MenuItem[]>(() =>
  bentoScenes.value.map((scene, index) => ({
    id: 2000 + index,
    label: scene.name,
    icon: "pi pi-th-large",
    route: `/bento-scene:${scene.id}`,
  })),
)
const isSceneItem = (item: MenuItem) => item.route.startsWith("/bento-scene:")
const copyMenuItems = computed<MenuItem[]>(() =>
  Object.entries(groupPreferences.value.copies).flatMap(
    ([id, source], index) => {
      const original = [...menuItems.value, ...customLinkItems.value].find(
        (item) => item.route.slice(1) === source,
      )
      return original
        ? [{ ...original, id: 3000 + index, route: `/${id}` }]
        : []
    },
  ),
)
const canonicalSidebarId = (item: MenuItem) =>
  groupPreferences.value.copies[item.route.slice(1)] ?? item.route.slice(1)
const allSidebarItems = computed(() => [
  ...menuItems.value,
  ...customLinkItems.value,
  ...sceneMenuItems.value,
  ...copyMenuItems.value,
])
const canDuplicateContext = computed(
  () =>
    sidebarContextTarget.value.kind === "network" &&
    allSidebarItems.value.some(
      (item) =>
        item.route.slice(1) === sidebarContextTarget.value.id &&
        !isSceneItem(item) &&
        item.route !== "/tasks",
    ),
)
function duplicateContextNetwork() {
  const source = sidebarContextTarget.value.id
  if (!source || !canDuplicateContext.value) return
  const instanceId = crypto.randomUUID()
  const next = duplicateSidebarNetwork(
    groupPreferences.value,
    source,
    instanceId,
    allSidebarIds.value,
  )
  const original = allSidebarItems.value.find(
    (item) => item.route.slice(1) === source,
  )!
  next.names[`network:copy:${instanceId}`] =
    `${networkLabel(original)} (${Object.values(next.copies).filter((id) => id === next.copies[`copy:${instanceId}`]).length + 1})`
  if (!persistSidebarGroups(next)) return
  emit(
    "duplicate-network-instance",
    canonicalSidebarId(original),
    instanceId,
    source.startsWith("copy:") ? source.slice(5) : undefined,
  )
  nextTick(() => {
    const copy = copyMenuItems.value.find(
      (item) => item.route === `/copy:${instanceId}`,
    )
    if (copy) navigateToNetwork(copy)
  })
}
function removeContextCopy() {
  const id = sidebarContextTarget.value.id
  if (!id || !groupPreferences.value.copies[id]) return
  const canonicalSource = groupPreferences.value.copies[id]
  const next = normalizeSidebarOrganization(groupPreferences.value)
  delete next.copies[id]
  delete next.membership[id]
  delete next.names[`network:${id}`]
  next.itemOrder = next.itemOrder.filter((item) => item !== id)
  if (!persistSidebarGroups(next)) return
  const instanceId = id.slice("copy:".length)
  emit(
    "close-network-instance",
    instanceId,
    groupPreferences.value.copies[id] ?? canonicalSource,
  )
  if (webviewStore.activeInstanceId === instanceId) webviewStore.clearNetwork()
}
const allSidebarIds = computed(() =>
  allSidebarItems.value.map((item) => item.route.slice(1)),
)
const allSidebarGroups = computed(() =>
  organizeSidebarItems(
    allSidebarItems.value,
    (item) => item.route.slice(1),
    groupPreferences.value,
  ),
)
const groupedMenuItems = computed(() => {
  const groups = allSidebarGroups.value.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      isSceneItem(item)
        ? sidebarPreferences.bentoDisplay === "tabs" && !bentoHidden.value
        : networkEditMode.value || !isNetworkHiddenForProfile(item),
    ),
  }))
  const visible = new Set(
    groups
      .filter(
        (group) =>
          group.items.length ||
          groupPreferences.value.customGroups.includes(group.id),
      )
      .flatMap((group) => [
        group.id,
        ...sidebarGroupAncestors(groupPreferences.value, group.id),
      ]),
  )
  return groups
    .filter((group) => visible.has(group.id) || group.id === "other")
    .map((group) => ({
      ...group,
      descendantItems: groups
        .filter(
          (child) =>
            child.id === group.id ||
            sidebarGroupAncestors(groupPreferences.value, child.id).includes(
              group.id,
            ),
        )
        .flatMap((child) => child.items),
    }))
})
watch(
  () => sidebarPreferences.bentoDisplay,
  () => {
    cancelSidebarDrag()
    bentoMenuPinned.value = false
    pendingRename.value = ""
    renameTarget.value = ""
  },
)
const sidebarDisplaySections = computed(() => {
  const byId = new Map(groupedMenuItems.value.map((group) => [group.id, group]))
  type Section = (typeof groupedMenuItems.value)[number] & {
    header: boolean
    renderKey: string
  }
  const sections: Section[] = []
  const visit = (parent: string) => {
    for (const node of sidebarChildren(
      groupPreferences.value,
      parent,
      allSidebarIds.value,
    )) {
      if (node.startsWith("g:")) {
        const group = byId.get(node.slice(2))
        if (!group) continue
        sections.push({ ...group, items: [], header: true, renderKey: node })
        visit(group.id)
      } else {
        const group = byId.get(parent || "other")
        const item = group?.items.find(
          (item) => item.route.slice(1) === node.slice(2),
        )
        if (group && item)
          sections.push({
            ...group,
            items: [item],
            header: false,
            renderKey: node,
          })
      }
    }
  }
  visit("")
  return sections
})
const networkSearch = ref("")
watch(networkEditMode, (editing) => {
  if (!editing) networkSearch.value = ""
})
const normalizeNetworkSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
const networkSearchNormalized = computed(() =>
  networkEditMode.value ? normalizeNetworkSearch(networkSearch.value) : "",
)
const filteredSidebarDisplaySections = computed(() => {
  const query = networkSearchNormalized.value
  if (!query) return sidebarDisplaySections.value
  const matchingGroups = new Set<string>()
  const matchingItems = new Set<string>()
  for (const section of sidebarDisplaySections.value) {
    if (section.header || !section.items.length) continue
    if (!normalizeNetworkSearch(networkLabel(section.items[0])).includes(query))
      continue
    matchingItems.add(section.renderKey)
    matchingGroups.add(section.id)
    for (const ancestor of sidebarGroupAncestors(
      groupPreferences.value,
      section.id,
    ))
      matchingGroups.add(ancestor)
  }
  return sidebarDisplaySections.value.filter((section) =>
    section.header
      ? matchingGroups.has(section.id)
      : matchingItems.has(section.renderKey),
  )
})
const sidebarGroupTones = computed(
  () =>
    new Map(
      filteredSidebarDisplaySections.value
        .filter(
          (section) =>
            section.header &&
            !sidebarGroupAncestors(groupPreferences.value, section.id).some(
              (id) => collapsedNetworkGroups.value.has(id),
            ),
        )
        .map((section, index) => [
          section.id,
          index % 2 ? "alternate" : "base",
        ]),
    ),
)
const hoveredSidebarGroup = ref("")
const sidebarGroupSurfaces = computed(() => {
  const visible = filteredSidebarDisplaySections.value.filter(
    (section) =>
      !!networkSearchNormalized.value ||
      (!sidebarGroupAncestors(groupPreferences.value, section.id).some((id) =>
        collapsedNetworkGroups.value.has(id),
      ) &&
        (section.header || !collapsedNetworkGroups.value.has(section.id))),
  )
  const fill = (id: string) =>
    `var(--sg-sidebar-group-depth-${sidebarGroupAncestors(groupPreferences.value, id).length + 1}${sidebarGroupTones.value.get(id) === "alternate" ? "-alternate" : ""})`
  const rootId = (id: string) =>
    sidebarGroupAncestors(groupPreferences.value, id).at(-1) ?? id
  return new Map(
    visible
      .filter((section) => section.id !== "other")
      .map((section) => {
        const ancestors = sidebarGroupAncestors(
          groupPreferences.value,
          section.id,
        )
        const next = visible[visible.indexOf(section) + 1]
        const lineage = [...ancestors].reverse().concat(section.id)
        return [
          section.renderKey,
          {
            // Paint every ancestor continuously, then its inset child on top.
            // Only the group's own header and final descendant close its contour.
            layers: lineage.map((id, depth) => ({
              id,
              style: {
                "--sidebar-surface-fill": fill(id),
                insetInlineStart:
                  iconsOnly.value || depth === 0
                    ? "0"
                    : depth === 1
                      ? "var(--sg-space-3)"
                      : "calc(var(--sg-space-3) + var(--sg-space-3))",
              },
              start: section.header && section.id === id,
              end:
                !next ||
                (next.id !== id &&
                  !sidebarGroupAncestors(
                    groupPreferences.value,
                    next.id,
                  ).includes(id)),
            })),
            style: {
              "--sidebar-group-fill": fill(section.id),
              "--sidebar-parent-fill": fill(ancestors[0] ?? section.id),
              "--sidebar-root-fill": fill(rootId(section.id)),
            },
            start: section.header && !ancestors.length,
            end:
              !next ||
              next.id === "other" ||
              rootId(next.id) !== rootId(section.id),
          },
        ]
      }),
  )
})
const groupAfterDropKey = computed(() => {
  const drop = sidebarDrop.value
  if (drop?.kind !== "group" || drop.position !== "after") return ""
  const sections = sidebarDisplaySections.value.filter(
    (section) =>
      (section.id === drop.id ||
        sidebarGroupAncestors(groupPreferences.value, section.id).includes(
          drop.id,
        )) &&
      !sidebarGroupAncestors(groupPreferences.value, section.id).some((id) =>
        collapsedNetworkGroups.value.has(id),
      ) &&
      (section.header || !collapsedNetworkGroups.value.has(section.id)),
  )
  return sections[sections.length - 1]?.renderKey ?? ""
})
const contextNetworkGroup = computed(() =>
  sidebarItemGroup(groupPreferences.value, sidebarContextTarget.value.id ?? ""),
)

const contextCreationParent = computed(() => {
  const { kind, id } = sidebarContextTarget.value
  const parent =
    kind === "group"
      ? id
      : kind === "network"
        ? contextNetworkGroup.value
        : undefined
  return parent && parent !== "other" ? parent : ""
})
const canCreateContextGroup = computed(
  () =>
    !contextCreationParent.value ||
    sidebarGroupAncestors(groupPreferences.value, contextCreationParent.value)
      .length < 2,
)
function createSidebarGroup(networkId?: string, fromMenu = false) {
  if (!canCreateContextGroup.value) return
  const id = `personal:${crypto.randomUUID()}`
  let next = normalizeSidebarOrganization(groupPreferences.value)
  next.customGroups.push(id)
  next.groupOrder = [id, ...next.groupOrder]
  next.names[id] = t("sidebar.organization.new_group")
  const parent = contextCreationParent.value
  if (parent) next = nestSidebarGroup(next, id, parent)
  if (networkId)
    next = moveSidebarItem(next, networkId, id, allSidebarIds.value)
  if (!persistSidebarGroups(next)) return
  if (parent) collapsedNetworkGroups.value.delete(parent)
  if (fromMenu) pendingRename.value = `group:${id}`
  else
    nextTick(() => {
      renameTarget.value = `group:${id}`
    })
}

function moveContextNetwork(groupId: string) {
  const id = sidebarContextTarget.value.id
  if (id)
    persistSidebarGroups(
      moveSidebarItem(groupPreferences.value, id, groupId, allSidebarIds.value),
    )
}
function moveContextDestination(groupId: string) {
  if (sidebarContextTarget.value.kind === "network") {
    moveContextNetwork(groupId)
    return
  }
  const id = sidebarContextTarget.value.id
  if (id)
    persistSidebarGroups(
      nestSidebarGroup(
        groupPreferences.value,
        id,
        groupId === "other" ? "" : groupId,
      ),
    )
}
const canUngroupContext = computed(() =>
  sidebarContextTarget.value.kind === "group"
    ? !!groupPreferences.value.parents[sidebarContextTarget.value.id ?? ""]
    : sidebarContextTarget.value.kind === "network" &&
      contextNetworkGroup.value !== "other",
)
function ungroupContext() {
  const id = sidebarContextTarget.value.id
  if (!id) return
  const parent =
    sidebarContextTarget.value.kind === "group"
      ? groupPreferences.value.parents[id]
      : contextNetworkGroup.value
  moveContextDestination(
    (parent ? groupPreferences.value.parents[parent] : undefined) ?? "other",
  )
}

function sidebarMoveNeighbor(
  kind: "network" | "group",
  id: string,
  direction: number,
) {
  const items =
    kind === "group"
      ? groupedMenuItems.value
          .filter(
            (group) =>
              group.id !== "other" &&
              groupPreferences.value.parents[group.id] ===
                groupPreferences.value.parents[id],
          )
          .map((group) => group.id)
      : (groupedMenuItems.value
          .find((group) =>
            group.items.some((item) => item.route.slice(1) === id),
          )
          ?.items.map((item) => item.route.slice(1)) ?? [])
  const index = items.indexOf(id)
  return index >= 0 ? items[index + direction] : undefined
}
function canMoveSidebarContext(direction: number) {
  const { kind, id } = sidebarContextTarget.value
  return kind !== "panel" && !!id && !!sidebarMoveNeighbor(kind, id, direction)
}
function moveSidebarContext(direction: number) {
  const { kind, id } = sidebarContextTarget.value
  if (kind !== "panel" && id) moveSidebarByKey(kind, id, direction)
}
function moveSidebarByKey(
  kind: "network" | "group",
  id: string,
  direction: number,
) {
  if (renameTarget.value) return
  const anchor = sidebarMoveNeighbor(kind, id, direction)
  if (!anchor) return
  const next =
    kind === "group"
      ? moveSidebarGroup(groupPreferences.value, id, anchor, direction > 0)
      : moveSidebarItem(
          groupPreferences.value,
          id,
          sidebarItemGroup(groupPreferences.value, id),
          allSidebarIds.value,
          anchor,
          direction > 0,
        )
  persistSidebarGroups(next)
}
function cancelSidebarDrag() {
  sidebarDrag.value = null
  sidebarDrop.value = null
  rootDropActive.value = false
}
function dropAtRoot() {
  const drag = sidebarDrag.value
  cancelSidebarDrag()
  if (!drag || drag.profileId !== groupPreferencesKey.value) return
  persistSidebarGroups(
    drag.kind === "group"
      ? nestSidebarGroup(groupPreferences.value, drag.id)
      : moveSidebarItem(
          groupPreferences.value,
          drag.id,
          "other",
          allSidebarIds.value,
        ),
  )
}
function cancelSidebarDragOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") cancelSidebarDrag()
}
function startSidebarDrag(
  event: DragEvent,
  kind: "network" | "group",
  id: string,
) {
  if (
    renameTarget.value ||
    (kind === "group" && id === "other") ||
    !event.dataTransfer
  ) {
    event.preventDefault()
    return
  }
  sidebarDrag.value = { kind, id, profileId: groupPreferencesKey.value }
  event.dataTransfer.effectAllowed = "move"
  event.dataTransfer.setData("application/x-communityglows-sidebar", id)
}
function overSidebarGroup(event: DragEvent, id: string) {
  if (
    !sidebarDrag.value ||
    (sidebarDrag.value.kind === "group" &&
      (id === "other" || id === sidebarDrag.value.id))
  ) {
    sidebarDrop.value = null
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / rect.height
  const position =
    sidebarDrag.value.kind === "network"
      ? "inside"
      : ratio < 0.25
        ? "before"
        : ratio > 0.75
          ? "after"
          : "inside"
  if (
    sidebarDrag.value.kind === "group" &&
    !canNestSidebarGroup(
      groupPreferences.value,
      sidebarDrag.value.id,
      position === "inside" ? id : (groupPreferences.value.parents[id] ?? ""),
    )
  ) {
    sidebarDrop.value = null
    if (event.dataTransfer) event.dataTransfer.dropEffect = "none"
    return
  }
  event.preventDefault()
  event.stopPropagation()
  sidebarDrop.value = { kind: "group", id, groupId: id, position }
}
function overSidebarNetwork(event: DragEvent, id: string, groupId: string) {
  const drag = sidebarDrag.value
  if (
    !drag ||
    (drag.kind === "network" && id === drag.id) ||
    (drag.kind === "group" &&
      !canNestSidebarGroup(
        groupPreferences.value,
        drag.id,
        groupId === "other" ? "" : groupId,
      ))
  ) {
    sidebarDrop.value = null
    return
  }
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  sidebarDrop.value = {
    kind: "network",
    id,
    groupId,
    position: event.clientY < rect.top + rect.height / 2 ? "before" : "after",
  }
}
function dropPositionFor(kind: "network" | "group", id: string) {
  if (kind === "group" && sidebarDrop.value?.position === "after")
    return undefined
  return sidebarDrop.value?.kind === kind && sidebarDrop.value.id === id
    ? sidebarDrop.value.position
    : undefined
}
function leaveSidebarDrop(event: DragEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !(event.currentTarget as HTMLElement).contains(event.relatedTarget)
  )
    sidebarDrop.value = null
}
function dropSidebarDrag(event: DragEvent) {
  const drag = sidebarDrag.value
  const drop = sidebarDrop.value
  cancelSidebarDrag()
  if (!drag || !drop || drag.profileId !== groupPreferencesKey.value) return
  const target = event.currentTarget as HTMLElement
  if (
    drop.kind === "network"
      ? target.dataset.sidebarNetwork !== drop.id
      : target.dataset.sidebarGroup !== drop.id
  )
    return
  event.preventDefault()
  const next =
    drag.kind === "group"
      ? drop.kind === "network"
        ? moveSidebarGroupAtItem(
            groupPreferences.value,
            drag.id,
            drop.id,
            allSidebarIds.value,
            drop.position === "after",
          )
        : drop.position === "inside"
          ? nestSidebarGroup(groupPreferences.value, drag.id, drop.id)
          : moveSidebarGroup(
              groupPreferences.value,
              drag.id,
              drop.id,
              drop.position === "after",
            )
      : moveSidebarItem(
          groupPreferences.value,
          drag.id,
          drop.groupId,
          allSidebarIds.value,
          drop.kind === "network" ? drop.id : undefined,
          drop.position === "after",
        )
  if (persistSidebarGroups(next) && drop.position === "inside")
    collapsedNetworkGroups.value.delete(drop.groupId)
}

function networkLabel(item: MenuItem) {
  return (
    groupPreferences.value.names[`network:${item.route.slice(1)}`] || item.label
  )
}

function saveInlineName(value: string) {
  const name = value.trim().slice(0, 64)
  if (!name || !renameTarget.value) return
  const key = renameTarget.value.startsWith("group:")
    ? renameTarget.value.slice(6)
    : renameTarget.value
  const next = normalizeSidebarOrganization(groupPreferences.value)
  next.names[key] = name
  if (persistSidebarGroups(next)) renameTarget.value = ""
}

function deleteSidebarGroup() {
  const id = sidebarContextTarget.value.id
  if (sidebarContextTarget.value.kind !== "group" || !id || id === "other")
    return
  if (
    persistSidebarGroups(
      dissolveSidebarGroup(groupPreferences.value, id, allSidebarIds.value),
    )
  )
    collapsedNetworkGroups.value.delete(id)
}
function groupSelection(items: MenuItem[]) {
  items = items.filter((item) => !isSceneItem(item))
  return networkGroupSelection(
    items.map((item) => item.route.slice(1)),
    items
      .filter((item) => !isNetworkHiddenForProfile(item))
      .map((item) => item.route.slice(1)),
  )
}
function toggleNetworkGroup(items: MenuItem[]) {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  profilesStore.setNetworksHidden(
    profileId,
    [
      ...new Set(
        items.filter((item) => !isSceneItem(item)).map(canonicalSidebarId),
      ),
    ],
    groupSelection(items) === "all",
  )
}
function toggleNetworkGroupExpanded(id: string) {
  if (collapsedNetworkGroups.value.has(id))
    collapsedNetworkGroups.value.delete(id)
  else collapsedNetworkGroups.value.add(id)
}

function expandAllNetworkGroups() {
  collapsedNetworkGroups.value.clear()
}

function collapseAllNetworkGroups() {
  for (const group of groupedMenuItems.value) {
    if (group.id !== "other") collapsedNetworkGroups.value.add(group.id)
  }
}

const toggleBentoVisibility = () => {
  const profileId = profilesStore.activeProfileId
  if (!profileId) return
  bentoMenuPinned.value = false
  sceneContextMenuId.value = null
  profilesStore.toggleNetworkHidden(profileId, BENTO_VISIBILITY_ID)
}

const toggleNetworkEditMode = () => {
  networkEditMode.value = !networkEditMode.value
}

const customLinkItems = computed<MenuItem[]>(() => {
  const profileId = profilesStore.activeProfileId ?? ""
  return customLinksStore.getLinks(profileId).map((link, i) => ({
    id: 1000 + i,
    label: link.label,
    icon: link.icon,
    route: `/${link.id}`,
  }))
})

const kanbanActive = computed(
  () =>
    (route.path === "/tasks" || route.path === "/local-kanban") &&
    !props.bentoActive &&
    !webviewStore.activeUrl,
)

const isNetworkActive = (item: MenuItem): boolean =>
  isSceneItem(item)
    ? props.bentoActive &&
      desktopWorkspacesStore.workspaceState.selectedLayoutIds[
        profilesStore.activeProfileId
      ] === item.route.slice("/bento-scene:".length)
    : webviewStore.activeNetworkId === canonicalSidebarId(item) &&
      (webviewStore.activeInstanceId ?? "") ===
        (item.route.startsWith("/copy:")
          ? item.route.slice("/copy:".length)
          : "")

const navigateToNetwork = (network: MenuItem): void => {
  if (isSceneItem(network)) {
    requestSceneAction("load", network.route.slice("/bento-scene:".length))
    return
  }
  const networkId = canonicalSidebarId(network)
  const instanceId = network.route.startsWith("/copy:")
    ? network.route.slice("/copy:".length)
    : undefined

  if (networkId.startsWith("custom-")) {
    const profileId = profilesStore.activeProfileId ?? ""
    const link = customLinksStore
      .getLinks(profileId)
      .find((l) => l.id === networkId)
    if (link) {
      profilesStore.ensureDefault()
      webviewStore.selectCustom(link.id, link.url, instanceId)
    }
  } else if (webviewStore.usesWebview(networkId)) {
    profilesStore.ensureDefault()
    webviewStore.selectNetwork(networkId, undefined, instanceId)
  } else {
    webviewStore.clearNetwork()
    router.push(network.route)
  }

  emit("network-selected", network)
}

const addCustomLink = () => {
  if (!newLinkLabel.value.trim() || !newLinkUrl.value.trim()) return
  const profileId = profilesStore.activeProfileId ?? ""
  customLinksStore.addLink(
    profileId,
    newLinkLabel.value,
    newLinkUrl.value,
    newLinkIcon.value,
  )
  newLinkLabel.value = ""
  newLinkUrl.value = ""
  showAddLinkDialog.value = false
}

const removeCustomLink = (linkId: string) => {
  const profileId = profilesStore.activeProfileId ?? ""
  customLinksStore.removeLink(profileId, linkId)
}

onUnmounted(() => {
  clearTimeout(bentoHoverTimer)
  document.removeEventListener("pointerdown", closeBentoMenus)
  window.removeEventListener("blur", cancelSidebarDrag)
  window.removeEventListener("keydown", cancelSidebarDragOnEscape)
  document.removeEventListener("visibilitychange", cancelSidebarDrag)
  window.removeEventListener("dragend", cancelSidebarDrag)
  cancelSidebarDrag()
  setSidebarOrganizationOverlay(false)
  setAddLinkTooltipOverlay(false)
})
</script>

<style scoped>
[data-group-tone] {
  position: relative;
  isolation: isolate;
}
[data-group-start] {
  margin-top: var(--sg-space-2);
}
.sidebar-group-surface {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  z-index: var(--sg-layer-decoration);
  pointer-events: none;
  background: var(--sidebar-surface-fill);
}
.sidebar-group-surface[data-surface-highlight] {
  background: var(--sg-color-surface-hover);
}
.sidebar-group-surface,
.network-row {
  transition: var(--sg-motion-colors);
}
@media (prefers-reduced-motion: reduce) {
  .sidebar-group-surface,
  .network-row {
    transition: none;
  }
}
.sidebar-group-surface[data-surface-start] {
  border-start-start-radius: var(--sg-radius-sm);
  border-start-end-radius: var(--sg-radius-sm);
}
.sidebar-group-surface[data-surface-end] {
  border-end-start-radius: var(--sg-radius-sm);
  border-end-end-radius: var(--sg-radius-sm);
}
.sidebar-group-depth-2 {
  padding-inline-start: var(--sg-space-3);
}
.sidebar-group-depth-3 {
  padding-inline-start: calc(var(--sg-space-3) + var(--sg-space-3));
}
[data-group-tone] :deep(.network-group-header) {
  margin-block: 0;
  padding-block: var(--sg-space-2);
}
.sidebar-root-drop {
  padding: var(--sg-space-3);
  color: var(--sg-color-text-muted);
  border: var(--sg-border-1px) dashed var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
}
.sidebar-root-drop[data-drop-position="inside"] {
  background: var(--sg-color-surface-hover);
}
.sidebar-organization-error {
  color: var(--sg-color-danger);
  padding: var(--sg-space-2);
}
.sidebar-organization-announcement {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
[draggable="true"] {
  cursor: grab;
}
[data-drop-position],
[data-group-insertion-after] {
  position: relative;
}
[data-group-insertion-after]::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--sg-layer-dropdown);
  border-top: var(--sg-border-2px) solid var(--sg-color-action);
  pointer-events: none;
}
[data-drop-position="before"]::before,
[data-drop-position="after"]::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  z-index: var(--sg-layer-dropdown);
  border-top: var(--sg-border-2px) solid var(--sg-color-action);
  pointer-events: none;
}
[data-drop-position="before"]::before {
  top: 0;
}
[data-drop-position="after"]::after {
  bottom: 0;
}
.network-row[data-drop-position="before"]::before,
.network-row[data-drop-position="after"]::after,
[data-group-insertion-after]:has(.network-row)::after {
  inset-inline: var(--sg-sidebar-network-row-padding-inline);
}
.icons-only .network-row[data-drop-position="before"]::before,
.icons-only .network-row[data-drop-position="after"]::after,
.icons-only [data-group-insertion-after]:has(.network-row)::after {
  inset-inline: 0;
}
[data-drop-position="inside"] {
  outline: var(--sg-focus-ring);
  outline-offset: calc(-1 * var(--sg-focus-offset));
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-hover);
}

.sidebar-network-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: var(--sg-space-1);
  border-radius: var(--sg-radius-sm);
}

.sidebar-network-tile--colored {
  color: var(--sg-color-text-on-action);
}

:deep([data-context-highlight] .sidebar-nav-button .sg-button),
:deep([data-context-highlight] .network-group-header__main),
:deep(.sidebar-nav-button:has(.inline-sidebar-label--editing) .sg-button),
:deep(.network-group-header__main:has(.inline-sidebar-label--editing)) {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}
.sidebar {
  background-color: var(--sg-color-surface-raised);
  height: var(--sg-sidebar-viewport-height);
  margin-top: 0;
}

.main-panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.sidebar-content {
  height: var(--sg-sidebar-fill-size);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Keep keyboard focus inside controls at the clipped panel edges. */
.sidebar .sidebar-content :deep(button:focus-visible) {
  outline-offset: calc(-1 * var(--sg-focus-offset));
}

.sidebar.icons-only .sidebar-content {
  overflow: visible;
}

.profile-switcher-top {
  padding: 0;
  margin: 0;
  border: 0;
  width: var(--sg-sidebar-fill-size);
  flex: 0 0 auto;
  position: relative;
  z-index: var(--sg-layer-1000);
}

.sidebar-bottom-toggle {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: var(--sg-sidebar-header-height);
  padding: var(--sg-sidebar-control-padding);
}

.sidebar-bottom-toggle--left {
  justify-content: flex-start;
}

.sidebar-main {
  flex: 1;
  min-height: 0;
  width: var(--sg-sidebar-fill-size);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-scrollable-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: var(--sg-scrollbar-thumb) transparent;
}

.sidebar-network-search {
  position: sticky;
  top: 0;
  z-index: var(--sg-layer-dropdown);
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  margin: 0 var(--sg-sidebar-network-row-padding-inline) var(--sg-space-2);
  padding: var(--sg-space-2) var(--sg-space-3);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text-muted);
}

.sidebar-network-search:focus-within {
  border-color: var(--sg-color-action);
  outline: var(--sg-focus-ring);
  outline-offset: calc(-1 * var(--sg-focus-offset));
}

.sidebar-network-search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--sg-color-text);
  font: inherit;
}

.sidebar-network-search input::placeholder {
  color: var(--sg-color-text-muted);
}

.sidebar-network-search input::-webkit-search-cancel-button {
  display: none;
}

.sidebar-network-search__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: var(--sg-space-1);
  border: 0;
  border-radius: var(--sg-radius-sm);
  background: transparent;
  color: var(--sg-color-text-muted);
  cursor: pointer;
}

.sidebar-network-search__clear:hover,
.sidebar-network-search__clear:focus-visible {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.sidebar-network-search__empty {
  margin: var(--sg-space-4) var(--sg-sidebar-network-row-padding-inline);
  color: var(--sg-color-text-muted);
  text-align: center;
}

.profile-switcher-top :deep(.profile-trigger) {
  box-sizing: border-box;
  min-height: var(--sg-sidebar-network-row-height);
  padding: var(--sg-space-1) var(--sg-sidebar-network-row-padding-inline);
  gap: var(--sg-sidebar-control-gap);
}

.profile-switcher-top :deep(.profile-emoji) {
  display: inline-flex;
  justify-content: center;
  width: calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
  flex-shrink: 0;
}

.sidebar-main :deep(.sidebar-nav-button .sg-button),
.sidebar-main :deep(.network-group-header__main),
.profile-switcher-top :deep(.profile-name) {
  font-family: var(--sg-font-family);
  font-size: var(--sg-sidebar-section-title-size);
  font-weight: normal;
}

.sidebar-header :deep(.sg-icon),
.sidebar-bento-entry :deep(.sg-icon),
.network-menu-section
  :deep(.network-group-header__main > .sg-icon:first-child) {
  height: var(--sg-sidebar-effective-icon-size);
}

.sidebar-bento-entry {
  position: relative;
  flex: 0 0 auto;
  width: var(--sg-sidebar-fill-size);
  border-bottom: var(--sg-border-1px) solid var(--sg-color-border);
  padding-bottom: 0;
  margin-bottom: var(--sg-space-2);
}

.sidebar-bento-entry__row {
  position: relative;
}

.sidebar-bento-entry {
  z-index: var(--sg-layer-dropdown);
}
.sidebar-bento-entry--open {
  z-index: calc(var(--sg-layer-dropdown) + 1);
}
.sidebar-bento-entry :deep(.sidebar-nav-button .sg-button) {
  color: var(--sg-color-text);
}
.sidebar-bento-entry--open :deep(.sidebar-nav-button .sg-button) {
  background: var(--sg-color-surface-hover);
}
.sidebar-bento-scene {
  position: relative;
}

.sidebar-bento-scene__button,
.sidebar-bento-context-menu button {
  display: flex;
  width: var(--sg-sidebar-fill-size);
  align-items: center;
  gap: var(--sg-space-2);
  border: 0;
  background: transparent;
  color: var(--sg-color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sidebar-bento-scene__button {
  padding: var(--sg-space-0d6rem-0d75rem);
}

.sidebar-bento-scene__button:hover,
.sidebar-bento-scene__button:focus-visible,
.sidebar-bento-context-menu button:hover,
.sidebar-bento-context-menu button:focus-visible {
  outline: none;
  background: var(--sg-color-surface-hover);
}

.sidebar-bento-scene__appearance {
  font-size: var(--sg-font-size-1d1rem);
  line-height: var(--sg-line-height-1);
  flex: 0 0 auto;
}

.sidebar-kanban-entry {
  flex: 0 0 auto;
  width: var(--sg-sidebar-fill-size);
  margin-bottom: var(--sg-space-2);
}
.sidebar-bento-scene__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar-bento-scene__button {
  transition: var(--sg-motion-colors);
}
.sidebar-bento-scene__button--selected {
  background: var(--sg-sidebar-option-selected);
}
.sidebar-bento-scene__button--selected .sidebar-bento-scene__name {
  font-weight: var(--sg-font-weight-bold);
  color: var(--sg-color-action);
}
.sidebar-bento-menu__footer {
  border-top: var(--sg-border-1px) solid var(--sg-color-border);
  padding: var(--sg-space-0d4rem-0d5rem);
}
.sidebar-bento-menu__footer button {
  display: flex;
  align-items: center;
  gap: var(--sg-space-2);
  width: var(--sg-sidebar-fill-size);
  border: 0;
  border-radius: var(--sg-radius-sm);
  background: transparent;
  color: var(--sg-color-text-muted);
  font: inherit;
  padding: var(--sg-space-0d5rem-0d75rem);
  text-align: start;
  cursor: pointer;
  transition: var(--sg-motion-colors);
}
.sidebar-bento-menu__footer button:hover,
.sidebar-bento-menu__footer button:focus-visible {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}
@media (prefers-reduced-motion: reduce) {
  .sidebar-bento-scene__button,
  .sidebar-bento-menu__footer button {
    transition: none;
  }
}

.sidebar-bento-scene__appearance--success {
  background: var(--sg-color-success);
}
.sidebar-bento-scene__appearance--warning {
  background: var(--sg-color-warning);
}
.sidebar-bento-scene__appearance--danger {
  background: var(--sg-color-danger);
}
.sidebar-bento-scene__appearance--info {
  background: var(--sg-color-info);
}
.sidebar-bento-scene__appearance--neutral {
  background: var(--sg-color-surface-muted);
}

.sidebar-bento-context-menu {
  position: relative;
  z-index: calc(var(--sg-layer-dropdown) + 1);
  width: var(--sg-sidebar-fill-size);
  overflow: hidden;
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  box-shadow: var(--sg-shadow-control);
}

.sidebar-bento-context-menu button {
  padding: var(--sg-space-0d6rem-0d75rem);
}

.sidebar-scrollable-content::-webkit-scrollbar {
  width: calc(var(--sg-scrollbar-width) + 2 * var(--sg-space-1));
  -webkit-appearance: none;
}

/* Chromium's standard thin scrollbar overrides the custom track and thumb. */
@supports selector(::-webkit-scrollbar) {
  .sidebar-scrollable-content {
    scrollbar-width: auto;
    scrollbar-color: auto;
  }
}

.sidebar-scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scrollable-content::-webkit-scrollbar-thumb {
  background: var(--sg-scrollbar-thumb);
  background-clip: padding-box;
  border: var(--sg-space-1) solid transparent;
  /* Include the adjacent resize handle when centering in the visible gap. */
  border-left-width: calc(
    var(--sg-space-1) + var(--sg-sidebar-resize-handle-width) / 2
  );
  border-right-width: calc(
    var(--sg-space-1) - var(--sg-sidebar-resize-handle-width) / 2
  );
  border-radius: var(--sg-scrollbar-radius);
}

.sidebar-scrollable-content::-webkit-scrollbar-thumb:hover {
  background-color: var(--sg-scrollbar-thumb-hover);
}

.sidebar-scrollable-content::-webkit-scrollbar-button {
  display: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--sg-sidebar-control-gap);
  min-height: var(--sg-sidebar-header-height);
  padding: var(--sg-sidebar-control-padding);
}

.sidebar-header--centered {
  justify-content: center;
}

.sidebar-header--spaced {
  justify-content: flex-start;
  padding-inline: var(--sg-sidebar-network-row-padding-inline);
}

.sidebar-header--spaced :deep(.sg-button) {
  padding-inline: 0;
  min-width: 0;
  width: calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
  flex-shrink: 0;
}

.network-menu-section :deep(.network-group-header__main) {
  padding-inline: var(--sg-sidebar-network-row-padding-inline);
}

.network-menu-section :deep(.network-group-header__main),
.network-menu-section :deep(.network-group-header__fold) {
  background: transparent;
}

.network-menu-section
  :deep(.network-group-header__main > .sg-icon:first-child) {
  flex: 0 0 calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
  width: calc(var(--sg-sidebar-effective-icon-size) + 2 * var(--sg-space-1));
}

.app-title {
  margin: 0;
  color: var(--sg-color-text);
  font-size: var(--sg-sidebar-app-title-size);
  white-space: nowrap;
}

.content-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.content-centered .menu-items {
  width: var(--sg-sidebar-fill-size);
}

.flex.align-items-center.mb-3 {
  padding: var(--sg-sidebar-control-padding);
}

.menu-items {
  display: flex;
  flex-direction: column;
}

.menu-item-group {
  display: flex;
  flex-direction: column;
}

.network-row {
  display: flex;
  align-items: center;
  position: relative;
}

.network-row--editing {
  cursor: pointer;
}

.network-row--hidden {
  opacity: var(--sg-opacity-muted);
}

.network-visibility-indicator {
  position: absolute;
  right: var(--sg-sidebar-compact-control-spacing);
  color: var(--sg-color-text-muted);
  pointer-events: none;
}

.network-row:hover {
  background-color: var(--sg-color-surface-hover);
}

.menu-section {
  margin-bottom: var(--sg-sidebar-section-spacing);
}

.section-header {
  padding: var(--sg-sidebar-section-padding-block)
    var(--sg-sidebar-section-padding-inline);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: var(--sg-sidebar-section-title-size);
  color: var(--sg-color-text-muted);
}

.custom-links-section {
  border-top: 1px solid var(--sg-color-border);
  padding-top: var(--sg-sidebar-subsection-spacing);
  margin-bottom: var(--sg-sidebar-subsection-spacing);
}

.custom-link-delete {
  position: absolute;
  right: var(--sg-sidebar-compact-control-spacing);
}

.custom-link-add-icon {
  margin: var(--sg-sidebar-compact-control-spacing) auto;
  display: block;
}

.add-link-form {
  display: flex;
  flex-direction: column;
  gap: var(--sg-sidebar-form-gap);
}

.add-link-hint {
  margin: 0;
  color: var(--sg-color-text-muted);
}

.add-link-field {
  display: flex;
  flex-direction: column;
  gap: var(--sg-space-2);
  color: var(--sg-color-text);
}

.add-link-input {
  width: var(--sg-sidebar-fill-size);
  min-height: var(--sg-control-height-lg);
  padding: var(--sg-button-padding);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-raised);
  color: var(--sg-color-text);
  font: inherit;
}

.add-link-input:focus-visible,
.add-link-icon-option:focus-visible {
  outline: var(--sg-focus-ring);
  outline-offset: var(--sg-focus-offset);
}

.add-link-icon-field {
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--sg-color-text);
}

.add-link-icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sg-space-2);
  margin-top: var(--sg-space-2);
}

.add-link-icon-option {
  min-height: var(--sg-control-height-lg);
  border: var(--sg-border-1px) solid var(--sg-color-border);
  border-radius: var(--sg-radius-sm);
  background: var(--sg-color-surface-muted);
  color: var(--sg-color-text-muted);
  cursor: pointer;
}

.add-link-icon-option:hover {
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-text);
}

.add-link-icon-option--selected {
  border-color: var(--sg-color-action);
  background: var(--sg-color-surface-hover);
  color: var(--sg-color-action);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar {
    transition: none;
  }

  .sidebar-resize-handle {
    transition: none;
  }
}

.sidebar-resize-handle {
  position: relative;
  width: var(--sg-sidebar-resize-handle-width);
  background: var(--sg-color-surface-raised);
}
.sidebar-resize-handle::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  width: var(--sg-radius-lg);
  height: var(--sg-radius-lg);
  background: radial-gradient(
    circle at top left,
    transparent var(--sg-radius-lg),
    var(--sg-color-background) var(--sg-radius-lg)
  );
  pointer-events: none;
  z-index: 1;
}
.sidebar-resize-handle:hover {
  background: var(--sg-color-surface-raised);
}
.sidebar-resize-handle:focus-visible {
  background: var(--sg-color-surface-raised);
  outline: none;
}
.sidebar-resize-handle::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--sg-space-1);
  height: calc(4 * var(--sg-space-2));
  transform: translate(-50%, -50%);
  border-radius: var(--sg-radius-pill);
  background: var(--sg-color-border-strong);
  opacity: 0;
  pointer-events: none;
}
.sidebar-resize-handle:hover::before,
.sidebar-resize-handle[data-resize-handle-state="drag"]::before {
  opacity: 0.5;
}
</style>
