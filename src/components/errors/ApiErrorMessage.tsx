import { Link } from 'react-router-dom'

interface ApiErrorMessageProps {
  message: string
  className?: string
}

// Libellé lisible pour chaque chemin interne que ces messages peuvent
// contenir — jamais l'URL brute affichée à l'utilisateur.
const LINK_LABELS: { pattern: RegExp; label: string }[] = [
  { pattern: /^\/demander-un-audit/, label: 'Demander un audit' },
  { pattern: /^\/contact$/, label: 'Nous contacter' },
]

function labelFor(path: string): string {
  return LINK_LABELS.find((l) => l.pattern.test(path))?.label ?? path
}

/**
 * Affiche un message d'erreur backend en rendant cliquable le lien interne
 * qu'il contient éventuellement — les messages de quota d'essai gratuit
 * (voir app/api/v1/demo/limits.py, backend) se terminent toujours par
 * " : /chemin". Le lien s'affiche avec un libellé lisible (ex: "Demander un
 * audit"), jamais l'URL brute.
 */
export function ApiErrorMessage({ message, className }: ApiErrorMessageProps) {
  const match = message.match(/^(.*:\s)(\/\S+)$/)
  if (!match) return <p className={className}>{message}</p>

  const [, prefix, path] = match
  return (
    <p className={className}>
      {prefix}
      <Link to={path} className="underline hover:no-underline">
        {labelFor(path)}
      </Link>
    </p>
  )
}
