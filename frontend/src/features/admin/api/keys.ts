/** Query-key factories for the administration feature (mirrors the playbook). */
export const adminKeys = {
  all: ['admin'] as const,
  reviewQueue: () => ['admin', 'profile-review-queue'] as const,
};

export const usersKeys = {
  all: ['admin', 'users'] as const,
  list: () => ['admin', 'users', 'list'] as const,
  detail: (id: string) => ['admin', 'users', 'detail', id] as const,
};

export const rolesKeys = {
  all: ['admin', 'roles'] as const,
  list: () => ['admin', 'roles', 'list'] as const,
  detail: (id: string) => ['admin', 'roles', 'detail', id] as const,
};

/** The RBAC catalogue (modules + permissions) — the matrix axes; rarely changes. */
export const rbacKeys = {
  modules: () => ['admin', 'rbac', 'modules'] as const,
  permissions: () => ['admin', 'rbac', 'permissions'] as const,
};
