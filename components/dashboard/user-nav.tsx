"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/use-auth"
import { useRouter } from "next/navigation"
import { User, LogOut, CircleHelp } from "lucide-react"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleProfileClick = () => {
    router.push("/client/profile")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="user-menu-trigger" variant="ghost" className="relative h-9 w-9 rounded-full text-zinc-300 hover:bg-white/5 hover:text-yellow-300">
          <Avatar className="h-8 w-8 ring-1 ring-yellow-400/25">
            <AvatarImage src={user?.profileImage || "/placeholder.svg"} alt={user?.name || "User"} />
            <AvatarFallback className="bg-zinc-900 text-yellow-300">{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-zinc-800 bg-zinc-950 text-zinc-100" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "Usuário"}</p>
            <p className="text-xs leading-none text-zinc-400">{user?.email || "usuario@exemplo.com"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        {user?.role === "client" && (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer focus:bg-white/5 focus:text-yellow-300">
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        {user?.role === "client" && <DropdownMenuSeparator className="bg-zinc-800" />}
        <DropdownMenuItem onClick={() => (window as any).startClientTour?.()} className="cursor-pointer focus:bg-white/5 focus:text-yellow-300">
          <CircleHelp className="mr-2 h-4 w-4" />
          Tutorial
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-500/10 focus:text-red-300">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
