import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )
}
