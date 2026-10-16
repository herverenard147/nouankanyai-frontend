import { useEffect, useState } from 'react'

import { useReducedMotion } from '@/components/boitier/useReducedMotion'

interface PhotoSliderProps {
  images: string[]
  label: string
  /** Décalage du premier glissement : chaque bloc de la page défile à son propre rythme. */
  offsetMs?: number
  intervalMs?: number
}

/**
 * Diaporama qui glisse de droite à gauche, sans fondu : l'image qui part sort à gauche pendant que la suivante
 * entre par la droite, aucune zone vide entre les deux. Reste sur la première image si la personne préfère
 * moins de mouvement.
 */
export function PhotoSlider({ images, label, offsetMs = 0, intervalMs = 3500 }: PhotoSliderProps) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const count = images.length

  useEffect(() => {
    if (reduced || count < 2) return
    let id = 0
    const next = () => setIndex((i) => Math.min(i + 1, count))
    const first = window.setTimeout(() => {
      next()
      id = window.setInterval(next, intervalMs)
    }, intervalMs + offsetMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [reduced, count, intervalMs, offsetMs])

  // La bande porte une copie de la première image à la fin : après la dernière, on glisse sur la copie puis on revient
  // au début sans transition, pour que le défilement aille toujours de droite à gauche.
  const strip = count > 1 ? [...images, images[0]!] : images
  const [animate, setAnimate] = useState(true)
  useEffect(() => {
    if (animate) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [animate])
  useEffect(() => {
    if (count < 2 || index !== count) return
    const id = window.setTimeout(() => {
      setAnimate(false)
      setIndex(0)
    }, 650)
    return () => window.clearTimeout(id)
  }, [index, count])

  return (
    <div className="absolute inset-0 overflow-hidden" role="img" aria-label={label}>
      <div
        className={`flex h-full ${animate ? 'transition-transform duration-[600ms] ease-out' : ''}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {strip.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="" aria-hidden="true" className="h-full w-full shrink-0 object-cover" />
        ))}
      </div>
      {count > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5" aria-hidden="true">
          {images.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 w-1.5 rounded-full bg-white transition-opacity duration-300 ${i === index % count ? 'opacity-100' : 'opacity-40'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
