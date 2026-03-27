import io
import logging
from pathlib import Path
from django.conf import settings
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, Image, HRFlowable,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, String, Rect
from shared.clients import MsUsuariosClient

logger = logging.getLogger(__name__)

# ── NUEVA PALETA DE COLORES (MEJORADO) ──────────────────────────────────────────
GUINDA_PJ       = colors.HexColor('#9D1A23')  # Color institucional (del logo)
GRIS_CABECERA   = colors.HexColor('#F2F2F2')  # Gris muy claro para fondo cabecera
GRIS_TEXTO_HDR  = colors.HexColor('#4A4A4A')  # Gris oscuro para texto cabecera
GRIS_SUBTEXTO   = colors.HexColor('#6B6B6B')  # Gris medio para subtexto
AZUL_SELLO_STAMP = colors.HexColor('#00318C') # Azul para sello manual de oficina
BLANCO          = colors.white
NEGRO           = colors.black


# ── LOGO PATH ─────────────────────────────────────────────────────────────────

def _logo_path() -> str | None:
    base = Path(getattr(settings, 'BASE_DIR', ''))
    for p in [
        base / 'static'      / 'img' / 'pj_logo.png', # Ruta configurada para el nuevo logo
        base / 'staticfiles' / 'img' / 'pj_logo.png',
        base / 'assets'               / 'pj_logo.png',
    ]:
        if p.exists():
            return str(p)
    return None


# ── STAMPS MEJORADOS DE V°B° (TIPO SELLO MANUAL) ────────────────────────────────

def _sello_manual(label: str, aprobado: bool, size_h: float = 3.5 * cm, size_v: float = 1.6 * cm) -> Drawing:
    """Sello rectangular: azul 'estampado' con label, V°B°, ✓ o — y borde."""
    d  = Drawing(size_h, size_v)
    cx = size_h / 2
    cy_mid = size_v / 2
    
    # Borde Rectangular
    border = Rect(0, 0, size_h, size_v, rx=2, ry=2)
    border.fillColor   = BLANCO
    border.strokeColor = AZUL_SELLO_STAMP
    border.strokeWidth = 1.6  # Borde más grueso tipo sello
    d.add(border)

    # Label del Sello
    d.add(String(cx, size_v - 0.4 * cm, label.upper(),
                 fontName='Helvetica-Bold', fontSize=7.5,
                 fillColor=AZUL_SELLO_STAMP, textAnchor='middle'))

    # V°B°
    d.add(String(cx, cy_mid + 0.1 * cm, 'V°B°',
                 fontName='Helvetica-Bold', fontSize=9,
                 fillColor=AZUL_SELLO_STAMP, textAnchor='middle'))

    # ✓ o — Según Estado
    check_char = '✓' if aprobado else '—'
    check_y = cy_mid - 0.4 * cm
    d.add(String(cx, check_y, check_char,
                 fontName='Helvetica-Bold', fontSize=10,
                 fillColor=AZUL_SELLO_STAMP, textAnchor='middle'))
    
    if aprobado:
        pass

    return d


# ── HELPERS PDF, WRAPPERS Y ESTILOS MEJORADOS ───────────────────────────────

def _P(txt: str, st: ParagraphStyle) -> Paragraph:
    return Paragraph(str(txt), st)


def _fmt(dt) -> str:
    if not dt:
        return '—'
    return dt.strftime('%d/%m/%Y  %H:%M') if hasattr(dt, 'strftime') else str(dt)


def _get_sede(sede_id: int, token: str) -> dict:
    if not sede_id:
        return {'nombre': '—', 'direccion': '—', 'distrito': '—', 'provincia': '—', 'departamento': '—'}
    try:
        data = MsUsuariosClient.validar_sede(sede_id, token)
        return {
            'nombre':       data.get('nombre',              f'Sede {sede_id}'),
            'direccion':    data.get('direccion',           '—'),
            'distrito':     data.get('distrito_nombre',     '—'),
            'provincia':    data.get('provincia_nombre',    '—'),
            'departamento': data.get('departamento_nombre', '—'),
        }
    except Exception as e:
        logger.warning('pdf_generator._get_sede id=%s: %s', sede_id, e)
        return {'nombre': f'Sede {sede_id}', 'direccion': '—',
                'distrito': '—', 'provincia': '—', 'departamento': '—'}


def _get_modulo(modulo_id: int, token: str) -> dict:
    if not modulo_id: return {'nombre': '—'}
    try:
        data = MsUsuariosClient.validar_modulo(modulo_id, token)
        return {'nombre': data.get('nombre', f'Módulo {modulo_id}')}
    except Exception as e:
        logger.warning('pdf_generator._get_modulo id=%s: %s', modulo_id, e)
        return {'nombre': f'Módulo {modulo_id}'}


