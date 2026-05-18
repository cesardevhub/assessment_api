interface Project {
    id: number
    nombre_proyecto: string
    direccion: string
    aprobacion12cuotas: string | null
    tipo: string
    ubicacion: string
    estado: string
    created_at: string
    updated_at: string
}

interface PropertyImage {
    tipo: string
    url: string
    formato: string
}

export interface Property {
    id: number
    propiedad: string
    area: number
    tipo: string
    clase_tipo: string | null
    modelo: string | null
    ubicacion: string | null
    estado: string
    fin_de_obra: string | null
    fase: string | null
    bloqueo: string | null
    precio: number
    precio_sugerido: number
    proyectos_id: number
    habitaciones: number | null
    baños: number | null
    parqueos: number | null
    m2construccion: number | null
    largo: number | null
    ancho: number | null
    año: number | null
    titulo: string | null
    descripcion: string | null
    detalles: string | null
    descripcion_corta: string | null
    caracteristicas: string | null
    latitud: number | null
    longitud: number | null
    comision_referencia: string | null
    comision_directa: string | null
    created_at: string | null
    updated_at: string | null
    proyecto: Project
    imagenes: PropertyImage[]
}

interface PropertiesCacheState {
    data: Property[]
    updatedAt: Date | null
}

const state: PropertiesCacheState = {
    data: [],
    updatedAt: null
}

export const setPropertiesCache = (properties: Property[]) => {
    state.data = properties
    state.updatedAt = new Date()
}

export const getPropertiesCache = (): Property[] => state.data

export const getPropertiesCacheUpdatedAt = (): Date | null => state.updatedAt
