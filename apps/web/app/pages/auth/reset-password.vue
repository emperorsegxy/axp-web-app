<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isPasswordStrong } from '~/utils/passwordStrength';

definePageMeta({ layout: false });

const { resetPassword } = useAuth();
const router = useRouter();
const resetToken = useResetToken();

onMounted(() => {
  if (!resetToken.value) router.replace('/auth/forgot-password');
});

const password = ref('');
const confirm = ref('');
const error = ref('');
const loading = ref(false);

const strong = computed(() => isPasswordStrong(password.value));
const match = computed(() => confirm.value.length > 0 && confirm.value === password.value);
const confirmTouched = computed(() => confirm.value.length > 0);
const canSubmit = computed(() => strong.value && match.value && !loading.value);

async function onSubmit() {
  if (!canSubmit.value || !resetToken.value) return;
  error.value = '';
  loading.value = true;
  try {
    await resetPassword({ resetToken: resetToken.value, password: password.value });
    resetToken.value = null;
    router.push('/auth/success?kind=reset');
  } catch (err) {
    error.value = extractErrorMessage(err, 'This reset link has expired. Start over.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="heading">Choose a new password</h1>
    <p class="subheading">Your new password signs you in everywhere.</p>

    <form class="fields" @submit.prevent="onSubmit">
      <div v-if="error" class="error-banner">
        <span class="dot" />
        <span class="msg">{{ error }}</span>
      </div>

      <AuthPasswordField id="rp-pw" v-model="password" label="New password" placeholder="At least 8 characters" autocomplete="new-password">
        <AuthPasswordStrength :password="password" />
      </AuthPasswordField>

      <div>
        <label for="rp-pw2" class="field-label">Confirm new password</label>
        <input
          id="rp-pw2"
          v-model="confirm"
          type="password"
          placeholder="Re-enter your password"
          autocomplete="new-password"
          class="text-input"
          :class="{ 'has-error': confirmTouched && !match }"
        />
        <div class="hint" :class="{ 'hint-error': confirmTouched && !match }">
          {{ confirm.length === 0 ? 'Type it once more to be sure.' : match ? 'Passwords match.' : 'Passwords don’t match yet.' }}
        </div>
      </div>

      <button type="submit" class="btn-primary" :disabled="!canSubmit">Save and sign in</button>
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
.hint {
  font-size: 12.5px;
  color: var(--muted);
  margin-top: 8px;
  line-height: 1.5;
}
.hint-error {
  color: var(--error-text-2);
}
</style>
