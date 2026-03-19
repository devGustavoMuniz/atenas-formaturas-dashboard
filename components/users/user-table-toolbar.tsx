"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"

import { InstitutionFilter } from "./institution-filter"

interface UserTableToolbarProps {
  onSearchChange: (search: string) => void
  onInstitutionChange: (institutionId: string | undefined) => void
}

export function UserTableToolbar({ onSearchChange, onInstitutionChange }: UserTableToolbarProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearchChange(value)
  }

  const handleInstitutionChange = (value: string | undefined) => {
    setInstitutionId(value)
    onInstitutionChange(value)
  }

  return (
    <div className="flex flex-col gap-4 rounded-md p-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:w-auto">
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuários..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <InstitutionFilter value={institutionId} onChange={handleInstitutionChange} />
      </div>
      <Button onClick={() => router.push("/users/new")} className="bg-yellow-500 text-black hover:bg-yellow-400">
        <Plus className="mr-2 h-4 w-4" />
        Novo Usuário
      </Button>
    </div>
  )
}
