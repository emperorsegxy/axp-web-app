<script setup lang="ts">
import { computed, ref } from 'vue';
import { isPasswordStrong } from '~/utils/passwordStrength';

definePageMeta({ layout: false });

const { signup } = useAuth();
const router = useRouter();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const terms = ref(false);
const error = ref('');
const loading = ref(false);

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.value.trim()));
const emailTouched = computed(() => email.value.length > 3);
const strong = computed(() => isPasswordStrong(password.value));
const canSubmit = computed(
  () => firstName.value.trim() && lastName.value.trim() && emailOk.value && strong.value && terms.value && !loading.value,
);

async function onSubmit() {
  if (!canSubmit.value) return;
  error.value = '';
  loading.value = true;
  try {
    const res = await signup({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push(`/auth/verify-email?email=${encodeURIComponent(res.email)}&purpose=signup_verify`);
  } catch (err) {
    error.value = extractErrorMessage(err, 'Something went wrong. Please try again.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="heading">Create your account</h1>
    <p class="subheading">Takes about two minutes. You'll upload documents later.</p>

    <form class="fields" @submit.prevent="onSubmit">
      <div v-if="error" class="error-banner">
        <span class="dot" />
        <span class="msg">{{ error }}</span>
      </div>

      <div class="name-row">
        <div>
          <label for="su-first" class="field-label">First name</label>
          <input id="su-first" v-model.trim="firstName" type="text" placeholder="Adaeze" autocomplete="given-name" class="text-input" />
        </div>
        <div>
          <label for="su-last" class="field-label">Last name</label>
          <input id="su-last" v-model.trim="lastName" type="text" placeholder="Okonkwo" autocomplete="family-name" class="text-input" />
        </div>
      </div>

      <div>
        <label for="su-email" class="field-label">Email address</label>
        <input
          id="su-email"
          v-model.trim="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="text-input"
          :class="{ 'has-error': emailTouched && !emailOk }"
        />
        <div class="hint" :class="{ 'hint-error': emailTouched && !emailOk }">
          {{ emailTouched && !emailOk ? 'That doesn’t look like a valid email address.' : 'We’ll send your verification code here.' }}
        </div>
      </div>

      <div>
        <AuthPasswordField id="su-pw" v-model="password" label="Password" placeholder="At least 8 characters" autocomplete="new-password">
          <AuthPasswordStrength :password="password" />
        </AuthPasswordField>
      </div>

      <label class="terms-row">
        <input v-model="terms" type="checkbox" class="checkbox checkbox-top" />
        <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and to AXP verifying my identity as required by law.</span>
      </label>

      <button type="submit" class="btn-primary" :disabled="!canSubmit">Create account</button>

      <div class="divider"><span /><em>or</em><span /></div>

      <AuthGoogleButton />

      <p class="footer-text">Already have an account? <NuxtLink to="/auth/signin" class="link-strong">Sign in</NuxtLink></p>
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
.name-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
.hint {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 8px;
  line-height: 1.5;
}
.hint-error {
  color: var(--error-text-2);
}
.terms-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--muted);
}
.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--navy);
  flex: none;
}
.checkbox-top {
  width: 20px;
  height: 20px;
  margin-top: 1px;
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
