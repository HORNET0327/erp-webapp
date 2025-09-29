// 권한 레벨 정의
export const PERMISSION_LEVELS = {
  USER: 1,
  LEAD_USER: 2,
  ADMIN: 3,
} as const;

export type PermissionLevel = keyof typeof PERMISSION_LEVELS;

// 역할 이름을 권한 레벨로 변환
export function getPermissionLevel(roleName: string): number {
  switch (roleName.toUpperCase()) {
    case "ADMIN":
      return PERMISSION_LEVELS.ADMIN;
    case "LEAD_USER":
      return PERMISSION_LEVELS.LEAD_USER;
    case "USER":
    default:
      return PERMISSION_LEVELS.USER;
  }
}

// 사용자가 특정 권한 레벨 이상인지 확인
export function hasPermission(
  userRoles: string[],
  requiredLevel: PermissionLevel
): boolean {
  const requiredPermissionLevel = PERMISSION_LEVELS[requiredLevel];

  return userRoles.some((role) => {
    const userPermissionLevel = getPermissionLevel(role);
    return userPermissionLevel >= requiredPermissionLevel;
  });
}

// 사용자가 관리자 권한을 가지고 있는지 확인
export function isAdmin(userRoles: string[]): boolean {
  return hasPermission(userRoles, "ADMIN");
}

// 사용자가 Lead User 이상의 권한을 가지고 있는지 확인
export function isLeadUserOrAbove(userRoles: string[]): boolean {
  return hasPermission(userRoles, "LEAD_USER");
}

// 사용자가 일반 사용자 권한만 가지고 있는지 확인
export function isRegularUser(userRoles: string[]): boolean {
  return !isLeadUserOrAbove(userRoles);
}
