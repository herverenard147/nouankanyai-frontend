import { UploadCard } from '@/components/upload/UploadCard'
import { MutationError } from '@/components/ui/Modal'
import { useExtractMachinePhoto } from '@/hooks/queries/useMachineCrud'
import type { BackendMachinePhotoExtraction } from '@/types/backend'

interface MachinePhotoCaptureProps {
  onExtracted: (extracted: BackendMachinePhotoExtraction['extracted'], photoDataUrl: string) => void
}

/**
 * Capture + reconnaissance photo d'un appareil, pour pré-remplir le formulaire d'ajout
 * (MachineFormDrawer). Ne crée jamais la machine elle-même : voir app/ai/machine_vision.py
 * côté backend (« n'invente aucune valeur »).
 */
export function MachinePhotoCapture({ onExtracted }: MachinePhotoCaptureProps) {
  const extractMutation = useExtractMachinePhoto()

  function handleFileSelected(file: File) {
    extractMutation.mutate(file, {
      onSuccess: (data) => onExtracted(data.extracted, data.photo_data_url),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <UploadCard
        title="Photo de l'appareil"
        caption="Prenez une photo nette de l'appareil ou de sa plaque signalétique"
        onFileSelected={handleFileSelected}
        isUploading={extractMutation.isPending}
        buttonLabel="Prendre une photo"
        busyLabel="Analyse en cours…"
      />
      <MutationError error={extractMutation.error} />
    </div>
  )
}
