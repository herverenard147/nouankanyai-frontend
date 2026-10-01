import { Fragment } from 'react'

/**
 * Rendu minimal des réponses de l'Assistant : le système lui demande déjà de ne
 * jamais utiliser de markdown (voir system_prompt.jinja2, backend), mais un modèle
 * peut toujours en glisser malgré la consigne — ce composant est le filet de
 * sécurité côté frontend, pas le mécanisme principal. Gère seulement **gras** et
 * les puces "- ", sans dépendance markdown complète (inutile pour une bulle de
 * chat étroite, et ça éviterait d'afficher un tableau proprement de toute façon).
 */
export function AssistantMessageText({ text }: { text: string }) {
  const lines = text.split('\n').filter((line, i, arr) => !(line.trim() === '' && arr[i - 1]?.trim() === ''))

  return (
    <div className="flex flex-col gap-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (trimmed === '') return null
        const isBullet = /^[-*]\s+/.test(trimmed)
        const content = isBullet ? trimmed.replace(/^[-*]\s+/, '') : trimmed
        return (
          <p key={i} className={isBullet ? 'pl-3 before:mr-1.5 before:content-["•"]' : undefined}>
            {renderInlineBold(content)}
          </p>
        )
      })}
    </div>
  )
}

function renderInlineBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