def _get_usuario(usuario_id: int, token: str) -> dict:
    if not usuario_id: return {'nombre_completo': '—', 'cargo': ''}
    try:
        data   = MsUsuariosClient.validar_usuario(usuario_id, token)
        nombre = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        return {'nombre_completo': nombre or f'Usuario {usuario_id}', 'cargo': data.get('cargo', '')}
    except Exception as e:
        logger.warning('pdf_generator._get_usuario id=%s: %s', usuario_id, e)
        return {'nombre_completo': f'Usuario {usuario_id}', 'cargo': ''}


def _estilos() -> dict:
    S = lambda name, **kw: ParagraphStyle(name, **kw)
    return {
        's_inst':   S('inst',  fontName='Helvetica-Bold', fontSize=8,    textColor=GUINDA_PJ,   alignment=TA_LEFT, leading=10),
        's_ue':     S('ue',    fontName='Helvetica',      fontSize=7.5,  textColor=GRIS_SUBTEXTO, alignment=TA_LEFT, leading=9),
        's_tit':    S('tit',   fontName='Helvetica-Bold', fontSize=12,   textColor=GRIS_TEXTO_HDR, alignment=TA_LEFT, leading=14),
        's_num':    S('num',   fontName='Helvetica-Bold', fontSize=8.5,  textColor=NEGRO,       alignment=TA_RIGHT, leading=10),
        's_fec':    S('fec',   fontName='Helvetica',      fontSize=8,    textColor=NEGRO,       alignment=TA_RIGHT),
        's_folio':  S('folio', fontName='Helvetica',      fontSize=8,    textColor=GRIS_SUBTEXTO, alignment=TA_RIGHT),
        's_hdr':    S('hdr',   fontName='Helvetica-Bold', fontSize=8.5,  textColor=GUINDA_PJ,   alignment=TA_CENTER),
        's_val':    S('val',   fontName='Helvetica',      fontSize=8,    textColor=NEGRO,       leading=11),
        's_val_b':  S('valb',  fontName='Helvetica-Bold', fontSize=8,    textColor=NEGRO,       leading=11),
        's_usr':    S('usr',   fontName='Helvetica-Bold', fontSize=8.5,  textColor=GRIS_TEXTO_HDR, leading=11),
        's_cargo':  S('crg',   fontName='Helvetica',      fontSize=7.5,  textColor=GRIS_SUBTEXTO, leading=10),
        's_ch':     S('ch',    fontName='Helvetica-Bold', fontSize=7,    textColor=BLANCO,      alignment=TA_CENTER),
        's_cn':     S('cn',    fontName='Helvetica',      fontSize=7,    textColor=NEGRO,       alignment=TA_CENTER),
        's_nota':   S('nota',  fontName='Helvetica',      fontSize=7.2,  textColor=NEGRO,       leading=11, alignment=TA_JUSTIFY),
        's_est':    S('est',   fontName='Helvetica-Bold', fontSize=8,    textColor=GRIS_SUBTEXTO, alignment=TA_RIGHT),
        's_fflabel':S('ffl',   fontName='Helvetica-Bold', fontSize=7.5,  textColor=AZUL_SELLO_STAMP, alignment=TA_CENTER), # Label inferior firma
        's_fnomb':  S('fn',    fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       alignment=TA_CENTER), # Nombre firma
        's_fdate':  S('fd',    fontName='Helvetica',      fontSize=7,    textColor=GRIS_SUBTEXTO, alignment=TA_CENTER), # Fecha firma
    }


def _get_ap(aprobaciones, rol: str):
    """Última aprobación con accion=APROBADO para el rol dado."""
    for ap in reversed(list(aprobaciones.all())):
        if ap.rol_aprobador == rol and ap.accion == 'APROBADO':
            return ap
    return None
def _resolver_nombre_aprobador(ap, token: str) -> str:
    if not ap: return '—'
    usuario = _get_usuario(ap.usuario_id, token)
    return usuario['nombre_completo']
