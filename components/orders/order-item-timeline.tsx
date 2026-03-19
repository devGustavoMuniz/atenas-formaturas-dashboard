'use client'

import {
  Package,
  Camera,
  Wrench,
  Truck,
  PackageCheck,
  Send,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { FulfillmentStatus, OrderItemDto } from '@/lib/order-types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface StepConfig {
  status: FulfillmentStatus
  label: string
  subtitle: string
  icon: React.ElementType
}

const ALBUM_GENERIC_STEPS: StepConfig[] = [
  { status: 'ORDER_RECEIVED',       label: 'Pedido Recebido',       subtitle: 'Separando as fotos',        icon: Package },
  { status: 'PHOTOS_SEPARATED',     label: 'Fotos Separadas',        subtitle: 'Confeccionando o produto',  icon: Camera },
  { status: 'PRODUCT_MANUFACTURED', label: 'Produto Confeccionado',  subtitle: 'Preparando para entrega',   icon: Wrench },
  { status: 'IN_TRANSIT',           label: 'Produto em Rota',        subtitle: 'Entregando',                icon: Truck },
  { status: 'DELIVERED',            label: 'Entregue',               subtitle: '',                          icon: PackageCheck },
]

const DIGITAL_FILES_STEPS: StepConfig[] = [
  { status: 'ORDER_RECEIVED',   label: 'Pedido Recebido',  subtitle: 'Separando fotos',          icon: Package },
  { status: 'PHOTOS_SEPARATED', label: 'Fotos Separadas',  subtitle: 'Preparando para envio',    icon: Camera },
  { status: 'SENT',             label: 'Enviada',           subtitle: '',                         icon: Send },
]

function getSteps(productType: OrderItemDto['productType']): StepConfig[] {
  return productType === 'DIGITAL_FILES' ? DIGITAL_FILES_STEPS : ALBUM_GENERIC_STEPS
}

interface OrderItemTimelineProps {
  item: OrderItemDto
  onStatusChange?: (itemId: string, status: FulfillmentStatus) => void
  isLoading?: boolean
}

export function OrderItemTimeline({ item, onStatusChange, isLoading }: OrderItemTimelineProps) {
  const steps = getSteps(item.productType)
  const currentIndex = steps.findIndex(s => s.status === item.fulfillmentStatus)
  const currentStep = steps[currentIndex]
  const nextStep = steps[currentIndex + 1]
  const isCompleted = currentIndex === steps.length - 1

  const handleAdvance = () => {
    if (nextStep && onStatusChange && !isLoading) {
      onStatusChange(item.id, nextStep.status)
    }
  }

  return (
    <div className="space-y-3">
      {/* Step track */}
      <div className="relative">
        {/* Circles row — justify-between so edges align with container */}
        <div className="relative flex justify-between items-center">
          {/* Background track line (inset by half a circle = 18px = ~1.125rem) */}
          <div className="absolute top-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/15 h-[2px]"
            style={{ left: '1.125rem', right: '1.125rem' }} />
          {/* Progress fill */}
          {currentIndex > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-primary h-[2px] transition-all duration-500"
              style={{
                left: '1.125rem',
                width: isCompleted
                  ? 'calc(100% - 2.25rem)'
                  : `calc(${(currentIndex / (steps.length - 1)) * 100}% - 2.25rem)`,
              }}
            />
          )}

          {steps.map((step, index) => {
            const StepIcon = step.icon
            const done = index < currentIndex || (isCompleted && index === currentIndex)
            const active = !isCompleted && index === currentIndex
            const future = index > currentIndex

            return (
              <div
                key={step.status}
                className={cn(
                  'relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200',
                  done   && 'bg-primary text-primary-foreground shadow-sm',
                  active && 'bg-primary/10 border-2 border-primary text-primary ring-4 ring-primary/10',
                  future && 'bg-background border-2 border-muted-foreground/20 text-muted-foreground/40'
                )}
              >
                {done
                  ? <Check className="h-4 w-4" strokeWidth={2.5} />
                  : <StepIcon className="h-4 w-4" strokeWidth={1.75} />
                }
              </div>
            )
          })}
        </div>

        {/* Labels row — absolutely positioned at same % as circles, hidden on mobile */}
        <div className="relative mt-2 h-7 md:block hidden">
          {steps.map((step, index) => {
            const done = index < currentIndex || (isCompleted && index === currentIndex)
            const active = !isCompleted && index === currentIndex
            const isFirst = index === 0
            const isLast = index === steps.length - 1
            const percent = (index / (steps.length - 1)) * 100

            return (
              <span
                key={step.status}
                className={cn(
                  'absolute text-[10px] leading-tight font-medium max-w-[72px]',
                  isFirst ? 'text-left' : isLast ? 'text-right' : 'text-center',
                  active ? 'text-primary font-semibold' : done ? 'text-muted-foreground' : 'text-muted-foreground/40'
                )}
                style={{
                  left: `${percent}%`,
                  transform: isFirst ? 'none' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {step.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Current status banner + action */}
      <div className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2.5 gap-2 min-w-0',
        isCompleted
          ? 'bg-primary/10 border border-primary/20'
          : 'bg-muted/60 border border-border'
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          {(() => {
            const Icon = currentStep?.icon ?? Package
            return (
              <div className={cn(
                'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                isCompleted ? 'bg-primary/20 text-primary' : 'bg-background text-foreground border border-border'
              )}>
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </div>
            )
          })()}
          <div className="min-w-0">
            <p className={cn(
              'text-xs font-semibold leading-tight',
              isCompleted ? 'text-primary' : 'text-foreground'
            )}>
              {currentStep?.label}
            </p>
            {currentStep?.subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                {currentStep.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Advance button — admin only */}
        {onStatusChange && nextStep && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdvance}
            disabled={isLoading}
            className="flex-shrink-0 h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                {nextStep.label}
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </Button>
        )}

        {onStatusChange && isCompleted && (
          <span className="text-xs text-primary font-medium flex-shrink-0">Concluído</span>
        )}
      </div>
    </div>
  )
}
