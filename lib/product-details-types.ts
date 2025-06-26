export interface AlbumDetails {
  minPhoto: number;
  maxPhoto: number;
  valorEncadernacao: number;
  valorFoto: number;
}

export interface EventConfiguration {
  id: string; // Este será o ID do evento da instituição
  minPhotos?: number;
  valorPhoto?: number;
  date?: string; // Incluído conforme a interface
  valorPack?: number;
}

export interface GenericDetails {
  isAvailableUnit?: boolean;
  events: EventConfiguration[];
}

export interface DigitalFilesDetails {
  isAvailableUnit: boolean;
  events?: EventConfiguration[];
  valorPackTotal?: number;
  // Os outros campos foram removidos para seguir a estrutura de 'events'
}