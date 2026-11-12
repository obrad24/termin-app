const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'heic',
  'heif',
  'avif',
])

export function isImageFile(file: File) {
  if (file.type && file.type.startsWith('image/')) return true
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return IMAGE_EXTENSIONS.has(ext)
}

export function resolveImageContentType(file: File) {
  if (file.type && file.type.startsWith('image/')) return file.type
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'svg') return 'image/svg+xml'
  if (ext === 'bmp') return 'image/bmp'
  if (ext === 'avif') return 'image/avif'
  if (ext === 'heic' || ext === 'heif') return 'image/heic'
  return 'application/octet-stream'
}

export function buildUploadFileName(file: File, folder: string) {
  const fileExt =
    (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  return `${folder}/${fileName}`
}

export function getUploadFileFromFormData(formData: FormData, field = 'file') {
  const raw = formData.get(field)
  if (!raw || typeof raw === 'string') return null
  return raw as File
}
