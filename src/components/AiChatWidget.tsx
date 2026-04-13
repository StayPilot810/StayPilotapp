import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, MessageCircle, Send, X } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { useAppPathname } from '../hooks/useAppPathname'
import { useStaypilotSessionLoggedIn } from '../hooks/useStaypilotSessionLoggedIn'
import { CONTACT_EMAIL } from '../i18n/contactPage'

type ChatTurn =
  | { role: 'assistant'; content: string }
  | { role: 'user'; content: string; imageDataUrl?: string }

const CHAT_PATH = '/api/chat'

async function compressImageToJpegDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image'))
      el.src = url
    })
    const maxW = 1280
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > maxW) {
      h = Math.round((h * maxW) / w)
      w = maxW
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function mapTurnsToApiPayload(messages: ChatTurn[]) {
  return messages.map((m) => {
    if (m.role === 'assistant') {
      return { role: 'assistant' as const, content: m.content }
    }
    if (m.imageDataUrl) {
      return {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: m.content },
          { type: 'image_url' as const, image_url: { url: m.imageDataUrl } },
        ],
      }
    }
    return { role: 'user' as const, content: m.content }
  })
}

export function AiChatWidget() {
  const { t, locale } = useLanguage()
  const pathname = useAppPathname()
  const sessionLoggedIn = useStaypilotSessionLoggedIn()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  const disabledByEnv = import.meta.env.VITE_AI_CHAT_ENABLED === 'false'
  const hideOnAuth = pathname === '/connexion' || pathname === '/inscription'

  const closePanel = useCallback(() => {
    setOpen(false)
    initialized.current = false
    setMessages([])
    setInput('')
    setPendingImage(null)
    setLoading(false)
  }, [])

  const onPickImage = useCallback(async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await compressImageToJpegDataUrl(file)
      setPendingImage(dataUrl)
    } catch {
      /* ignore invalid image */
    }
  }, [])

  useEffect(() => {
    if (!open || initialized.current) return
    initialized.current = true
    setMessages([{ role: 'assistant', content: t.aiChatWelcome }])
  }, [open, t.aiChatWelcome])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    const imageToSend = pendingImage
    if ((!text && !imageToSend) || loading) return

    const userText = text || t.aiChatImageOnlyPrompt
    const nextUser: ChatTurn = {
      role: 'user',
      content: userText,
      ...(imageToSend ? { imageDataUrl: imageToSend } : {}),
    }
    const history = [...messages, nextUser]
    setMessages(history)
    setInput('')
    setPendingImage(null)
    setLoading(true)
    try {
      const payload = {
        locale,
        messages: mapTurnsToApiPayload(history),
      }
      const res = await fetch(CHAT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string
        error?: string
        message?: string
      }
      if (!res.ok) {
        const isConfig = res.status === 503 || data.error === 'ai_not_configured'
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isConfig ? t.aiChatErrorUnavailable : data.message || t.aiChatErrorGeneric,
          },
        ])
        return
      }
      const replyText = typeof data.reply === 'string' ? data.reply.trim() : ''
      if (replyText) {
        setMessages((prev) => [...prev, { role: 'assistant', content: replyText }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: t.aiChatErrorGeneric }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t.aiChatErrorGeneric }])
    } finally {
      setLoading(false)
    }
  }, [
    input,
    pendingImage,
    loading,
    locale,
    messages,
    t.aiChatErrorGeneric,
    t.aiChatErrorUnavailable,
    t.aiChatImageOnlyPrompt,
  ])

  const canSend = !loading && (input.trim().length > 0 || Boolean(pendingImage))

  if (disabledByEnv || hideOnAuth || !sessionLoggedIn) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end sm:bottom-6 sm:right-6">
      {open ? (
        <div
          className="pointer-events-auto flex max-h-[min(32rem,72vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/15 sm:w-[24rem]"
          role="dialog"
          aria-label={t.aiChatTitle}
          onPaste={(e) => {
            const items = e.clipboardData?.items
            if (!items?.length) return
            for (let i = 0; i < items.length; i++) {
              const it = items[i]
              if (it?.kind === 'file' && it.type.startsWith('image/')) {
                e.preventDefault()
                const f = it.getAsFile()
                if (f) void onPickImage(f)
                return
              }
            }
          }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 bg-gradient-to-r from-[#4a86f7]/10 to-white px-4 py-3">
            <div>
              <p className="text-sm font-bold text-zinc-900">{t.aiChatTitle}</p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-600">{t.aiChatSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/40"
              aria-label={t.aiChatClose}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}-${m.role === 'user' ? m.imageDataUrl?.slice(0, 24) ?? '' : m.content.slice(0, 12)}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#4a86f7] text-white'
                      : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {m.role === 'user' && m.imageDataUrl ? (
                    <img
                      src={m.imageDataUrl}
                      alt=""
                      className="mb-2 max-h-36 w-full rounded-lg object-cover object-top"
                    />
                  ) : null}
                  <span className="whitespace-pre-wrap break-words">{m.content}</span>
                </div>
              </div>
            ))}
            {loading ? (
              <p className="text-xs text-zinc-500">{t.aiChatThinking}</p>
            ) : null}
          </div>

          <div className="border-t border-zinc-100 p-3">
            {pendingImage ? (
              <div className="relative mb-2 inline-block max-w-full">
                <img
                  src={pendingImage}
                  alt=""
                  className="max-h-24 rounded-lg border border-zinc-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-white shadow-md hover:bg-zinc-900"
                  aria-label={t.aiChatRemovePhoto}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  void onPickImage(f ?? null)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#4a86f7]/50 hover:bg-zinc-50 hover:text-[#4a86f7] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/35"
                aria-label={t.aiChatAttachPhoto}
                title={t.aiChatAttachPhoto}
              >
                <ImagePlus className="h-5 w-5" aria-hidden />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder={t.aiChatPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#4a86f7] focus:outline-none focus:ring-2 focus:ring-[#4a86f7]/25"
                maxLength={4000}
                autoComplete="off"
                aria-label={t.aiChatPlaceholder}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4a86f7] text-white transition-opacity hover:bg-[#3b76e8] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/45"
                aria-label={t.aiChatSend}
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] leading-snug text-zinc-400">{t.aiChatPastePhotoHint}</p>
            <p className="mt-1 text-center text-[11px] leading-snug text-zinc-500">{t.aiChatFooterHint}</p>
            <p className="mt-1 text-center text-[11px] text-zinc-500">
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-[#4a86f7] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="pointer-events-auto mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#4a86f7] text-white shadow-lg shadow-[#4a86f7]/35 transition-transform hover:scale-[1.03] hover:bg-[#3b76e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a86f7]/50 focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-label={open ? t.aiChatClose : t.aiChatFabLabel}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
      </button>
    </div>
  )
}
