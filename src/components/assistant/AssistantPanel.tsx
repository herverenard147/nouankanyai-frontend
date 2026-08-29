import { useState } from 'react'
import type { FormEvent } from 'react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useAssistantContext, useAssistantReply } from '@/hooks/queries/useAssistantReply'
import { ApiError } from '@/lib/apiClient'
import type { Profile } from '@/types/domain'

interface AssistantPanelProps {
  profile: Profile
  onClose: () => void
}

interface ChatMessage {
  id: string
  from: 'assistant' | 'user'
  text: string
}

const INITIAL_MESSAGE = 'Bonjour, je suis l’assistant Nouankany. Posez-moi une question sur vos équipements.'

export function AssistantPanel({ profile, onClose }: AssistantPanelProps) {
  const contextQuery = useAssistantContext(profile)
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'initial', from: 'assistant', text: INITIAL_MESSAGE }])
  const [draft, setDraft] = useState('')
  const replyMutation = useAssistantReply(profile)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'user', text }])
    setDraft('')
    replyMutation.mutate(text, {
      onSuccess: (reply) => {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'assistant', text: reply }])
      },
      onError: (error) => {
        const text = error instanceof ApiError ? error.message : "Désolé, une erreur est survenue."
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'assistant', text }])
      },
    })
  }

  return (
    <div
      className="flex w-[306px] max-w-[calc(100vw-3.5rem)] flex-col gap-3 rounded-assistant border border-border bg-card p-4 shadow-assistant-panel"
      role="dialog"
      aria-label="Assistant Nouankany"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Assistant</h3>
          <p className="font-mono text-mono-axis text-text-tertiary">
            contexte : {contextQuery.data?.context ?? '…'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l'assistant"
          className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>
      </div>

      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-2xl px-3 py-2 text-sm ${
              message.from === 'assistant'
                ? 'self-start bg-bg-elevated text-text-primary'
                : 'self-end bg-accent-cta text-white'
            }`}
          >
            {message.text}
          </div>
        ))}
        {replyMutation.isPending && <p className="text-sm text-text-tertiary">L'assistant écrit…</p>}
      </div>

      <div className="flex items-center gap-2">
        <ProvenanceBadge value="synthetique" />
        <p className="text-xs text-text-tertiary">réponse basée sur le modèle</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Poser une question"
          aria-label="Poser une question à l'assistant"
          className="focus-ring min-h-11 min-w-0 flex-1 rounded-control border border-border bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
        />
        <button
          type="submit"
          className="focus-ring min-h-11 rounded-control bg-accent-cta px-4 py-2 text-sm font-semibold text-white hover:bg-accent-cta-hover"
        >
          Envoyer
        </button>
      </form>
    </div>
  )
}
