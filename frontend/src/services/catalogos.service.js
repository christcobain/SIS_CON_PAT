import axiosBienes from '../api/axiosBienes';


const buildCatalogoService = (slug) => ({
  listar: async (params = {}) => {
    const response = await axiosBienes.get(`/catalogos/${slug}/`, { params });
    return response.data;
  },
  obtener: async (id) => {
    const response = await axiosBienes.get(`/catalogos/${slug}/${id}/`);
    return response.data;
  },
  crear: async (data) => {
    const response = await axiosBienes.post(`/catalogos/${slug}/`, data);
    return response.data;
  },
  actualizar: async (id, data) => {
    const response = await axiosBienes.put(`/catalogos/${slug}/${id}/`, data);
    return response.data;
  },
  activar: async (id) => {
    const response = await axiosBienes.patch(`/catalogos/${slug}/${id}/activate/`);
    return response.data;
  },
  desactivar: async (id) => {
    const response = await axiosBienes.patch(`/catalogos/${slug}/${id}/deactivate/`);
    return response.data;
  },
});

const catalogosService = {
  categoriasBien:        buildCatalogoService('categoria-bien'),
  tiposBien:             buildCatalogoService('tipo-bien'),
  marcas:                buildCatalogoService('marca'),
  regimenTenencia:       buildCatalogoService('regimen-tenencia'),
  estadosBien:           buildCatalogoService('estado-bien'),
  estadosFuncionamiento: buildCatalogoService('estado-funcionamiento'),
  motivosBaja:           buildCatalogoService('motivo-baja'),
  motivosTransferencia:  buildCatalogoService('motivo-transferencia'),
  motivosCancelacion:    buildCatalogoService('motivo-cancelacion'),
  tiposComputadora:      buildCatalogoService('tipo-computadora'),
  tiposDisco:            buildCatalogoService('tipo-disco'),
  arquitecturasBits:     buildCatalogoService('arq-bits'),
  tiposMonitor:          buildCatalogoService('tipo-monitor'),
  tiposEscaner:          buildCatalogoService('tipo-escaner'),
  interfacesConexion:    buildCatalogoService('interfaz-conexion'),
  tiposImpresion:        buildCatalogoService('tipo-impresion'),
  tamanosCarro:          buildCatalogoService('tamano-carro'),
  tiposTarjetaVideo:     buildCatalogoService('tipo_tarjeta_video'),
};

export default catalogosService;