def _bloque_firma_estampado(label: str, ap, nombre_fijo: str | None, fecha_fija: str, st: dict) -> list:
    """
    Columna de firma: sello manual estampado → label inferior → línea → nombre → fecha.
    - label: Texto que va DENTRO del sello manual.
    - ap, nombre_fijo, fecha_fija: Datos de aprobación (mismo flujo que antes).
    """
    nombre   = nombre_fijo if nombre_fijo is not None else '—'
    fecha    = fecha_fija
    aprobado = ap is not None and nombre_fijo is None
    ln_st = ParagraphStyle('ln', fontName='Helvetica', fontSize=8,
                           textColor=GRIS_CABECERA, alignment=TA_CENTER)    
    return [
        _sello_manual(label, aprobado), 
        Spacer(1, 0.1 * cm),
        _P(label.upper(), st['s_fflabel']), 
        _P('_' * 30, ln_st),
        _P(nombre,   st['s_fnomb']),
        _P(fecha,    st['s_fdate']),
    ]

def _generar_tabla_od_mej(transferencia, sede_origen, sede_destino, modulo_origen, modulo_destino, usuario_origen, usuario_destino, st):
    """Genera la tabla de ORIGEN y DESTINO con diseño mejorado."""
    def _celdas_bloque(sede, modulo, usuario, label_usuario):
        return [
            _P(f'<b>{label_usuario}:</b>',                                           st['s_cargo']),
            _P(usuario['nombre_completo'],                                            st['s_usr']),
            _P(usuario.get('cargo', ''),                                             st['s_cargo']),
            Spacer(1, 0.15 * cm),
            _P(f'<b>Unidad / Sede:</b>  {sede["nombre"]}',                           st['s_val_b']),
            _P(sede['direccion'],                                                     st['s_val']),
            _P(f'{sede["distrito"]} — {sede["provincia"]} — {sede["departamento"]}', st['s_val']),
            _P(f'<b>Módulo:</b>  {modulo["nombre"]}',                                st['s_val']),
        ]

    celdas_o = _celdas_bloque(sede_origen, modulo_origen, usuario_origen, 'Usuario Origen')
    celdas_d = _celdas_bloque(sede_destino, modulo_destino, usuario_destino, 'Usuario Asignado')
    filas_od = [[_P('ORIGEN', st['s_hdr']), _P('DESTINO', st['s_hdr'])]]
    for c_o, c_d in zip(celdas_o, celdas_d):
        filas_od.append([c_o, c_d])

    tod = Table(filas_od, colWidths=[13.3 * cm, 13.3 * cm])
    tod.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.6, GUINDA_PJ),
        ('LINEAFTER',     (0, 0), (0, -1),  0.5, GUINDA_PJ),
        ('LINEABOVE',     (0, 1), (-1, 1),  0.8, GUINDA_PJ), 
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING',   (0, 1), (-1, -1), 6),
    ]))
    return tod


# ── FUNCIÓN PRINCIPAL MEJORADA ───────────────────────────────────────────────

