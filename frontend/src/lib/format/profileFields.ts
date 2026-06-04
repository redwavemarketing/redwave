/** Display labels for the HR fields that flow through profile-change requests. Shared by My Account
 *  (pending banner) and the review queue (current-vs-proposed). */
export const PROFILE_FIELD_LABEL: Record<string, string> = {
  full_name: 'Full name',
  phone: 'Phone',
  avatar_url: 'Avatar URL',
};

export function profileFieldLabel(key: string): string {
  return PROFILE_FIELD_LABEL[key] ?? key;
}
