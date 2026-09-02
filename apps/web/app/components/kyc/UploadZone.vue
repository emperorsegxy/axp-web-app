<script setup lang="ts">
import { ref } from 'vue';
import type { KycDocument } from '~/types';

const props = defineProps<{
  doc: KycDocument | null | undefined;
  emptyTitle: string;
  hint?: string;
  size?: 'lg' | 'sm';
  loading?: boolean;
}>();
const emit = defineEmits<{ upload: [File]; remove: [] }>();

const input = ref<HTMLInputElement | null>(null);

function open() {
  input.value?.click();
}
function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) emit('upload', file);
  if (input.value) input.value.value = '';
}
function onDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) emit('upload', file);
}
</script>

<template>
  <div>
    <input ref="input" type="file" accept="image/*,application/pdf" @change="onChange" />

    <div v-if="!doc" class="dropzone" :class="size === 'sm' ? 'sm' : 'lg'" @click="open" @dragover.prevent @drop="onDrop">
      <div class="icon-badge" :class="size === 'sm' ? 'sm' : 'lg'">
        <svg :width="size === 'sm' ? 18 : 20" :height="size === 'sm' ? 18 : 20" viewBox="0 0 20 20" fill="none" stroke="#1A233D" stroke-width="1.6" stroke-linecap="round">
          <path d="M10 14V4" />
          <path d="M5.5 8.5 10 4l4.5 4.5" />
          <path d="M3.5 16.5h13" />
        </svg>
      </div>
      <div class="title" :class="size === 'sm' ? 'sm' : 'lg'">{{ loading ? 'Uploading…' : emptyTitle }}</div>
      <div v-if="hint && size !== 'sm'" class="hint" v-html="hint" />
    </div>

    <div v-else class="doc-card">
      <div class="thumb" :class="size === 'sm' ? 'sm' : 'lg'">
        <div class="thumb-img" :style="{ backgroundImage: `url('${doc.previewUrl}')` }" />
      </div>
      <div class="doc-info">
        <div class="doc-name">{{ doc.name }}</div>
        <div class="doc-meta">{{ doc.sizeLabel }} · uploaded</div>
        <div v-if="doc.status === 'flagged'" class="flagged-note">Flagged — needs to be replaced</div>
        <div class="doc-actions">
          <button type="button" class="link-strong-btn" @click="open">Replace</button>
          <button type="button" class="link-muted-btn" @click="emit('remove')">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropzone {
  border: 1.5px dashed rgba(26, 35, 61, 0.22);
  border-radius: 16px;
  background: var(--white);
  text-align: center;
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease;
}
.dropzone:hover {
  border-color: rgba(26, 35, 61, 0.45);
}
.dropzone.lg {
  padding: 40px 24px;
}
.dropzone.sm {
  padding: 32px 24px;
}
.icon-badge {
  border-radius: 999px;
  background: var(--cream);
  display: grid;
  place-items: center;
  margin: 0 auto;
}
.icon-badge.lg {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}
.icon-badge.sm {
  width: 44px;
  height: 44px;
  margin-bottom: 14px;
}
.title.lg {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.title.sm {
  font-size: 14.5px;
  font-weight: 600;
}
.hint {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--muted);
}
.doc-card {
  background: var(--white);
  border: 1px solid rgba(26, 35, 61, 0.1);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(26, 35, 61, 0.05);
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}
.thumb {
  border-radius: 10px;
  background: var(--cream);
  overflow: hidden;
  flex: none;
  display: grid;
  place-items: center;
}
.thumb.lg {
  width: 60px;
  height: 76px;
}
.thumb.sm {
  width: 60px;
  height: 76px;
}
.thumb-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
.doc-info {
  min-width: 0;
  flex: 1;
}
.doc-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.doc-meta {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 3px;
}
.flagged-note {
  font-size: 12.5px;
  color: var(--warning-text);
  font-weight: 600;
  margin-top: 4px;
}
.doc-actions {
  display: flex;
  gap: 16px;
  margin-top: 10px;
}
.link-strong-btn {
  background: none;
  border: 0;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--navy);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.link-muted-btn {
  background: none;
  border: 0;
  padding: 4px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
}
</style>
