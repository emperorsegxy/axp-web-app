<script setup lang="ts">
import { computed, ref } from 'vue';

definePageMeta({ layout: false });

const { forgotPassword } = useAuth();
const router = useRouter();

const email = ref('');
const loading = ref(false);
const error = ref('');

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.value.trim()));
const canSubmit = computed(() => emailOk.value && !loading.value);

async function onSubmit() {
  if (!canSubmit.value) return;
  loading.value = true;
  error.value = '';
  try {
    await forgotPassword(email.value.trim());
    router.push(`/auth/verify-email?email=${encodeURIComponent(email.value.trim())}&purpose=password_reset`);
  } catch (err) {
    error.value = extractErrorMessage(err, 'Something went wrong. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <NuxtLink to="/auth/signin" class="back-btn">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#656A76" stroke-width="1.6" stroke-linecap="round">
        <path d="M9.5 3.5 5 8l4.5 4.5" />
      </svg>
      Back to sign in
    </NuxtLink>
    <h1 class="heading">Reset your password</h1>
    <p class="subheading">Enter the email on your account and we'll send a 6-digit code to confirm it's you.</p>

    <form class="fields" @submit.prevent="onSubmit">
      <div v-if="error" class="error-banner">
        <span class="dot" />
        <span class="msg">{{ error }}</span>
      </div>
      <div>
        <label for="fp-email" class="field-label">Email address</label>
        <input id="fp-email" v-model.trim="email" type="email" placeholder="you@example.com" autocomplete="email" class="text-input" />
      </div>
      <button type="submit" class="btn-primary" :disabled="!canSubmit">Send code</button>
    </form>

    <div class="notice">
      If an account exists for that address, the code arrives within a minute. For security we don't confirm whether an email is registered.
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
  text-decoration: none;
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
.fields {
  display: grid;
  gap: 18px;
}
.notice {
  margin-top: 24px;
  padding: 16px;
  border-radius: 12px;
  background: var(--cream);
  border: 1px solid rgba(26, 35, 61, 0.08);
  font-size: 13px;
  line-height: 1.65;
  color: var(--muted);
}
</style>
