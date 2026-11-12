import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import {
  buildUploadFileName,
  getUploadFileFromFormData,
  isImageFile,
  resolveImageContentType,
} from '@/lib/upload-image'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          message: 'Please set DATABASE_URL environment variable',
        },
        { status: 503 }
      )
    }

    const authCheck = await requireAuth()
    if (authCheck.error) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin login required to upload images' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = getUploadFileFromFormData(formData)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!isImageFile(file)) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum size is 10MB' }, { status: 400 })
    }

    const filePath = buildUploadFileName(file, 'matches')
    const contentType = resolveImageContentType(file)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const storage = supabase.storage.from('team-logos')
    const { data: uploadData, error: uploadError } = await storage.upload(filePath, buffer, {
      contentType,
      upsert: false,
    })

    if (uploadError) {
      console.error('Error uploading match image:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    const publicUrl =
      (uploadData as any)?.url || storage.getPublicUrl(filePath).data.publicUrl

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        path: filePath,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
