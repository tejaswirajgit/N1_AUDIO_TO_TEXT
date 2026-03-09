"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"

interface Project {
  id: string
  name: string
  color: string
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [projects, setProjects] = useState<Project[]>([
    { id: "1", name: "Event Planning", color: "bg-pink-200" },
    { id: "2", name: "Breakfast Plan", color: "bg-green-200" },
  ])

  const handleAddProject = (project: Omit<Project, "id">) => {
    const newProject = {
      ...project,
      id: Date.now().toString(),
    }
    setProjects([...projects, newProject])
  }

  // Avoid showing the dashboard shell on "/" and auth pages while redirects run.
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/resident")) {
    return <>{children}</>
  }

  return (
    <DashboardLayout projects={projects} onAddProject={handleAddProject}>
      {children}
    </DashboardLayout>
  )
}
