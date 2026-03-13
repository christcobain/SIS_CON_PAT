"""
transferencias/pdf_generator.py

Genera el PDF oficial de Traslado / Asignación de Bienes Muebles Patrimoniales.
Usa MsUsuariosClient de bienes/services.py para resolver nombres.
"""
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
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Circle, String

from bienes.services import MsUsuariosClient

logger = logging.getLogger(__name__)

# ── PALETA ────────────────────────────────────────────────────────────────────
AZUL_SELLO = colors.HexColor('#1A3A8B')
GRIS_HDR   = colors.HexColor('#4A4A4A')
GRIS_HDR2  = colors.HexColor('#6B6B6B')
GRIS_FILA  = colors.HexColor('#F2F2F2')
GRIS_LINE  = colors.HexColor('#CCCCCC')
GRIS_MOT   = colors.HexColor('#E8E8E8')
BLANCO     = colors.white
NEGRO      = colors.black


# ── WRAPPERS SEGUROS SOBRE MsUsuariosClient ───────────────────────────────────

def _get_sede(sede_id: int, token: str) -> dict:
    if not sede_id:
        return {'nombre': '—', 'direccion': '—',
                'distrito': '—', 'provincia': '—', 'departamento': '—'}
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
    if not modulo_id:
        return {'nombre': '—'}
    try:
        data = MsUsuariosClient.validar_modulo(modulo_id, token)
        return {'nombre': data.get('nombre', f'Módulo {modulo_id}')}
    except Exception as e:
        logger.warning('pdf_generator._get_modulo id=%s: %s', modulo_id, e)
        return {'nombre': f'Módulo {modulo_id}'}


def _get_usuario(usuario_id: int, token: str) -> dict:
    """Retorna {nombre_completo, cargo} — nunca lanza excepción."""
    if not usuario_id:
        return {'nombre_completo': '—', 'cargo': ''}
    try:
        data   = MsUsuariosClient.validar_usuario(usuario_id, token)
        nombre = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        return {
            'nombre_completo': nombre or f'Usuario {usuario_id}',
            'cargo':           data.get('cargo', ''),
        }
    except Exception as e:
        logger.warning('pdf_generator._get_usuario id=%s: %s', usuario_id, e)
        return {'nombre_completo': f'Usuario {usuario_id}', 'cargo': ''}


# ── HELPERS PDF ───────────────────────────────────────────────────────────────

def _P(txt: str, st: ParagraphStyle) -> Paragraph:
    return Paragraph(str(txt), st)


def _fmt(dt) -> str:
    if not dt:
        return '—'
    return dt.strftime('%d/%m/%Y  %H:%M') if hasattr(dt, 'strftime') else str(dt)


def _get_ap(aprobaciones, rol: str):
    """Última aprobación con accion=APROBADO para el rol dado."""
    for ap in reversed(list(aprobaciones.all())):
        if ap.rol_aprobador == rol and ap.accion == 'APROBADO':
            return ap
    return None


def _resolver_nombre_aprobador(ap, token: str) -> str:
    """
    TransferenciaAprobacion tiene usuario_id (IntegerField), no usuario_nombre.
    Resuelve el nombre llamando a ms-usuarios.
    """
    if not ap:
        return '—'
    usuario = _get_usuario(ap.usuario_id, token)
    return usuario['nombre_completo']


def _sello_vb(aprobado: bool, size: float = 1.7 * cm) -> Drawing:
    """Sello circular: azul+✓ si aprobado, gris vacío si no."""
    d  = Drawing(size, size)
    cx = cy = size / 2
    r  = size / 2 - 1.5
    ring = Circle(cx, cy, r)
    ring.fillColor   = BLANCO
    ring.strokeColor = AZUL_SELLO if aprobado else GRIS_LINE
    ring.strokeWidth = 2.2
    d.add(ring)
    d.add(String(cx, cy + 2, 'V°B°',
                 fontName='Helvetica-Bold', fontSize=7.5,
                 fillColor=AZUL_SELLO if aprobado else GRIS_LINE,
                 textAnchor='middle'))
    if aprobado:
        d.add(String(cx, cy - 7, '✓',
                     fontName='Helvetica-Bold', fontSize=8,
                     fillColor=AZUL_SELLO, textAnchor='middle'))
    return d


def _logo_path() -> str | None:
    base = Path(getattr(settings, 'BASE_DIR', ''))
    for p in [
        base / 'static'      / 'img' / 'pj_logo.png',
        base / 'staticfiles' / 'img' / 'pj_logo.png',
        base / 'assets'               / 'pj_logo.png',
    ]:
        if p.exists():
            return str(p)
    return None


