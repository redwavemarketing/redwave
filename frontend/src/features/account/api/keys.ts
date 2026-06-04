/** Query-key factory for the account feature (mirrors the Sales/Dashboards playbook). */
export const accountKeys = {
  all: ['account'] as const,
  profile: () => ['account', 'profile'] as const,
  myRequests: () => ['account', 'my-requests'] as const,
};
