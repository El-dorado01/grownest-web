import { SettingsDialog } from "@/components/settings-dialog"
import * as React from "react"

export default function Page() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SettingsDialog isPage={true} />
    </React.Suspense>
  )
}
