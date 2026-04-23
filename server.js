import Fastify from 'fastify'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { createCanvas } from '@napi-rs/canvas'
import sharp from 'sharp'
import JSZip from 'jszip'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

GlobalWorkerOptions.workerSrc = join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.mjs')

const PORT = process.env.PORT || 3000
const MAX_FILE_SIZE = 100 * 1024 * 1024
const RENDER_SCALE = 2.0

const NodeCanvasFactory = {
  create(width, height) {
    const canvas = createCanvas(width, height)
    return { canvas, context: canvas.getContext('2d') }
  },
  reset(canvasAndCtx, width, height) {
    canvasAndCtx.canvas.width = width
    canvasAndCtx.canvas.height = height
  },
  destroy(canvasAndCtx) {
    canvasAndCtx.canvas.width = 0
    canvasAndCtx.canvas.height = 0
    canvasAndCtx.canvas = null
    canvasAndCtx.context = null
  },
}

async function convertPdfToJpegs(pdfBuffer, baseName) {
  const pdfDoc = await getDocument({
    data: new Uint8Array(pdfBuffer),
    canvasFactory: NodeCanvasFactory,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const zip = new JSZip()

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: RENDER_SCALE })

    const width = Math.ceil(viewport.width)
    const height = Math.ceil(viewport.height)
    const { canvas, context } = NodeCanvasFactory.create(width, height)

    await page.render({ canvasContext: context, viewport }).promise

    const pngBuffer = canvas.toBuffer('image/png')
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer()

    const pad = String(pageNum).padStart(3, '0')
    zip.file(`${baseName}_page-${pad}.jpg`, jpegBuffer)

    page.cleanup()
    NodeCanvasFactory.destroy({ canvas, context })
  }

  return {
    zipBuffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } }),
    totalPages: pdfDoc.numPages,
  }
}

const server = Fastify({
  logger: { level: process.env.NODE_ENV === 'production' ? 'warn' : 'info' },
})

await server.register(multipart, { limits: { fileSize: MAX_FILE_SIZE } })

const distPath = join(__dirname, 'dist')
if (existsSync(distPath)) {
  await server.register(staticFiles, { root: distPath, prefix: '/' })
}

server.get('/api/health', async () => ({ status: 'ok' }))

server.post('/api/convert', async (request, reply) => {
  let fileData
  try {
    fileData = await request.file()
  } catch {
    return reply.status(400).send({ error: 'No file uploaded.' })
  }

  if (!fileData) return reply.status(400).send({ error: 'No file uploaded.' })
  if (fileData.mimetype !== 'application/pdf') return reply.status(400).send({ error: 'Only PDF files are accepted.' })

  let pdfBuffer
  try {
    pdfBuffer = await fileData.toBuffer()
  } catch {
    return reply.status(413).send({ error: 'File exceeds the 100 MB limit.' })
  }

  const baseName = (fileData.filename || 'document').replace(/\.pdf$/i, '')

  let result
  try {
    result = await convertPdfToJpegs(pdfBuffer, baseName)
  } catch (err) {
    server.log.error(err)
    return reply.status(422).send({ error: 'Failed to convert the PDF. Make sure it is a valid, non-encrypted file.' })
  }

  return reply
    .header('Content-Type', 'application/zip')
    .header('Content-Disposition', `attachment; filename="${baseName}_pages.zip"`)
    .header('X-Total-Pages', String(result.totalPages))
    .send(result.zipBuffer)
})

if (existsSync(distPath)) {
  server.setNotFoundHandler(async (_req, reply) => reply.sendFile('index.html'))
}

try {
  await server.listen({ port: Number(PORT), host: '0.0.0.0' })
  console.log(`✔  Server running on http://0.0.0.0:${PORT}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
