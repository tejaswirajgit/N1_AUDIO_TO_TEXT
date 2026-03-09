import type React from "react"
import ResidentLayout from "@/components/ResidentLayout"

export default function ResidentRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ResidentLayout>{children}</ResidentLayout>
}