def _estilos() -> dict:
    S = lambda name, **kw: ParagraphStyle(name, **kw)
    return {
        's_inst':   S('inst',  fontName='Helvetica-Bold', fontSize=7.5,  textColor=NEGRO,       alignment=TA_LEFT),
        's_tit':    S('tit',   fontName='Helvetica-Bold', fontSize=11,   textColor=GRIS_HDR,    alignment=TA_CENTER),
        's_num':    S('num',   fontName='Helvetica-Bold', fontSize=8,    textColor=NEGRO,       alignment=TA_RIGHT),
        's_fec':    S('fec',   fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       alignment=TA_RIGHT),
        's_hdr':    S('hdr',   fontName='Helvetica-Bold', fontSize=8,    textColor=BLANCO,      alignment=TA_CENTER),
        's_val':    S('val',   fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       leading=11),
        's_val_b':  S('valb',  fontName='Helvetica-Bold', fontSize=7.5,  textColor=NEGRO,       leading=11),
        's_usr':    S('usr',   fontName='Helvetica-Bold', fontSize=8,    textColor=GRIS_HDR,    leading=11),
        's_cargo':  S('crg',   fontName='Helvetica',      fontSize=7,    textColor=colors.grey, leading=10),
        's_ch':     S('ch',    fontName='Helvetica-Bold', fontSize=6.5,  textColor=BLANCO,      alignment=TA_CENTER),
        's_cn':     S('cn',    fontName='Helvetica',      fontSize=6.5,  textColor=NEGRO,       alignment=TA_CENTER),
        's_nota':   S('nota',  fontName='Helvetica',      fontSize=6.8,  textColor=NEGRO,       leading=10),
        's_flabel': S('fl',    fontName='Helvetica-Bold', fontSize=7.5,  textColor=GRIS_HDR,    alignment=TA_CENTER),
        's_fnomb':  S('fn',    fontName='Helvetica',      fontSize=7,    textColor=NEGRO,       alignment=TA_CENTER),
        's_fdate':  S('fd',    fontName='Helvetica',      fontSize=6.5,  textColor=colors.grey, alignment=TA_CENTER),
        's_est':    S('est',   fontName='Helvetica-Bold', fontSize=7.5,  textColor=GRIS_HDR,    alignment=TA_RIGHT),
    }


def _bloque_od(sede: dict, modulo: dict, usuario: dict,
               label_usuario: str, st: dict) -> list:
    """Celdas ORIGEN/DESTINO: usuario arriba → separador → datos sede."""
    return [
        _P(f'<b>{label_usuario}:</b>',                                           st['s_cargo']),
        _P(usuario['nombre_completo'],                                            st['s_usr']),
        _P(usuario.get('cargo', ''),                                             st['s_cargo']),
        _P('',                                                                    st['s_val']),
        _P(f'<b>Unidad / Sede:</b>  {sede["nombre"]}',                           st['s_val_b']),
        _P(sede['direccion'],                                                     st['s_val']),
        _P(f'{sede["distrito"]} — {sede["provincia"]} — {sede["departamento"]}', st['s_val']),
        _P(f'<b>Módulo:</b>  {modulo["nombre"]}',                                st['s_val']),
    ]


def _bloque_firma(label: str, ap, nombre_fijo: str | None,
                  fecha_fija: str, st: dict) -> list:
    """
    Columna de firma: sello → label → línea → nombre → fecha.

    - ap         : instancia TransferenciaAprobacion o None
    - nombre_fijo: para el usuario final (sin aprobación en BD)
    - fecha_fija : fecha del ap ya resuelta como string, o '' si no hay
    """
    nombre   = nombre_fijo if nombre_fijo is not None else '—'
    fecha    = fecha_fija
    aprobado = ap is not None and nombre_fijo is None
    ln_st = ParagraphStyle('ln', fontName='Helvetica', fontSize=8,
                           textColor=GRIS_LINE, alignment=TA_CENTER)
    return [
        _sello_vb(aprobado),
        _P(label,    st['s_flabel']),
        _P('_' * 30, ln_st),
        _P(nombre,   st['s_fnomb']),
        _P(fecha,    st['s_fdate']),
    ]


# ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

