import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { pdfToImg } from 'pdf-to-img'
import sharp from 'sharp'
import JSZip from 'jszip'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3000
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

// ── Multipart (file upload) ────────────────────────────────────────────────
await server.register(multipart, {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
})

// ── Static files (serve built React app in production) ────────────────────
const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  await server.register(staticFiles, {
    root: distPath,
    prefix: '/',
  })
}

// ── Health check ──────────────────────────────────────────────────────────
server.get('/api/health', async () => ({ status: 'ok' }))

// ── PDF → JPEG conversion endpoint ────────────────────────────────────────
server.post('/api/convert', async (request, reply) => {
  let fileData

  try {
    fileData = await request.file()
  } catch {
    return reply.status(400).send({ error: 'No file uploaded.' })
  }

  if (!fileData) {
    return reply.status(400).send({ error: 'No file uploaded.' })
  }

  const mimetype = fileData.mimetype
  if (mimetype !== 'application/pdf') {
    return reply.status(400).send({ error: 'Only PDF files are accepted.' })
  }

  let pdfBuffer
  try {
    pdfBuffer = await fileData.toBuffer()
  } catch {
    return reply.status(413).send({ error: 'File exceeds the 100 MB limit.' })
  }

  const originalName = fileData.filename.replace(/\.pdf$/i, '') || 'document'

  let pages
  try {
    pages = await pdfToImg(pdfBuffer, {
      scale: 2.0, // 2x scale → ~144 dpi equivalent for good quality
    })
  } catch (err) {
    server.log.error(err)
    return reply.status(422).send({
      error: 'Failed to parse the PDF. Make sure it is a valid, non-encrypted PDF.',
    })
  }

  const zip = new JSZip()
  let pageNumber = 1

  for await (const pngBuffer of pages) {
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer()

    const paddedNum = String(pageNumber).padStart(3, '0')
    zip.file(`${originalName}_page-${paddedNum}.jpg`, jpegBuffer)
    pageNumber++
  }

  const totalPages = pageNumber - 1
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  reply
    .header('Content-Type', 'application/zip')
    .header(
      'Content-Disposition',
      `attachment; filename="${originalName}_pages.zip"`,
    )
    .header('X-Total-Pages', String(totalPages))
    .send(zipBuffer)
})

// ── SPA fallback (serve index.html for all non-API routes) ───────────────
if (existsSync(distPath)) {
  server.setNotFoundHandler(async (_request, reply) => {
    return reply.sendFile('index.html')
  })
}

// ── Start ─────────────────────────────────────────────────────────────────
try {
  await server.listen({ port: Number(PORT), host: '0.0.0.0' })
  console.log(`✔  Server running on http://0.0.0.0:${PORT}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
