export async function getCurrentUser() {
  return { id: 'local-user', email: 'local@vision.local' }
}

export async function getCurrentUserId() {
  return 'local-user'
}
