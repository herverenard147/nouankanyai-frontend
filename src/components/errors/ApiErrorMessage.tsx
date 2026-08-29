import { Link } from 'react-router-dom'

interface ApiErrorMessageProps {
  message: string
  className?: string
}

/**
 * Affiche un message d'erreur backend en rendant cliquable le lien interne
 * qu'il contient éventuellement — les messages de quota d'essai gratuit
 * (voir app/api/v1/demo/limits.py, backend) se terminent toujours par
 * " : /chemin", jamais utile à afficher comme texte brut non cliquable.
 */
export function ApiErrorMessage({ message, className }: ApiErrorMessageProps) {
  const match = message.match(/^(.*:\s)(\/\S+)$/)
  if (!match) return <p className={className}>{message}</p>

  const [, prefix, path] = match
  return (
    <p className={className}>
      {prefix}
      <Link to={path} className="underline hover:no-underline">
        {path}
      </Link>
    </p>
  )
}
