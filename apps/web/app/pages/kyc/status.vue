<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { DocSlot } from '~/types';
import { formatDate } from '~/utils/formatDate';

definePageMeta({ layout: false, middleware: 'auth' });

const router = useRouter();
const { submission, fetchSubmission, restart } = useKyc();
const restarting = ref(false);

onMounted(async () => {
  const s = await fetchSubmission();
  if (!s || s.status === 'draft') {
    router.replace('/kyc');
  }
});

const flaggedDoc = computed(() => submission.value?.documents.find((d) => d.status === 'flagged') || null);
const labels: Record<DocSlot, string> = { identity: 'Identity document', work: 'Work or staff ID', address: 'Proof of address' };
const acceptedCount = computed(() => submission.value?.documents.filter((d) => d.status === 'accepted').length ?? 0);

function goReview() {
  router.push('/kyc/review');
}

function goFix() {
  if (!flaggedDoc.value) return;
  router.push(`/kyc?step=${flaggedDoc.value.slot === 'identity' ? 1 : 2}`);
}

async function onRestart() {
  restarting.value = true;
  try {
    await restart();
    router.push('/kyc?step=1');
  } finally {
    restarting.value = false;
  }
}
</script>

<template>
  <div class="page">
    <KycHeader />
    <div class="content" v-if="submission">
      <!-- PENDING -->
      <div v-if="submission.status === 'pending'">
        <div class="card card-pending">
          <div class="badge badge-neutral"><span class="dot pulsing" />Under review</div>
          <h1 class="heading">We're reviewing your documents</h1>
          <p class="body">Nothing more is needed from you. We'll notify you by SMS and email within 1–2 business days.</p>
          <div class="meta-rows">
            <div class="meta-row"><span>Submitted</span><span class="meta-val">{{ formatDate(submission.submittedAt, true) }}</span></div>
            <div class="meta-row"><span>Documents</span><span class="meta-val">{{ acceptedCount }} of 3 received</span></div>
            <div class="meta-row"><span>Reference</span><span class="meta-val mono">{{ submission.referenceCode }}</span></div>
          </div>
        </div>
        <button type="button" class="btn-secondary full" @click="goReview">View submitted documents</button>
      </div>

      <!-- NEEDS CORRECTION -->
      <div v-else-if="submission.status === 'needs_correction'">
        <div class="card card-correction">
          <div class="badge badge-warning"><span class="dot" />Needs correction</div>
          <h1 class="heading">One document needs attention</h1>
          <p class="body">Your other documents were accepted. Re-upload the flagged document to continue.</p>

          <div class="flag-box" v-if="flaggedDoc">
            <div class="flag-top">
              <div class="flag-thumb" />
              <div class="min-w-0">
                <div class="flag-label">Flagged</div>
                <div class="flag-title">{{ labels[flaggedDoc.slot] }}</div>
                <div class="flag-name">{{ flaggedDoc.name }}</div>
              </div>
            </div>
            <div class="flag-note-wrap">
              <div class="flag-note-label">Reviewer note</div>
              <p class="flag-note">{{ flaggedDoc.flagNote || submission.decisionNote }}</p>
              <div class="flag-decider">{{ submission.decidedAt ? `Compliance · ${formatDate(submission.decidedAt)}` : '' }}</div>
            </div>
          </div>
        </div>
        <button type="button" class="btn-primary full" @click="goFix">Re-upload {{ flaggedDoc ? labels[flaggedDoc.slot].toLowerCase() : 'document' }}</button>
      </div>

      <!-- APPROVED -->
      <div v-else-if="submission.status === 'approved'">
        <div class="card card-approved">
          <div class="check-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(0.48 0.12 155)" stroke-width="2.2" stroke-linecap="round">
              <path d="M5 12.8l4.4 4.4L19 7.6" />
            </svg>
          </div>
          <div class="badge badge-success">Verified</div>
          <h1 class="heading">Your identity is verified</h1>
          <p class="body">All three documents were approved{{ submission.decidedAt ? ` on ${formatDate(submission.decidedAt)}` : '' }}. Your application moves on to affordability assessment.</p>
        </div>
        <button type="button" class="btn-primary full">Continue to next step</button>
      </div>

      <!-- REJECTED -->
      <div v-else-if="submission.status === 'rejected'">
        <div class="card card-rejected">
          <div class="badge badge-error"><span class="dot" />Not approved</div>
          <h1 class="heading">We couldn't verify your identity</h1>
          <p class="body">Your submission was closed{{ submission.decidedAt ? ` on ${formatDate(submission.decidedAt)}` : '' }}. Our compliance team can reopen it once the mismatch is resolved.</p>
          <div class="reason-box">
            <div class="flag-note-label">Reason</div>
            <p class="flag-note">{{ submission.decisionNote || 'The submitted documents could not be verified.' }}</p>
            <div class="flag-decider">Reference {{ submission.referenceCode }}</div>
          </div>
        </div>
        <div class="btn-pair">
          <button type="button" class="btn-primary">Contact support</button>
          <button type="button" class="btn-secondary" :disabled="restarting" @click="onRestart">
            {{ restarting ? 'Starting…' : 'Start a new submission' }}
          </button>
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
.card {
  background: var(--white);
  border: 1px solid rgba(26, 35, 61, 0.1);
  border-top: 3px solid var(--navy);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(26, 35, 61, 0.05);
  padding: clamp(20px, 5vw, 28px);
}
.card-correction {
  border-top-color: var(--warning);
}
.card-approved {
  border-top-color: var(--success);
}
.card-rejected {
  border-top-color: var(--error);
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(26, 35, 61, 0.18);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
}
.badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--navy);
}
.badge .dot.pulsing {
  animation: pulseRing 2s ease-out infinite;
}
.badge-warning {
  background: oklch(0.68 0.15 70 / 0.12);
  border-color: oklch(0.68 0.15 70 / 0.35);
  color: var(--warning-text);
}
.badge-warning .dot {
  background: var(--warning);
}
.badge-success {
  background: oklch(0.55 0.13 155 / 0.12);
  border-color: oklch(0.55 0.13 155 / 0.32);
  color: var(--success-text-2);
}
.badge-error {
  background: oklch(0.58 0.18 28 / 0.1);
  border-color: oklch(0.58 0.18 28 / 0.32);
  color: var(--error-text-2);
}
.badge-error .dot {
  background: var(--error);
}
.heading {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(24px, 5.8vw, 30px);
  line-height: 1.18;
  margin: 18px 0 10px;
}
.body {
  font-size: 15px;
  line-height: 1.65;
  color: var(--muted);
  margin: 0;
  max-width: 44ch;
}
.meta-rows {
  display: grid;
  gap: 1px;
  background: rgba(26, 35, 61, 0.1);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 24px;
}
.meta-row {
  background: var(--white);
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 13.5px;
}
.meta-row span:first-child {
  color: var(--muted);
}
.meta-val {
  font-weight: 500;
}
.meta-val.mono {
  font-variant-numeric: tabular-nums;
}
.full {
  width: 100%;
  margin-top: 12px;
}
.flag-box {
  border: 1px solid oklch(0.68 0.15 70 / 0.35);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 24px;
}
.flag-top {
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: center;
  border-bottom: 1px solid oklch(0.68 0.15 70 / 0.25);
}
.flag-thumb {
  width: 48px;
  height: 60px;
  border-radius: 8px;
  background: var(--cream);
  flex: none;
}
.min-w-0 {
  min-width: 0;
}
.flag-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--warning-text);
  margin-bottom: 4px;
}
.flag-title {
  font-size: 14.5px;
  font-weight: 600;
}
.flag-name {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 2px;
}
.flag-note-wrap {
  padding: 16px;
  background: oklch(0.68 0.15 70 / 0.07);
}
.reason-box {
  border: 1px solid rgba(26, 35, 61, 0.12);
  border-radius: 12px;
  padding: 16px;
  background: var(--cream);
  margin-top: 16px;
}
.flag-note-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 8px;
}
.flag-note {
  font-size: 14px;
  line-height: 1.65;
  margin: 0 0 10px;
}
.flag-decider {
  font-size: 12px;
  color: var(--muted);
}
.check-badge {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: oklch(0.55 0.13 155 / 0.12);
  display: grid;
  place-items: center;
  margin-bottom: 20px;
}
.btn-pair {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-top: 12px;
}
.btn-pair button {
  width: 100%;
}
</style>
