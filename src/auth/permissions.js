export const ROLES = {
  RECEPTION: "Reception",
  ACCOUNTS: "Accounts Staff",
  MANAGER: "Manager",
  FINANCE: "Finance Team",
  AUDITOR: "Auditor",
};

export const PERMISSIONS = {
  DASHBOARD: "dashboard:view",
  USER_MANAGEMENT: "users:manage",
  UPLOAD_BILL: "bills:upload",
  BILLS_LIST: "bills:list",
  APPROVAL_WORKFLOW: "workflow:act",
  BILL_STATUS: "status:view",
  AUDIT_TRAIL: "audit:view",
};

const rolePermissionMap = {
  [ROLES.RECEPTION]: [
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.ACCOUNTS]: [
    PERMISSIONS.DASHBOARD,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.USER_MANAGEMENT,
  ],
  [ROLES.FINANCE]: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.USER_MANAGEMENT,
  ],
  [ROLES.AUDITOR]: [
    PERMISSIONS.DASHBOARD,
  ],
};

export function hasPermission(role, permission) {
  return rolePermissionMap[role]?.includes(permission) ?? false;
}

export const roleOptions = Object.values(ROLES);