def generar_pdf_transferencia(transferencia, cookie: str = '') -> bytes:
    """
    Genera el PDF oficial de una transferencia (estado == 'EN_ESPERA_CONFORMIDAD')
    con diseño mejorado y el nuevo logo institucional.
    """
    # ── 1. RESOLVER NOMBRES DESDE MS-USUARIOS ─────────────────────────────────
    sede_origen    = _get_sede(transferencia.sede_origen_id,     cookie)
    sede_destino   = _get_sede(transferencia.sede_destino_id,    cookie)
    modulo_origen  = _get_modulo(transferencia.modulo_origen_id,  cookie)
    modulo_destino = _get_modulo(transferencia.modulo_destino_id, cookie)
    usuario_origen  = _get_usuario(transferencia.usuario_origen_id,  cookie)
    usuario_destino = _get_usuario(transferencia.usuario_destino_id, cookie)

    # ── 2. SETUP ──────────────────────────────────────────────────────────────
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1.2 * cm, leftMargin=1.2 * cm,
        topMargin=1.0 * cm,   bottomMargin=1.0 * cm, 
    )
    story = []
    st    = _estilos()

    es_traslado   = transferencia.tipo == 'TRASLADO_SEDE'
    es_asignacion=transferencia.tipo=='ASIGNACION_INTERNA'
    motivo_nombre = transferencia.motivo_transferencia.nombre if transferencia.motivo_transferencia else '—'

    # ── 3. CABECERA (MEJORADO CON NUEVO LOGO) ─────────────────────────────────
    logo_path = _logo_path()
    logo_img  = (Image(logo_path, width=1.8 * cm, height=1.8 * cm)
                 if logo_path else
                 _P('PJ', ParagraphStyle('pjf', fontName='Helvetica-Bold', fontSize=16, textColor=GUINDA_PJ, alignment=TA_CENTER)))

    blq_inst = Table([
        [_P('PODER JUDICIAL DEL PERÚ', st['s_inst'])],
        [_P('U.E.: 009 — CORTE SUPERIOR DE JUSTICIA DE LIMA NORTE', st['s_ue'])],
        [_P('TRASLADO / ASIGNACIÓN DE BIENES MUEBLES PATRIMONIALES', st['s_tit'])],
    ], colWidths=[19 * cm],
       style=[('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
              ('TOPPADDING', (0, 0), (-1, -1), 1),
              ('BOTTOMPADDING', (0, 0), (-1, -1), 1)])

    blq_num = Table([
        [_P(f'<b>N° Orden:</b>  {transferencia.numero_orden}', st['s_num'])],
        [_P(f'<b>Fecha:</b>  {_fmt(transferencia.fecha_registro)}', st['s_fec'])],
        [_P('<b>Folio:</b>  1 de 1', st['s_folio'])],
    ], colWidths=[5.5 * cm],
       style=[('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
              ('TOPPADDING', (0, 0), (-1, -1), 1),
              ('BOTTOMPADDING', (0, 0), (-1, -1), 1)])

    cab = Table([[logo_img, blq_inst, blq_num]], colWidths=[2.1 * cm, 19 * cm, 5.5 * cm])
    cab.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW',     (0, -1), (-1, -1), 2.0, GUINDA_PJ), 
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(cab)
    story.append(Spacer(1, 0.2 * cm))

    # ── 4. ORIGEN / DESTINO (MEJORADO CON DISEÑO MODERNO) ─────────────────────
    story.append(_generar_tabla_od_mej(transferencia, sede_origen, sede_destino, modulo_origen, modulo_destino, usuario_origen, usuario_destino, st))
    story.append(Spacer(1, 0.2 * cm))

    # ── 5. MOTIVO + DESCRIPCIÓN (DISEÑO MEJORADO) ──────────────────────────────
    mot = Table([[
        _P(f'<b>Motivo:</b>  {motivo_nombre}', st['s_val_b']),
        _P(f'<b>Descripción:</b>  {transferencia.descripcion or "—"}', st['s_val']),
    ]], colWidths=[7 * cm, 19.6 * cm])
    mot.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_CABECERA),
        ('BACKGROUND',    (0, 0), (0, 0),   GRIS_CABECERA),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
    ]))
    story.append(mot)
    story.append(Spacer(1, 0.2 * cm))

    # ── 6. TABLA DE BIENES (MEJORADO CON CABECERA GUINDA) ──────────────────────
    headers = ['N°', 'Cód. Patrimonial', 'Descripción del Bien', 'Estado', 'Marca', 'Modelo', 'N° Serie', 'Observaciones']
    widths  = [0.7*cm, 3.3*cm, 4.8*cm, 2*cm, 2.3*cm, 2.8*cm, 2.8*cm, 7.9*cm]

    filas = [[_P(h, st['s_ch']) for h in headers]]
    for i, detalle in enumerate(transferencia.detalles.select_related('bien').all(), 1):
        estado_bien = detalle.bien.estado_funcionamiento if detalle.bien else '—'
        filas.append([
            _P(str(i),                        st['s_cn']),
            _P(detalle.codigo_patrimonial,    st['s_cn']),
            _P(detalle.tipo_bien_nombre,      st['s_cn']),
            _P(estado_bien,                   st['s_cn']),
            _P(detalle.marca_nombre,          st['s_cn']),
            _P(detalle.modelo or '—',         st['s_cn']),
            _P(detalle.numero_serie or 'S/N', st['s_cn']),
            _P('',                            st['s_cn']),
        ])

    tb = Table(filas, colWidths=widths)
    tb.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  GUINDA_PJ),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [BLANCO, colors.HexColor('#FAFAFA')]),
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_CABECERA),
        ('INNERGRID',     (0, 0), (-1, -1), 0.25, GRIS_CABECERA),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tb)

    story.append(Table(
        [[_P('', st['s_val']),
          _P(f'<b>Total bienes:</b>  {transferencia.detalles.count()}'
            )]],
        colWidths=[18 * cm, 8.6 * cm],
        style=[('TOPPADDING', (0, 0), (-1, -1), 3),
               ('BOTTOMPADDING', (0, 0), (-1, -1), 2)],
    ))
    story.append(Spacer(1, 0.3 * cm))

    # ── 7. NOTA LEGAL (MEJORADO CON JUSTIFICADO) ──────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_CABECERA))
    story.append(Spacer(1, 0.15 * cm))
    story.append(Paragraph(
        '<b>NOTA:</b>  '
        '<u>Los bienes relacionados en este documento son recibidos a conformidad '
        'y serán devueltos una vez finalizada mi relación contractual con el Poder Judicial.</u>  '
        'El trabajador es responsable directo de la existencia, permanencia, conservación y buen uso '
        'de los bienes descritos. Cualquier movimiento deberá ser comunicado al Encargado de Control '
        'Patrimonial, bajo responsabilidad.  — Directiva N° 001-2021-SBN.',
        st['s_nota'],
    ))
    story.append(Spacer(1, 0.4 * cm))
    # ── 8. FIRMAS (MEJORADO CON SELLOS ESTAMPADOS) ──────────────────────────
    aps = transferencia.aprobaciones
    def _nombre_ap(ap) -> str: return _resolver_nombre_aprobador(ap, cookie)
    def _fecha_ap(ap) -> str: return _fmt(ap.fecha) if ap else ''

    if es_traslado:
        ap_reg  = _get_ap(aps, 'REGISTRADOR')
        ap_auto = _get_ap(aps, 'COORDSISTEMA') or _get_ap(aps, 'ADMINSEDE') or _get_ap(aps, 'coordSistema') or _get_ap(aps, 'adminSede')
        ap_sal  = _get_ap(aps, 'SEGUR_SALIDA')
        ap_ent  = _get_ap(aps, 'SEGUR_ENTRADA')
        ap_dest = _get_ap(aps, 'USUARIO_DESTINO')     
        columnas = [
            _bloque_firma_estampado('Usuario Traslada',
                          ap_reg, usuario_origen['nombre_completo'], _fecha_ap(ap_reg), st),
            _bloque_firma_estampado('Autorizado por',
                          ap_auto, _nombre_ap(ap_auto), _fecha_ap(ap_auto), st),
            _bloque_firma_estampado('V°B° Seg. Origen', 
                          ap_sal,  _nombre_ap(ap_sal),  _fecha_ap(ap_sal),  st),
            _bloque_firma_estampado('V°B° Seg. Destino',
                          ap_ent,  _nombre_ap(ap_ent),  _fecha_ap(ap_ent),  st),
            _bloque_firma_estampado('Usuario Recepciona',
                          ap_dest, usuario_destino['nombre_completo'], _fecha_ap(ap_dest), st),
            
        ]
        col_widths = [5.3*cm, 5.3*cm, 5.3*cm, 5.3*cm, 5.4*cm] 
    elif es_asignacion:
        ap_reg  = _get_ap(aps, 'REGISTRADOR')
        ap_auto = _get_ap(aps, 'adminSede') or _get_ap(aps, 'coordSistema') or _get_ap(aps, 'ADMINSEDE') or _get_ap(aps, 'COORDSISTEMA') 

        columnas = [
            _bloque_firma_estampado('Usuario Asigna',
                          ap_reg, usuario_origen['nombre_completo'], _fecha_ap(ap_reg), st),
            _bloque_firma_estampado('Autorizado por',
                          ap_auto, _nombre_ap(ap_auto), _fecha_ap(ap_auto), st),
            _bloque_firma_estampado('Usuario Recepciona',
                          None, usuario_destino['nombre_completo'], '', st),
        ]
        col_widths = [8.8*cm, 8.8*cm, 8.8*cm]

    tf = Table([columnas], colWidths=col_widths)
    tf.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'), 
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('LINEAFTER',     (0, 0), (len(columnas) - 2, -1), 0.4, GRIS_CABECERA),
        ('LINEABOVE',     (0, 0), (-1, 0),  0.8, GUINDA_PJ),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))   


    n_filas = max(len(c) for c in columnas)
    filas_f = []
    for i in range(n_filas):
        filas_f.append([
            c[i] if i < len(c) else _P('', st['s_fdate'])
            for c in columnas
        ])

    tf = Table(filas_f, colWidths=col_widths)
    tf.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('LINEAFTER',     (0, 0), (len(columnas) - 2, -1), 0.4, GRIS_CABECERA),
        ('LINEABOVE',     (0, 0), (-1, 0),  0.8, GUINDA_PJ),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tf)

    # ── 9. FOOTER (MEJORADO) ──────────────────────────────────────────────────
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width='100%', thickness=0.4, color=GRIS_CABECERA))
    story.append(Paragraph(
        'dwr_log_trasasig_formato_sisconpat_2',
        ParagraphStyle('foot', fontName='Helvetica', fontSize=6,
                       textColor=colors.grey, alignment=TA_RIGHT),
    ))

    doc.build(story)
    return buffer.getvalue()