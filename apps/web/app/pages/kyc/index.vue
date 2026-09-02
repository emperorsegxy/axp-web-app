<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { IdType, DocSlot } from '~/types';

definePageMeta({ layout: false, middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const { submission, fetchSubmission, updateIdentity, uploadDocument, removeDocument, submit } = useKyc();

const step = ref(Math.min(3, Math.max(1, Number(route.query.step) || 1)));
const idNumberLocal = ref('');
const consent = ref(false);
const uploadingSlot = ref<DocSlot | null>(null);
const submitting = ref(false);
const error = ref('');
let idNumberDebounce: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  const s = await fetchSubmission();
  if (s && !['draft', 'needs_correction'].includes(s.status)) {
    router.replace('/kyc/status');
    return;
  }
  idNumberLocal.value = s?.idNumber || '';
});
onUnmounted(() => clearTimeout(idNumberDebounce));

const idType = computed<IdType>(() => submission.value?.idType || 'passport');

function docFor(slot: DocSlot) {
  return submission.value?.documents.find((d) => d.slot === slot) ?? null;
}

const numLabels: Record<IdType, [string, string]> = {
  passport: ['Passport number', 'A01234567'],
  licence: ['Licence number', 'LAG12345AA01'],
  nin: ['National Identification Number', '12345678901'],
};

async function pickType(type: IdType) {
  await updateIdentity({ idType: type });
}

function onIdNumberInput() {
  clearTimeout(idNumberDebounce);
  idNumberDebounce = setTimeout(() => {
    updateIdentity({ idNumber: idNumberLocal.value });
  }, 500);
}

async function onUpload(slot: DocSlot, file: File) {
  error.value = '';
  uploadingSlot.value = slot;
  try {
    await uploadDocument(slot, file);
  } catch (err) {
    error.value = extractErrorMessage(err, 'That upload didn’t go through. Try again.');
  } finally {
    uploadingSlot.value = null;
  }
}

async function onRemove(slot: DocSlot) {
  error.value = '';
  try {
    await removeDocument(slot);
  } catch (err) {
    error.value = extractErrorMessage(err, 'Could not remove that document.');
  }
}

const done1 = computed(() => !!docFor('identity') && idNumberLocal.value.trim().length > 4);
const done2 = computed(() => !!docFor('work') && !!docFor('address'));
const ok = computed(() => (step.value === 1 ? done1.value : step.value === 2 ? done2.value : consent.value));

const help = computed(() => {
  if (step.value === 1) return done1.value ? 'Both items look complete.' : 'Add your ID document and number to continue.';
  if (step.value === 2) return done2.value ? 'Both documents received.' : 'Both documents are required to continue.';
  return consent.value ? 'You can still edit any document before submitting.' : 'Tick the confirmation to submit.';
});
const ctaLabel = computed(() => (step.value === 3 ? 'Submit for verification' : 'Continue'));

