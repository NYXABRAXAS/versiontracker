export const MASTER_TYPE_CODES = {
  PRODUCT: "PRODUCT",
  ENVIRONMENT: "ENVIRONMENT",
  MODULE: "MODULE",
  RELEASE_TYPE: "RELEASE_TYPE",
  PRIORITY: "PRIORITY",
  SEVERITY: "SEVERITY",
  STATUS: "STATUS",
  DEPARTMENT: "DEPARTMENT",
  PROJECT: "PROJECT",
  BRANCH: "BRANCH",
  CLIENT: "CLIENT",
} as const;

export const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", module: "DASHBOARD" },
      { label: "Global Search", href: "/search", icon: "Search", module: "SEARCH" },
    ],
  },
  {
    title: "Releases",
    items: [
      { label: "Versions", href: "/versions", icon: "GitBranch", module: "VERSIONS" },
      { label: "Compare Versions", href: "/versions/compare", icon: "GitCompare", module: "COMPARISON" },
      { label: "Change Logs", href: "/change-logs", icon: "ListChecks", module: "CHANGE_LOGS" },
      { label: "Bug Fixes", href: "/bug-fixes", icon: "Bug", module: "BUG_FIXES" },
      { label: "Deployments", href: "/deployments", icon: "Rocket", module: "DEPLOYMENTS" },
      { label: "Release Calendar", href: "/calendar", icon: "CalendarDays", module: "CALENDAR" },
      { label: "Approvals", href: "/approvals", icon: "CircleCheck", module: "APPROVALS" },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Reports", href: "/reports", icon: "BarChart3", module: "REPORTS" }],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/admin/users", icon: "Users", module: "USERS" },
      { label: "Roles & Permissions", href: "/admin/roles-permissions", icon: "ShieldCheck", module: "ROLES" },
      { label: "Masters", href: "/admin/masters", icon: "Database", module: "MASTERS" },
      { label: "Announcements", href: "/admin/announcements", icon: "Megaphone", module: "ANNOUNCEMENTS" },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: "History", module: "AUDIT_LOGS" },
      { label: "Login History", href: "/admin/login-history", icon: "LogIn", module: "LOGIN_HISTORY" },
      { label: "Settings", href: "/admin/settings", icon: "Settings", module: "SETTINGS" },
    ],
  },
];
