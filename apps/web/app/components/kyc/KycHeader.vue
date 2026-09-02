<script setup lang="ts">
const { logout } = useAuth();
const router = useRouter();

async function onExit() {
  await logout();
  router.push('/auth/signin');
}
</script>

<template>
  <div class="header">
    <div class="header-inner">
      <div class="mark">AXP</div>
      <button type="button" class="exit-btn" @click="onExit">Save &amp; exit</button>
    </div>
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(26, 35, 61, 0.1);
}
.header-inner {
  max-width: 680px;
  margin: 0 auto;
  padding: 14px clamp(16px, 4vw, 24px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.mark {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 19px;
  letter-spacing: 0.01em;
}
.exit-btn {
  background: none;
  border: 0;
  padding: 10px 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
}
</style>
