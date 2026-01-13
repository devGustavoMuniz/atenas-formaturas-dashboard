"use client"

import { ProfileForm } from "@/components/profile/profile-form"

export default function ProfilePage() {
    return (
        <div className="container max-w-4xl py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações pessoais e preferências.
                </p>
            </div>
            <ProfileForm />
        </div>
    )
}
