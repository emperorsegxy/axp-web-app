<script setup lang="ts"></script>

<template>
  <div class="shell">
    <div class="grid">
      <div class="form-col">
        <div class="form-wrap">
          <slot />
        </div>
      </div>

      <div class="brand-col">
        <div class="brand-mark">AXP</div>
        <div>
          <div class="brand-art">
            <span>Brand imagery</span>
          </div>
          <h2 class="brand-heading">A mortgage process that tells you where you stand.</h2>
          <p class="brand-copy">Apply, upload your documents once, and track every review step from one place.</p>
        </div>
        <div class="brand-footer">AXP Mortgage Services · Lagos, Nigeria</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  font-family: var(--font-sans);
  color: var(--ink);
  background: var(--bg);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  min-height: 100vh;
}

.form-col {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(28px, 5vw, 64px) clamp(16px, 4vw, 48px) clamp(48px, 6vw, 64px);
}

.form-wrap {
  width: 100%;
  max-width: 420px;
}

.brand-col {
  background: var(--navy);
  color: var(--white);
  padding: clamp(24px, 4vw, 56px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(24px, 4vw, 40px);
}

.brand-mark {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: 0.01em;
}

.brand-art {
  height: clamp(96px, 22vw, 200px);
  border-radius: 16px;
  background: linear-gradient(160deg, rgba(212, 160, 42, 0.22), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.14);
  margin-bottom: clamp(18px, 3vw, 28px);
  display: grid;
  place-items: center;
}
.brand-art span {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.45);
}

.brand-heading {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: clamp(21px, 2.6vw, 32px);
  line-height: 1.24;
  margin: 0 0 12px;
  max-width: 22ch;
}

.brand-copy {
  font-size: 14.5px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.62);
  margin: 0;
  max-width: 40ch;
  text-wrap: pretty;
}

.brand-footer {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
  line-height: 1.6;
  padding-right: 120px;
}

@media (max-width: 839px) {
  .brand-footer {
    padding-right: 0;
  }
}
</style>
