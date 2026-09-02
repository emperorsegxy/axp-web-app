<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { DocSlot } from '~/types';

definePageMeta({ layout: false, middleware: 'auth' });

const router = useRouter();
const { submission, fetchSubmission } = useKyc();

onMounted(async () => {
  const s = await fetchSubmission();
  if (!s) router.replace('/kyc');
});

const labels: Record<DocSlot, string> = { identity: 'Identity document', work: 'Work or staff ID', address: 'Proof of address' };
const ordered = computed(() => {
  const order: DocSlot[] = ['identity', 'work', 'address'];
  return order.map((slot) => submission.value?.documents.find((d) => d.slot === slot)).filter(Boolean);
});
</script>

<template>
  <div class="page">
    <KycHeader />
    <div class="content" v-if="submission">
      <button type="button" class="back-btn" @click="router.push('/kyc/status')">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#656A76" stroke-width="1.6" stroke-linecap="round">
          <path d="M9.5 3.5 5 8l4.5 4.5" />
        </svg>
        Back
      </button>
      <h1 class="heading">Submitted documents</h1>
      <p class="subheading">Reference {{ submission.referenceCode }}. These are locked while your application is under review.</p>

      <div class="summary-list">
        <div v-for="doc in ordered" :key="doc!.slot" class="summary-card">
          <div class="summary-thumb">
            <div class="thumb-img" :style="{ backgroundImage: `url('${doc!.previewUrl}')` }" />
          </div>
          <div class="summary-info">
            <div class="summary-label">{{ labels[doc!.slot] }}</div>
            <div class="summary-name">{{ doc!.name }}</div>
            <div class="summary-meta">{{ doc!.sizeLabel }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font-sans);
  color: var(--ink);
}
.content {
  max-width: 680px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 36px) clamp(16px, 4vw, 24px) 40px;
}
.back-btn {
  background: none;
  border: 0;
  padding: 6px 0;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.heading {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(26px, 6.4vw, 34px);
  line-height: 1.15;
  margin: 0 0 10px;
}
.subheading {
  font-size: 15px;
  line-height: 1.65;
  color: var(--muted);
  margin: 0 0 32px;
}
.summary-list {
  display: grid;
  gap: 12px;
}
.summary-card {
  background: var(--white);
  border: 1px solid rgba(26, 35, 61, 0.1);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(26, 35, 61, 0.05);
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}
.summary-thumb {
  width: 56px;
  height: 70px;
  border-radius: 10px;
  background: var(--cream);
  overflow: hidden;
  flex: none;
}
.thumb-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
.summary-info {
  min-width: 0;
  flex: 1;
}
.summary-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 4px;
}
.summary-name {
  font-size: 14.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary-meta {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 3px;
}
</style>
