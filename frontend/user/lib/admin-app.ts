const defaultAdminAppUrl = "http://localhost:3001"

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export function getAdminDashboardUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim()
  const adminAppUrl = configuredUrl ? trimTrailingSlash(configuredUrl) : defaultAdminAppUrl

  return `${adminAppUrl}/admin/dashboard`
}