const summary = computed(() => {
  const labels: Record<DocSlot, string> = {
    identity: { passport: 'International Passport', licence: "Driver's Licence", nin: 'National ID (NIN)' }[idType.value],
    work: 'Work or staff ID',
    address: 'Proof of address',
  };
  return (['identity', 'work', 'address'] as DocSlot[])
    .map((slot) => {
      const doc = docFor(slot);
      if (!doc) return null;
      return {
        slot,
        label: labels[slot],
        name: doc.name,
        previewUrl: doc.previewUrl,
        meta: slot === 'identity' ? idNumberLocal.value.trim() || doc.sizeLabel : doc.sizeLabel,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
});

function editSlot(slot: DocSlot) {
  step.value = slot === 'identity' ? 1 : 2;
}

async function onBack() {
  step.value = Math.max(1, step.value - 1);
}

async function onNext() {
  if (!ok.value) return;
  if (step.value < 3) {
    step.value += 1;
    return;
  }
  submitting.value = true;
  error.value = '';
  try {
    await submit();
    router.push('/kyc/status');
  } catch (err) {
    error.value = extractErrorMessage(err, 'Could not submit. Check your documents and try again.');
  } finally {
    submitting.value = false;
  }
}

watch(step, (v) => {
  router.replace({ query: { ...route.query, step: v } });
});
</script>

<template>
  <div class="page">
    <KycHeader />

    <div class="content">
      <div class="progress">
        <div class="progress-row">
          <div class="progress-label">Step {{ step }} of 3</div>
          <div class="progress-label">{{ ['Identity', 'Supporting docs', 'Review'][step - 1] }}</div>
        </div>
        <div class="segments">
          <div class="seg" :style="{ background: step >= 1 ? 'var(--gold)' : 'rgba(26,35,61,.12)' }" />
          <div class="seg" :style="{ background: step >= 2 ? 'var(--gold)' : 'rgba(26,35,61,.12)' }" />
          <div class="seg" :style="{ background: step >= 3 ? 'var(--gold)' : 'rgba(26,35,61,.12)' }" />
        </div>
      </div>

      <div v-if="error" class="error-banner" style="margin-bottom: 24px">
        <span class="dot" />
        <span class="msg">{{ error }}</span>
      </div>

      <!-- STEP 1 -->
      <div v-if="step === 1">
        <h1 class="heading">Identity document</h1>
        <p class="subheading">Upload one government-issued ID. It must be valid, unexpired, and fully visible in the frame.</p>

        <div class="section-label">ID type</div>
        <div class="type-grid">
          <button
            type="button"
            class="type-btn"
            :class="{ active: idType === 'passport' }"
            @click="pickType('passport')"
          >
            International Passport
          </button>
          <button type="button" class="type-btn" :class="{ active: idType === 'licence' }" @click="pickType('licence')">
            Driver's Licence
          </button>
          <button type="button" class="type-btn" :class="{ active: idType === 'nin' }" @click="pickType('nin')">
            National ID (NIN)
          </button>
        </div>

        <div class="section-label">Document</div>
        <KycUploadZone
          :doc="docFor('identity')"
          empty-title="Take a photo or choose a file"
          hint="JPG, PNG or PDF · up to 10&nbsp;MB<br>Flat surface, no glare, all four corners in frame"
          size="lg"
          :loading="uploadingSlot === 'identity'"
          @upload="(f) => onUpload('identity', f)"
          @remove="() => onRemove('identity')"
        />

        <div class="id-number">
          <label for="idnum" class="field-label">{{ numLabels[idType][0] }}</label>
          <input
            id="idnum"
            v-model="idNumberLocal"
            type="text"
            :placeholder="`e.g. ${numLabels[idType][1]}`"
            class="text-input"
            @input="onIdNumberInput"
          />
          <div class="hint-static">Enter it exactly as printed on the document.</div>
        </div>
      </div>

      <!-- STEP 2 -->
      <div v-else-if="step === 2">
        <h1 class="heading">Supporting documents</h1>
        <p class="subheading">Two more documents confirm where you work and where you live.</p>

        <div class="doc-group">
          <div class="doc-block">
            <div class="doc-block-head">
              <div class="doc-block-title">Work or staff ID</div>
              <div class="required-tag">Required</div>
            </div>
            <p class="doc-block-copy">Employer-issued ID card, or a signed letter of employment on company letterhead. JPG, PNG or PDF.</p>
            <KycUploadZone
              :doc="docFor('work')"
              empty-title="Upload work or staff ID"
              size="sm"
              :loading="uploadingSlot === 'work'"
              @upload="(f) => onUpload('work', f)"
              @remove="() => onRemove('work')"
            />
          </div>

          <div class="doc-block">
            <div class="doc-block-head">
              <div class="doc-block-title">Proof of address</div>
              <div class="required-tag">Required</div>
            </div>
            <p class="doc-block-copy">Utility bill, bank statement or tenancy agreement issued in the last 3 months, showing your name and address.</p>
            <KycUploadZone
              :doc="docFor('address')"
              empty-title="Upload proof of address"
              size="sm"
              :loading="uploadingSlot === 'address'"
              @upload="(f) => onUpload('address', f)"
              @remove="() => onRemove('address')"
            />
          </div>
        </div>
      </div>

      <!-- STEP 3 -->
      <div v-else>
        <h1 class="heading">Review &amp; submit</h1>
        <p class="subheading">Check each document is readable before you submit. Corrections after review take longer.</p>

        <div class="summary-list">
          <div v-for="doc in summary" :key="doc.slot" class="summary-card">
            <div class="summary-thumb">
              <div class="thumb-img" :style="{ backgroundImage: `url('${doc.previewUrl}')` }" />
            </div>
            <div class="summary-info">
              <div class="summary-label">{{ doc.label }}</div>
              <div class="summary-name">{{ doc.name }}</div>
              <div class="summary-meta">{{ doc.meta }}</div>
            </div>
            <button type="button" class="edit-btn" aria-label="Edit" @click="editSlot(doc.slot)">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#1A233D" stroke-width="1.5" stroke-linecap="round">
                <path d="M14.2 3.3l2.5 2.5-9 9L4 16l1.2-3.7z" />
                <path d="M12.6 4.9l2.5 2.5" />
              </svg>
            </button>
          </div>
        </div>

        <label class="consent-row">
          <input v-model="consent" type="checkbox" class="checkbox checkbox-top" />
          <span>I confirm these documents are genuine and belong to me, and I authorise AXP to verify them with the issuing authorities and its KYC partners.</span>
        </label>
      </div>
    </div>

    <KycStickyCta
      :can-go-back="step > 1"
      :disabled="!ok || submitting"
      :label="submitting ? 'Submitting…' : ctaLabel"
      :help="help"
      @back="onBack"
      @next="onNext"
    />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font-sans);
  color: var(--ink);
  padding-bottom: 132px;
}
.content {
  max-width: 680px;
  margin: 0 auto;
  padding: clamp(20px, 5vw, 36px) clamp(16px, 4vw, 24px) 0;
}
.progress {
  margin-bottom: 28px;
}
.progress-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.progress-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.segments {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}
.seg {
  height: 4px;
  border-radius: 999px;
  transition: background 200ms ease;
}
.heading {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(26px, 6.4vw, 34px);
  line-height: 1.15;
  margin: 0 0 10px;
}
.subheading {
  font-size: clamp(15px, 3.6vw, 16px);
  line-height: 1.65;
  color: var(--muted);
  margin: 0 0 32px;
  max-width: 46ch;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 10px;
}
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 32px;
}
.type-btn {
  min-height: 48px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 160ms ease;
  background: var(--white);
  color: var(--ink);
}
.type-btn.active {
  background: var(--navy);
  color: var(--white);
  border-color: var(--navy);
}
.id-number {
  margin-top: 32px;
}
.hint-static {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 8px;
}
.doc-group {
  display: grid;
  gap: 24px;
}
.doc-block-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.doc-block-title {
  font-size: 16px;
  font-weight: 600;
}
.required-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted);
}
.doc-block-copy {
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted);
  margin: 0 0 12px;
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
.edit-btn {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 10px;
  border: 1px solid rgba(26, 35, 61, 0.14);
  background: var(--white);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.edit-btn:hover {
  background: var(--cream);
}
.consent-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 28px;
  padding: 16px;
  border: 1px solid rgba(26, 35, 61, 0.1);
  border-radius: 12px;
  background: var(--cream);
  cursor: pointer;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink);
}
.checkbox-top {
  width: 20px;
  height: 20px;
  margin: 2px 0 0;
  accent-color: var(--navy);
  flex: none;
}
</style>
