<script setup lang="ts">
const { user, fetchMe } = useAuth();
if (!user.value) await fetchMe();
navigateTo(user.value ? '/kyc' : '/auth/signin');
</script>

<template>
  <div />
</template>
