<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const { verifyOtp, resendOtp } = useAuth();
const resetToken = useResetToken();

const email = computed(() => String(route.query.email || ''));
const purpose = computed(() => (route.query.purpose === 'password_reset' ? 'password_reset' : 'signup_verify'));

const code = ref('');
const error = ref('');
const loading = ref(false);
const countdown = ref(45);
let timer: ReturnType<typeof setInterval> | undefined;

function startCountdown() {
  clearInterval(timer);
  countdown.value = 45;
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      clearInterval(timer);
      countdown.value = 0;
    } else {
      countdown.value -= 1;
    }
  }, 1000);
}

onMounted(() => {
  if (!email.value) {
    router.replace('/auth/signup');
    return;
  }
  startCountdown();
});
onUnmounted(() => clearInterval(timer));

const canSubmit = computed(() => code.value.length === 6 && !loading.value);

async function onSubmit() {
  if (!canSubmit.value) return;
  error.value = '';
  loading.value = true;
  try {
    const res = await verifyOtp({ email: email.value, code: code.value, purpose: purpose.value });
    if (purpose.value === 'password_reset') {
      resetToken.value = res.resetToken || null;
      router.push('/auth/reset-password');
    } else {
      router.push('/auth/success?kind=signup');
    }
  } catch (err) {
    error.value = extractErrorMessage(err, 'That code isn’t right. Enter the most recent code we sent, or request a new one.');
  } finally {
    loading.value = false;
  }
}

async function onResend() {
  if (countdown.value > 0) return;
  code.value = '';
  error.value = '';
  try {
    await resendOtp({ email: email.value, purpose: purpose.value });
    startCountdown();
  } catch (err) {
    error.value = extractErrorMessage(err, 'Please wait before requesting another code.');
  }
}

function goBack() {
  router.push(purpose.value === 'password_reset' ? '/auth/forgot-password' : '/auth/signup');
}
</script>

<template>
  <AuthLayout>
    <button type="button" class="back-btn" @click="goBack">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#656A76" stroke-width="1.6" stroke-linecap="round">
        <path d="M9.5 3.5 5 8l4.5 4.5" />
      </svg>
      Back
    </button>
    <h1 class="heading">Confirm your email</h1>
    <p class="subheading">We sent a 6-digit code to <strong>{{ email || 'your email' }}</strong>. It expires in 10 minutes.</p>

    <AuthOtpInput v-model="code" :has-error="!!error" />

    <div v-if="error" class="error-banner" style="margin-bottom: 20px">
      <span class="dot" />
      <span class="msg">{{ error }}</span>
    </div>

    <button type="button" class="btn-primary" style="width: 100%" :disabled="!canSubmit" @click="onSubmit">Verify email</button>

    <div class="footer-block">
      <div v-if="countdown === 0">
        Didn't get it? <button type="button" class="link-strong-btn" @click="onResend">Send a new code</button>
      </div>
      <div v-else>You can request a new code in {{ countdown }}s.</div>
      <div class="spam-note">Check your spam folder if it hasn't arrived after a minute.</div>
    </div>
  </AuthLayout>
</template>

<style scoped>
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
  font-size: clamp(28px, 4vw, 34px);
  line-height: 1.15;
  margin: 0 0 10px;
}
.subheading {
  font-size: 15px;
  line-height: 1.65;
  color: var(--muted);
  margin: 0 0 32px;
}
.subheading strong {
  color: var(--ink);
  font-weight: 600;
}
.footer-block {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid rgba(26, 35, 61, 0.1);
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.7;
}
.link-strong-btn {
  background: none;
  border: 0;
  padding: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--navy);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.spam-note {
  margin-top: 4px;
}
</style>
