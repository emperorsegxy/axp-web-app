<script setup lang="ts">
import { computed, ref } from 'vue';

definePageMeta({ layout: false });

const { signin } = useAuth();
const router = useRouter();

const email = ref('');
const password = ref('');
const remember = ref(true);
const error = ref('');
const loading = ref(false);

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.value.trim()));
const canSubmit = computed(() => emailOk.value && password.value.length > 0 && !loading.value);

async function onSubmit() {
  if (!canSubmit.value) return;
  error.value = '';
  loading.value = true;
  try {
    await signin({ email: email.value.trim(), password: password.value, remember: remember.value });
    router.push('/kyc');
  } catch (err) {
    const data = (err as { data?: { needsVerification?: boolean; email?: string; error?: string } })?.data;
    if (data?.needsVerification) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email || email.value)}&purpose=signup_verify`);
      return;
    }
    error.value = extractErrorMessage(err, "That email and password don't match our records. Check both and try again.");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="heading">Welcome back</h1>
    <p class="subheading">Sign in to pick up your application.</p>

    <form class="fields" @submit.prevent="onSubmit">
      <div>
        <label for="si-email" class="field-label">Email address</label>
        <input
          id="si-email"
          v-model.trim="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="text-input"
        />
      </div>

      <div>
        <div class="row-between">
          <label for="si-pw" class="field-label" style="margin-bottom: 0">Password</label>
          <NuxtLink to="/auth/forgot-password" class="link-muted">Forgot password?</NuxtLink>
        </div>
        <AuthPasswordField id="si-pw" v-model="password" label="" placeholder="Enter your password" autocomplete="current-password" />
      </div>

      <div v-if="error" class="error-banner">
        <span class="dot" />
        <span class="msg">{{ error }}</span>
      </div>

      <label class="checkbox-row">
        <input v-model="remember" type="checkbox" class="checkbox" />
        <span>Keep me signed in on this device</span>
      </label>

      <button type="submit" class="btn-primary" :disabled="!canSubmit">Sign in</button>

      <div class="divider"><span /><em>or</em><span /></div>

      <AuthGoogleButton />

      <p class="footer-text">New to AXP? <NuxtLink to="/auth/signup" class="link-strong">Create an account</NuxtLink></p>
    </form>
  </AuthLayout>
</template>

<style scoped>
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
.row-between {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.link-muted {
  background: none;
  border: 0;
  padding: 2px 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
}
.checkbox-row {
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--muted);
}
.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--navy);
  flex: none;
}
.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 4px 0;
}
.divider span {
  height: 1px;
  flex: 1;
  background: rgba(26, 35, 61, 0.12);
}
.divider em {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted-2);
}
.footer-text {
  font-size: 13.5px;
  color: var(--muted);
  margin: 8px 0 0;
  text-align: center;
}
.link-strong {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--navy);
}
</style>
