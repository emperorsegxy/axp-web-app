<script setup lang="ts">
import { computed, onMounted } from 'vue';

definePageMeta({ layout: false });

const route = useRoute();
const router = useRouter();
const { user, fetchMe } = useAuth();

onMounted(() => {
  if (!user.value) fetchMe();
});

const kind = computed(() => (route.query.kind === 'reset' ? 'reset' : 'signup'));

const copy = computed(() =>
  kind.value === 'signup'
    ? {
        title: 'Your account is ready',
        body: `You're signed in as ${user.value?.email || 'your new account'}. Next we'll verify your identity with three documents — it takes about five minutes.`,
        cta: 'Start identity verification',
      }
    : {
        title: 'Password updated',
        body: "You're signed in with your new password. We signed out any other devices as a precaution.",
        cta: 'Continue to my application',
      },
);

function onCta() {
  router.push('/kyc');
}
</script>

<template>
  <AuthLayout>
    <div class="done-wrap">
      <div class="check-badge">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.48 0.12 155)" stroke-width="2.2" stroke-linecap="round">
          <path d="M5 12.8l4.4 4.4L19 7.6" />
        </svg>
      </div>
      <h1 class="heading">{{ copy.title }}</h1>
      <p class="subheading">{{ copy.body }}</p>
      <div class="actions">
        <button type="button" class="btn-primary" @click="onCta">{{ copy.cta }}</button>
        <NuxtLink to="/auth/signin" class="btn-secondary" style="text-align: center; text-decoration: none">Back to sign in</NuxtLink>
      </div>
    </div>
  </AuthLayout>
</template>

<style scoped>
.done-wrap {
  animation: fadeUp 320ms ease both;
}
.check-badge {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: oklch(0.55 0.13 155 / 0.12);
  display: grid;
  place-items: center;
  margin-bottom: 24px;
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
  margin: 0 0 28px;
  max-width: 40ch;
}
.actions {
  display: grid;
  gap: 10px;
}
</style>
