"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useDebounce } from "@/lib/hooks/use-debounce" // Assuming this exists or I'll create a simple one inside
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { fetchInstitutions } from "@/lib/api/institutions-api"

interface InstitutionFilterProps {
    value?: string
    onChange: (value: string | undefined) => void
}

export function InstitutionFilter({ value, onChange }: InstitutionFilterProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const debouncedSearch = useDebounce(search, 500)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["institutions-filter", debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await fetchInstitutions({
                page: pageParam,
                limit: 10,
                search: debouncedSearch,
            })
            return {
                data: res,
                nextPage: res.length === 10 ? pageParam + 1 : undefined,
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
    })

    // Flatten the pages
    const institutions = data?.pages.flatMap((page) => page.data) || []

    const selectedInstitution = institutions.find((i) => i.id === value) ||
        (value ? { id: value, name: "Carregando...", contractNumber: "" } : null) // Fallback if selected but not in list yet

    // Intersection Observer for infinite scroll
    const observerTarget = React.useRef(null)

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            { threshold: 1.0 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between sm:w-[300px]"
                >
                    <span className="truncate">
                        {value
                            ? institutions.find((i) => i.id === value)
                                ? `${institutions.find((i) => i.id === value)?.contractNumber} - ${institutions.find((i) => i.id === value)?.name}`
                                : "Carregando..."
                            : "Filtrar por contrato..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar contrato..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>Nenhum contrato encontrado.</CommandEmpty>
                        <CommandGroup>
                            {institutions.map((institution) => (
                                <CommandItem
                                    key={institution.id}
                                    value={institution.id}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? undefined : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === institution.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {institution.contractNumber} - {institution.name}
                                </CommandItem>
                            ))}
                            {hasNextPage && (
                                <div ref={observerTarget} className="py-2 text-center text-sm text-muted-foreground">
                                    {isFetchingNextPage ? "Carregando mais..." : "Carregar mais"}
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
