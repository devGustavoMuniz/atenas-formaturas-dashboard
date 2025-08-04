import { render, screen } from '@testing-library/react'
import { SelectionSummary } from './selection-summary'
import { useProductSelectionStore } from '@/lib/store/product-selection-store'
import { formatCurrency } from '@/lib/utils'

// Mock the Zustand store
jest.mock('@/lib/store/product-selection-store', () => ({
  useProductSelectionStore: jest.fn(),
}))

// Mock formatCurrency for consistent test results
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'), // Keep other utils functions
  formatCurrency: jest.fn((value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`),
}))

const mockUseProductSelectionStore = useProductSelectionStore as jest.Mock

describe('SelectionSummary', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseProductSelectionStore.mockClear()
    ;(formatCurrency as jest.Mock).mockClear()
    // Set default mock implementation for formatCurrency
    ;(formatCurrency as jest.Mock).mockImplementation((value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`)
  })

  it('should render "Resumo da Seleção" title', () => {
    mockUseProductSelectionStore.mockReturnValue({
      product: { flag: 'GENERIC' },
      institutionProduct: {},
      selectedEvents: {},
      isPackageComplete: false,
      selectedPhotos: {},
    })

    render(<SelectionSummary selectedPhotosCount={0} eventGroups={[]} />)
    expect(screen.getByText('Resumo da Seleção')).toBeInTheDocument()
  })

  // Test for GENERIC product flag
  describe('when product flag is GENERIC', () => {
    const mockEventGroups = [
      {
        eventId: 'event1',
        photos: [{ id: 'photo1' }, { id: 'photo2' }, { id: 'photo3' }],
      },
      {
        eventId: 'event2',
        photos: [{ id: 'photo4' }, { id: 'photo5' }],
      },
    ]

    const mockInstitutionProductGeneric = {
      details: {
        events: [
          { id: 'event1', name: 'Formatura A', minPhotos: 2, valorPhoto: 10.00 },
          { id: 'event2', name: 'Formatura B', minPhotos: 3, valorPhoto: 15.00 },
        ],
      },
    }

    it('should display generic summary with selected photos count', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'GENERIC' },
        institutionProduct: mockInstitutionProductGeneric,
        selectedEvents: {},
        isPackageComplete: false,
        selectedPhotos: { photo1: true, photo2: true, photo4: true }, // 3 selected photos
      })

      render(<SelectionSummary selectedPhotosCount={3} eventGroups={mockEventGroups} />)

      expect(screen.getByText('Fotos selecionadas: 3')).toBeInTheDocument()
      expect(screen.getByText('Regras por Evento:')).toBeInTheDocument()
      expect(screen.getByText('Formatura A')).toBeInTheDocument()
      expect(screen.getByText('Mínimo de fotos: 2 (Selecionadas: 2)')).toBeInTheDocument()
      expect(screen.getByText('Valor por foto extra: R$ 10,00')).toBeInTheDocument()
      expect(screen.getByText('Formatura B')).toBeInTheDocument()
      expect(screen.getByText('Mínimo de fotos: 3 (Selecionadas: 1)')).toBeInTheDocument()
      expect(screen.getByText('(2 restantes)')).toBeInTheDocument() // For event B
    })

    it('should not display event summary if no photos are selected for that event', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'GENERIC' },
        institutionProduct: mockInstitutionProductGeneric,
        selectedEvents: {},
        isPackageComplete: false,
        selectedPhotos: { photo1: true }, // Only photo1 selected for event1
      })

      render(<SelectionSummary selectedPhotosCount={1} eventGroups={mockEventGroups} />)

      expect(screen.getByText('Formatura A')).toBeInTheDocument()
      expect(screen.queryByText('Formatura B')).not.toBeInTheDocument() // Event B should not be rendered
    })
  })

  // Test for DIGITAL_FILES product flag (Package mode)
  describe('when product flag is DIGITAL_FILES in package mode', () => {
    const mockInstitutionProductDigitalFilesPackage = {
      details: {
        isAvailableUnit: false,
        valorPackTotal: 500.00,
        events: [
          { id: 'event1', name: 'Pacote Evento A', valorPack: 100.00 },
          { id: 'event2', name: 'Pacote Evento B', valorPack: 200.00 },
        ],
      },
    }

    it('should display package summary when package is complete', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'DIGITAL_FILES' },
        institutionProduct: mockInstitutionProductDigitalFilesPackage,
        selectedEvents: {},
        isPackageComplete: true,
        selectedPhotos: {},
      })

      render(<SelectionSummary selectedPhotosCount={0} eventGroups={[]} />)

      expect(screen.getByText('Resumo do Pacote:')).toBeInTheDocument()
      expect(screen.getByText('Pacote Completo')).toBeInTheDocument()
      expect(screen.getByText('Todos os eventos incluídos.')).toBeInTheDocument()
      expect(screen.getByText('Total: R$ 500,00')).toBeInTheDocument()
    })

    it('should display selected individual packages when package is not complete', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'DIGITAL_FILES' },
        institutionProduct: mockInstitutionProductDigitalFilesPackage,
        selectedEvents: { event1: true }, // Only event1 package selected
        isPackageComplete: false,
        selectedPhotos: {},
      })

      render(<SelectionSummary selectedPhotosCount={0} eventGroups={[]} />)

      expect(screen.getByText('Resumo do Pacote:')).toBeInTheDocument()
      expect(screen.getByText('Pacote Evento A')).toBeInTheDocument()
      expect(screen.getByText('Valor: R$ 100,00')).toBeInTheDocument()
      expect(screen.queryByText('Pacote Evento B')).not.toBeInTheDocument()
      expect(screen.getByText('Total: R$ 100,00')).toBeInTheDocument() // Only event1 selected
    })
  })

  // Test for ALBUM product flag
  describe('when product flag is ALBUM', () => {
    const mockInstitutionProductAlbum = {
      details: {
        minPhoto: 10,
        maxPhoto: 50,
        valorEncadernacao: 100.00,
        valorFoto: 5.00,
      },
    }

    it('should display album summary with correct photo counts and total', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'ALBUM' },
        institutionProduct: mockInstitutionProductAlbum,
        selectedEvents: {},
        isPackageComplete: false,
        selectedPhotos: {},
      })

      render(<SelectionSummary selectedPhotosCount={15} eventGroups={[]} />)

      expect(screen.getByText('Regras do Álbum:')).toBeInTheDocument()
      expect(screen.getByText('Quantidade de Fotos')).toBeInTheDocument()
      expect(screen.getByText('Mínimo: 10 / Máximo: 50')).toBeInTheDocument()
      expect(screen.getByText('Selecionadas: 15')).toBeInTheDocument()
      expect(screen.getByText('Custo')).toBeInTheDocument()
      expect(screen.getByText('Encadernação: R$ 100,00')).toBeInTheDocument()
      expect(screen.getByText('Valor por Foto: R$ 5,00')).toBeInTheDocument()
      expect(screen.getByText('Total: R$ 175,00')).toBeInTheDocument() // 100 + (15 * 5) = 175
    })

    it('should display remaining photos message when selected photos are less than minPhoto', () => {
      mockUseProductSelectionStore.mockReturnValue({
        product: { flag: 'ALBUM' },
        institutionProduct: mockInstitutionProductAlbum,
        selectedEvents: {},
        isPackageComplete: false,
        selectedPhotos: {},
      })

      render(<SelectionSummary selectedPhotosCount={5} eventGroups={[]} />)

      expect(screen.getByText('(5 restantes)')).toBeInTheDocument() // 10 - 5 = 5
    })
  })
})
