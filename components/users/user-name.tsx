'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchUserById } from '@/lib/api/users-api'
import { Skeleton } from '@/components/ui/skeleton'

interface UserNameProps {
  userId: string
}

export function UserName({ userId }: UserNameProps) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  })

  if (isLoading) {
    return <Skeleton className="h-5 w-32" />
  }

  if (!user) {
    return <span className="text-muted-foreground">Usuário não encontrado</span>
  }

  return <span>{user.name}</span>
}