def generar_pdf_transferencia(transferencia, cookie: str = '') -> bytes:
    """
    Genera el PDF oficial de una transferencia (estado == 'ATENDIDO').

    Args:
        transferencia : instancia del modelo Transferencia.
        cookie        : valor de la cookie sisconpat_access.
                        En la view: request.COOKIES.get(settings.JWT_AUTH_COOKIE, '')
    Returns:
        bytes del PDF.
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
        topMargin=1.2 * cm,   bottomMargin=1.2 * cm,
    )
    story = []
    st    = _estilos()

    es_traslado   = transferencia.tipo == 'TRASLADO_SEDE'
    motivo_nombre = transferencia.motivo.nombre if transferencia.motivo else '—'

    # ── 3. CABECERA ───────────────────────────────────────────────────────────
    logo_path = _logo_path()
    logo_img  = (Image(logo_path, width=1.9 * cm, height=1.9 * cm)
                 if logo_path else
                 _P('PJ', ParagraphStyle('pjf', fontName='Helvetica-Bold',
                                         fontSize=14, textColor=GRIS_HDR,
                                         alignment=TA_CENTER)))

    blq_inst = Table([
        [_P('PODER JUDICIAL DEL PERÚ', st['s_inst'])],
        [_P('U.E.: 009 — CORTE SUPERIOR DE JUSTICIA DE LIMA NORTE', st['s_inst'])],
        [_P('TRASLADO / ASIGNACIÓN DE BIENES MUEBLES PATRIMONIALES', st['s_tit'])],
    ], colWidths=[19 * cm],
       style=[('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
              ('TOPPADDING', (0, 0), (-1, -1), 1),
              ('BOTTOMPADDING', (0, 0), (-1, -1), 1)])

    blq_num = Table([
        [_P(f'<b>N° Orden:</b>  {transferencia.numero_orden}', st['s_num'])],
        [_P(f'<b>Fecha:</b>  {_fmt(transferencia.fecha_registro)}', st['s_fec'])],
        [_P('<b>Folio:</b>  1 de 1', st['s_fec'])],
    ], colWidths=[5.5 * cm],
       style=[('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
              ('TOPPADDING', (0, 0), (-1, -1), 1),
              ('BOTTOMPADDING', (0, 0), (-1, -1), 1)])

    cab = Table([[logo_img, blq_inst, blq_num]],
                colWidths=[2.2 * cm, 19 * cm, 5.5 * cm])
    cab.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW',     (0, -1), (-1, -1), 1.5, GRIS_HDR),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(cab)
    story.append(Spacer(1, 0.3 * cm))

    # ── 4. ORIGEN / DESTINO ───────────────────────────────────────────────────
    celdas_o = _bloque_od(sede_origen,  modulo_origen,  usuario_origen,
                          'Usuario Origen',  st)
    celdas_d = _bloque_od(sede_destino, modulo_destino, usuario_destino,
                          'Usuario Asignado', st)
    filas_od = [[_P('ORIGEN', st['s_hdr']), _P('DESTINO', st['s_hdr'])]]
    for c_o, c_d in zip(celdas_o, celdas_d):
        filas_od.append([c_o, c_d])

    tod = Table(filas_od, colWidths=[13.3 * cm, 13.3 * cm])
    tod.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  GRIS_HDR),
        ('BOX',           (0, 0), (-1, -1), 0.6, GRIS_HDR),
        ('LINEAFTER',     (0, 0), (0, -1),  0.5, GRIS_LINE),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [
            GRIS_FILA, BLANCO, GRIS_FILA,
            colors.HexColor('#FAFAFA'),
            GRIS_FILA, BLANCO, GRIS_FILA, BLANCO,
        ]),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING',   (0, 1), (-1, -1), 6),
        ('LINEABOVE',     (0, 5), (-1, 5),  0.4, GRIS_LINE),
    ]))
    story.append(tod)
    story.append(Spacer(1, 0.2 * cm))

    # ── 5. MOTIVO + DESCRIPCIÓN ───────────────────────────────────────────────
    mot = Table([[
        _P(f'<b>Motivo:</b>  {motivo_nombre}', st['s_val_b']),
        _P(f'<b>Descripción:</b>  {transferencia.descripcion or "—"}', st['s_val']),
    ]], colWidths=[7 * cm, 19.6 * cm])
    mot.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_HDR2),
        ('BACKGROUND',    (0, 0), (0, 0),   GRIS_MOT),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
    ]))
    story.append(mot)
    story.append(Spacer(1, 0.3 * cm))

    # ── 6. TABLA DE BIENES ────────────────────────────────────────────────────
    headers = ['N°', 'Cód. Patrimonial', 'Descripción del Bien',
               'Estado', 'Marca', 'Modelo', 'N° Serie', 'Observaciones']
    widths  = [0.7*cm, 3.3*cm, 4.8*cm, 2*cm, 2.3*cm, 2.8*cm, 2.8*cm, 7.9*cm]

    filas = [[_P(h, st['s_ch']) for h in headers]]
    for i, detalle in enumerate(transferencia.detalles.select_related('bien').all(), 1):
        estado_bien = detalle.bien.estado_bien if detalle.bien else '—'
        filas.append([
            _P(str(i),                        st['s_cn']),
            _P(detalle.codigo_patrimonial,    st['s_cn']),
            _P(detalle.tipo_bien_nombre,      st['s_cn']),
            _P(estado_bien,           st['s_cn']),
            _P(detalle.marca_nombre,          st['s_cn']),
            _P(detalle.modelo or '—',         st['s_cn']),
            _P(detalle.numero_serie or 'S/N', st['s_cn']),
            _P('',                            st['s_cn']),
        ])

    tb = Table(filas, colWidths=widths)
    tb.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  GRIS_HDR2),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [BLANCO, GRIS_FILA]),
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_HDR2),
        ('INNERGRID',     (0, 0), (-1, -1), 0.25, GRIS_LINE),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tb)

    story.append(Table(
        [[_P('', st['s_val']),
          _P(f'<b>Total bienes:</b>  {transferencia.detalles.count()}'
             f'   |   <b>Estado:</b>  {transferencia.estado}', st['s_est'])]],
        colWidths=[18 * cm, 8.6 * cm],
        style=[('TOPPADDING', (0, 0), (-1, -1), 3),
               ('BOTTOMPADDING', (0, 0), (-1, -1), 2)],
    ))
    story.append(Spacer(1, 0.4 * cm))

    # ── 7. NOTA LEGAL ─────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_LINE))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        '<b>NOTA:</b>  '
        '<u>Los bienes relacionados en este documento son recibidos a conformidad '
        'y serán devueltos una vez finalizada mi relación contractual con el Poder Judicial.</u>  '
        'El trabajador es responsable directo de la existencia, permanencia, conservación y buen uso '
        'de los bienes descritos. Cualquier movimiento deberá ser comunicado al Encargado de Control '
        'Patrimonial, bajo responsabilidad.  — Directiva N° 001-2021-SBN.',
        st['s_nota'],
    ))
    story.append(Spacer(1, 0.45 * cm))

    # ── 8. FIRMAS ─────────────────────────────────────────────────────────────
    aps = transferencia.aprobaciones

    def _nombre_ap(ap) -> str:
        """Resuelve el nombre del aprobador desde ms-usuarios."""
        if not ap:
            return '—'
        return _resolver_nombre_aprobador(ap, cookie)

    def _fecha_ap(ap) -> str:
        return _fmt(ap.fecha) if ap else ''

    if es_traslado:
        ap_reg  = _get_ap(aps, 'REGISTRADOR')
        ap_auto = _get_ap(aps, 'COORDSISTEMA') or _get_ap(aps, 'ADMINSEDE')
        ap_sal  = _get_ap(aps, 'SEGUR_SALIDA')
        ap_ent  = _get_ap(aps, 'SEGUR_ENTRADA')

        columnas = [
            _bloque_firma('Usuario Traslada',
                          ap_reg,
                          usuario_origen['nombre_completo'],
                          _fecha_ap(ap_reg),
                          st),
            _bloque_firma('Autorizado por',
                          ap_auto, _nombre_ap(ap_auto), _fecha_ap(ap_auto), st),
            _bloque_firma('V°B° Salida — Seg. Origen',
                          ap_sal,  _nombre_ap(ap_sal),  _fecha_ap(ap_sal),  st),
            _bloque_firma('V°B° Entrada — Seg. Destino',
                          ap_ent,  _nombre_ap(ap_ent),  _fecha_ap(ap_ent),  st),
            _bloque_firma('Usuario Recepciona',
                          None, usuario_destino['nombre_completo'], '', st),
        ]
        col_widths = [5.3*cm, 5.3*cm, 5.3*cm, 5.3*cm, 5.4*cm]

    else:
        ap_reg  = _get_ap(aps, 'REGISTRADOR')
        ap_auto = _get_ap(aps, 'ADMINSEDE') or _get_ap(aps, 'COORDSISTEMA')

        columnas = [
            _bloque_firma('Usuario Asigna',
                          ap_reg,
                          usuario_origen['nombre_completo'],
                          _fecha_ap(ap_reg),
                          st),
            _bloque_firma('Autorizado por (adminSede)',
                          ap_auto, _nombre_ap(ap_auto), _fecha_ap(ap_auto), st),
            _bloque_firma('Usuario Recepciona',
                          None, usuario_destino['nombre_completo'], '', st),
        ]
        col_widths = [8.8*cm, 8.8*cm, 8.8*cm]

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
        ('LINEAFTER',     (0, 0), (len(columnas) - 2, -1), 0.4, GRIS_LINE),
        ('LINEABOVE',     (0, 0), (-1, 0),  0.8, GRIS_HDR),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(tf)

    # ── 9. FOOTER ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width='100%', thickness=0.4, color=GRIS_LINE))
    story.append(Paragraph(
        'dwr_log_trasasig_formato_sisconpat_1',
        ParagraphStyle('foot', fontName='Helvetica', fontSize=6,
                       textColor=colors.grey, alignment=TA_RIGHT),
    ))

    doc.build(story)
    return buffer.getvalue()