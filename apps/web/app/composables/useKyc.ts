import type { DocSlot, IdType, KycSubmission } from '~/types';

export function useKycSubmission() {
  return useState<KycSubmission | null>('kyc-submission', () => null);
}

export function useKyc() {
  const submission = useKycSubmission();

  async function fetchSubmission() {
    const res = await apiFetch<{ submission: KycSubmission | null }>('/kyc/me');
    submission.value = res.submission;
    return res.submission;
  }

  async function updateIdentity(input: { idType?: IdType; idNumber?: string }) {
    const res = await apiFetch<{ submission: KycSubmission }>('/kyc/submission', {
      method: 'PATCH',
      body: input,
    });
    submission.value = res.submission;
    return res.submission;
  }

  async function uploadDocument(slot: DocSlot, file: File) {
    const formData = new FormData();
    formData.append('slot', slot);
    formData.append('file', file);
    const res = await apiFetch<{ submission: KycSubmission }>('/kyc/documents', {
      method: 'POST',
      body: formData,
    });
    submission.value = res.submission;
    return res.submission;
  }

  async function removeDocument(slot: DocSlot) {
    const res = await apiFetch<{ submission: KycSubmission }>(`/kyc/documents/${slot}`, { method: 'DELETE' });
    submission.value = res.submission;
    return res.submission;
  }

  async function submit() {
    const res = await apiFetch<{ submission: KycSubmission }>('/kyc/submit', {
      method: 'POST',
      body: { consent: true },
    });
    submission.value = res.submission;
    return res.submission;
  }

  async function restart() {
    const res = await apiFetch<{ submission: KycSubmission }>('/kyc/restart', { method: 'POST' });
    submission.value = res.submission;
    return res.submission;
  }

  return { submission, fetchSubmission, updateIdentity, uploadDocument, removeDocument, submit, restart };
}
