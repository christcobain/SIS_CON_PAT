import io
import logging
from pathlib import Path
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,Paragraph, Spacer, HRFlowable,)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Circle, String
from bienes.services import MsUsuariosClient

logger = logging.getLogger(__name__)

AZUL_SELLO  = colors.HexColor('#1A3A8B')
AZUL_HDR    = colors.HexColor('#1A3A8B')
GRIS_HDR    = colors.HexColor('#4A4A4A')
GRIS_HDR2   = colors.HexColor('#6B6B6B')
GRIS_FILA   = colors.HexColor('#F2F2F2')
GRIS_LINE   = colors.HexColor('#CCCCCC')
GRIS_MOT    = colors.HexColor('#E8E8E8')
VERDE_LIGHT = colors.HexColor('#EAF4EA')
BLANCO      = colors.white
NEGRO       = colors.black

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
        logger.warning('pdf_mnt._get_sede id=%s: %s', sede_id, e)
        return {'nombre': f'Sede {sede_id}', 'direccion': '—',
                'distrito': '—', 'provincia': '—', 'departamento': '—'}
def _get_modulo(modulo_id: int, token: str) -> dict:
    if not modulo_id:
        return {'nombre': '—'}
    try:
        data = MsUsuariosClient.validar_modulo(modulo_id, token)
        return {'nombre': data.get('nombre', f'Módulo {modulo_id}')}
    except Exception as e:
        logger.warning('pdf_mnt._get_modulo id=%s: %s', modulo_id, e)
        return {'nombre': f'Módulo {modulo_id}'}
def _get_usuario(usuario_id: int, token: str) -> dict:
    if not usuario_id:
        return {'nombre_completo': '—', 'cargo': '', 'dni': ''}
    try:
        data   = MsUsuariosClient.validar_usuario(usuario_id, token)
        nombre = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        return {
            'nombre_completo': nombre or f'Usuario {usuario_id}',
            'cargo':           data.get('cargo', ''),
            'dni':             data.get('dni', ''),
        }
    except Exception as e:
        logger.warning('pdf_mnt._get_usuario id=%s: %s', usuario_id, e)
        return {'nombre_completo': f'Usuario {usuario_id}', 'cargo': '', 'dni': ''}

def _P(txt: str, st: ParagraphStyle) -> Paragraph:
    return Paragraph(str(txt), st)
def _fmt(dt) -> str:
    if not dt:
        return '—'
    if hasattr(dt, 'strftime'):
        return dt.strftime('%d/%m/%Y  %H:%M')
    return str(dt)
def _fmt_date(d) -> str:
    if not d:
        return '—'
    if hasattr(d, 'strftime'):
        return d.strftime('%d/%m/%Y')
    return str(d)
def _sello_vb(aprobado: bool, size: float = 1.7 * cm) -> Drawing:
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
        's_sub':    S('sub',   fontName='Helvetica',      fontSize=8,    textColor=GRIS_HDR2,   alignment=TA_CENTER),
        's_num':    S('num',   fontName='Helvetica-Bold', fontSize=8,    textColor=NEGRO,       alignment=TA_RIGHT),
        's_fec':    S('fec',   fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       alignment=TA_RIGHT),
        's_hdr':    S('hdr',   fontName='Helvetica-Bold', fontSize=8,    textColor=BLANCO,      alignment=TA_CENTER),
        's_hdr_az': S('hdraz', fontName='Helvetica-Bold', fontSize=7.5,  textColor=BLANCO,      alignment=TA_CENTER),
        's_val':    S('val',   fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       leading=11),
        's_val_b':  S('valb',  fontName='Helvetica-Bold', fontSize=7.5,  textColor=NEGRO,       leading=11),
        's_val_az': S('valaz', fontName='Helvetica-Bold', fontSize=7.5,  textColor=AZUL_HDR,    leading=11),
        's_usr':    S('usr',   fontName='Helvetica-Bold', fontSize=8,    textColor=GRIS_HDR,    leading=11),
        's_cargo':  S('crg',   fontName='Helvetica',      fontSize=7,    textColor=colors.grey, leading=10),
        's_ch':     S('ch',    fontName='Helvetica-Bold', fontSize=6.5,  textColor=BLANCO,      alignment=TA_CENTER),
        's_cn':     S('cn',    fontName='Helvetica',      fontSize=6.5,  textColor=NEGRO,       alignment=TA_CENTER),
        's_cn_l':   S('cnl',   fontName='Helvetica',      fontSize=6.5,  textColor=NEGRO,       alignment=TA_LEFT),
        's_nota':   S('nota',  fontName='Helvetica',      fontSize=6.8,  textColor=NEGRO,       leading=10),
        's_flabel': S('fl',    fontName='Helvetica-Bold', fontSize=7.5,  textColor=GRIS_HDR,    alignment=TA_CENTER),
        's_fnomb':  S('fn',    fontName='Helvetica',      fontSize=7,    textColor=NEGRO,       alignment=TA_CENTER),
        's_fdate':  S('fd',    fontName='Helvetica',      fontSize=6.5,  textColor=colors.grey, alignment=TA_CENTER),
        's_est':    S('est',   fontName='Helvetica-Bold', fontSize=7.5,  textColor=GRIS_HDR,    alignment=TA_RIGHT),
        's_block':  S('blk',   fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       leading=11, spaceAfter=2),
        's_block_b':S('blkb',  fontName='Helvetica-Bold', fontSize=7.5,  textColor=GRIS_HDR,    leading=11),
    }

def _bloque_firma(label: str, aprobado: bool, nombre: str,cargo: str, fecha: str, st: dict) -> list:
    return [
        _sello_vb(aprobado),
        _P(label,  st['s_flabel']),
        Spacer(1, 0.35 * cm),
        _P('___________________________', st['s_fdate']),
        _P(nombre, st['s_fnomb']),
        _P(cargo,  st['s_cargo']),
        _P(fecha,  st['s_fdate']),
    ]
def generar_pdf_mantenimiento(mantenimiento, cookie: str = '') -> bytes:
    buffer = io.BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    story = []
    st    = _estilos()
    sede          = _get_sede(mantenimiento.sede_id, cookie)
    modulo        = _get_modulo(mantenimiento.modulo_id, cookie)
    usr_realiza   = _get_usuario(mantenimiento.usuario_realiza_id,   cookie)
    usr_propiet   = _get_usuario(mantenimiento.usuario_propietario_id, cookie)
    usr_aprobador = _get_usuario(mantenimiento.aprobado_por_adminsede_id, cookie) \
                    if mantenimiento.aprobado_por_adminsede_id else \
                    {'nombre_completo': '—', 'cargo': '', 'dni': ''}
    logo_path = _logo_path()
    titulo_cell = [
        _P('PODER JUDICIAL DEL PERÚ',                               st['s_inst']),
        _P('Corte Superior de Justicia de Lima Norte',              st['s_inst']),
        _P('Coordinación de Informática y Estadística',             st['s_inst']),
        Spacer(1, 0.15 * cm),
        _P('ACTA DE MANTENIMIENTO DE BIENES MUEBLES PATRIMONIALES', st['s_tit']),
        Spacer(1, 0.1 * cm),
        _P('Sistema de Control Patrimonial — SISCONPAT',            st['s_sub']),
    ]
    num_cell = [
        _P(f'<b>N° Orden:</b>  {mantenimiento.numero_orden}',       st['s_num']),
        _P(f'<b>Fecha registro:</b>  {_fmt(mantenimiento.fecha_registro)}', st['s_fec']),
        _P(f'<b>Estado:</b>  {mantenimiento.get_estado_display()}',  st['s_fec']),
        Spacer(1, 0.1 * cm),
        _P(f'<b>Sede:</b>  {sede["nombre"]}',                        st['s_fec']),
        _P(f'<b>Módulo:</b>  {modulo["nombre"]}',                    st['s_fec']),
    ]
    if logo_path:
        from reportlab.platypus import Image as RLImage
        logo_img = RLImage(logo_path, width=2.4 * cm, height=2.4 * cm)
        hdr_data   = [[logo_img, titulo_cell, num_cell]]
        hdr_widths = [2.6 * cm, 10.8 * cm, 4.8 * cm]
    else:
        hdr_data   = [[titulo_cell, num_cell]]
        hdr_widths = [12.6 * cm, 5.6 * cm]
    thdr = Table(hdr_data, colWidths=hdr_widths)
    thdr.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 4),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBELOW',     (0, 0), (-1, 0),  1.2, AZUL_HDR),
    ]))
    story.append(thdr)
    story.append(Spacer(1, 0.25 * cm))
    # ── 2. BLOQUE DE RESPONSABLES ─────────────────────────────────────────────
    def _celda_responsable(label_rol: str, usuario: dict) -> list:
        return [
            _P(f'<b>{label_rol}:</b>',             st['s_cargo']),
            _P(usuario['nombre_completo'],          st['s_usr']),
            _P(usuario.get('cargo', ''),            st['s_cargo']),
            _P(f'DNI: {usuario.get("dni", "—")}',  st['s_cargo']),
        ]
    filas_resp = [[_P('EJECUTA MANTENIMIENTO', st['s_hdr']),
                   _P('PROPIETARIO DE LOS BIENES', st['s_hdr'])]]
    celdas_r = _celda_responsable('Técnico / ASISTSISTEMA', usr_realiza)
    celdas_p = _celda_responsable('Custodio / Servidor Judicial', usr_propiet)
    for c_r, c_p in zip(celdas_r, celdas_p):
        filas_resp.append([c_r, c_p])
    tresp = Table(filas_resp, colWidths=[9.1 * cm, 9.1 * cm])
    tresp.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  GRIS_HDR),
        ('BOX',           (0, 0), (-1, -1), 0.6, GRIS_HDR),
        ('LINEAFTER',     (0, 0), (0, -1),  0.5, GRIS_LINE),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [GRIS_FILA, BLANCO, GRIS_FILA, BLANCO]),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING',   (0, 1), (-1, -1), 6),
    ]))
    story.append(tresp)
    story.append(Spacer(1, 0.2 * cm))
    # ── 3. PERIODO + SEDE ─────────────────────────────────────────────────────
    periodo_inicio = _fmt_date(mantenimiento.fecha_inicio)
    periodo_fin    = _fmt_date(mantenimiento.fecha_termino)
    tper = Table([[
        _P(f'<b>Fecha inicio:</b>  {periodo_inicio}',  st['s_val_b']),
        _P(f'<b>Fecha término:</b>  {periodo_fin}',    st['s_val_b']),
        _P(f'<b>Sede:</b>  {sede["nombre"]}',          st['s_val']),
        _P(f'<b>Dirección:</b>  {sede["direccion"]} — {sede["distrito"]}', st['s_val']),
    ]], colWidths=[4 * cm, 4 * cm, 4.8 * cm, 5.4 * cm])
    tper.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_HDR2),
        ('BACKGROUND',    (0, 0), (-1, -1), GRIS_MOT),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('INNERGRID',     (0, 0), (-1, -1), 0.3, GRIS_LINE),
    ]))
    story.append(tper)
    story.append(Spacer(1, 0.25 * cm))
    # ── 4. TABLA DE BIENES INTERVENIDOS ───────────────────────────────────────
    story.append(_P('BIENES INTERVENIDOS', st['s_block_b']))
    story.append(Spacer(1, 0.1 * cm))
    headers_b = [
        'N°', 'Cód. Patrimonial', 'Descripción del Bien',
        'Estado func.\nantes', 'Estado func.\ndespués', 'Observaciones',
    ]
    widths_b = [0.7*cm, 3.4*cm, 5.2*cm, 2.8*cm, 2.8*cm, 3.3*cm]
    filas_b = [[_P(h, st['s_ch']) for h in headers_b]]
    for i, det in enumerate(mantenimiento.detalles.all(), 1):
        ef_antes   = det.estado_funcionamiento_antes   or '—'
        ef_despues = det.estado_funcionamiento_despues or '—'
        filas_b.append([
            _P(str(i),                          st['s_cn']),
            _P(det.codigo_patrimonial,          st['s_cn']),
            _P(det.tipo_bien_nombre,            st['s_cn']),
            _P(ef_antes,                        st['s_cn']),
            _P(ef_despues,                      st['s_cn']),
            _P(det.observacion_detalle or '',   st['s_cn_l']),
        ])
    tb = Table(filas_b, colWidths=widths_b)
    tb.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, 0),  GRIS_HDR2),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), [BLANCO, GRIS_FILA]),
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_HDR2),
        ('INNERGRID',     (0, 0), (-1, -1), 0.25, GRIS_LINE),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING',    (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING',   (0, 1), (0, -1),  4),
    ]))
    story.append(tb)
    story.append(Table(
        [[_P('', st['s_val']),
          _P(f'<b>Total bienes:</b>  {mantenimiento.detalles.count()}', st['s_est'])]],
        colWidths=[14.2 * cm, 4 * cm],
        style=[('TOPPADDING',    (0, 0), (-1, -1), 2),
               ('BOTTOMPADDING', (0, 0), (-1, -1), 2)],
    ))
    story.append(Spacer(1, 0.25 * cm))
    # ── 5. DATOS INICIALES / TRABAJOS REALIZADOS / DIAGNÓSTICO ───────────────
    bloques_txt = [
        ('Datos iniciales / Descripción del problema',
         mantenimiento.datos_iniciales or '—'),
        ('Trabajos realizados',
         mantenimiento.trabajos_realizados or '—'),
        ('Diagnóstico final',
         mantenimiento.diagnostico_final or '—'),
    ]
    filas_txt = []
    for titulo_blk, contenido in bloques_txt:
        filas_txt.append([
            _P(f'<b>{titulo_blk}:</b>', st['s_block_b']),
            _P(contenido,               st['s_block']),
        ])
    ttxt = Table(filas_txt, colWidths=[5.5 * cm, 12.7 * cm])
    ttxt.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GRIS_HDR2),
        ('INNERGRID',     (0, 0), (-1, -1), 0.3, GRIS_LINE),
        ('BACKGROUND',    (0, 0), (0, -1),  GRIS_MOT),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING',   (0, 0), (-1, -1), 6),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [GRIS_MOT, BLANCO, GRIS_FILA]),
    ]))
    story.append(ttxt)
    story.append(Spacer(1, 0.3 * cm))
    # ── 6. NOTA LEGAL ─────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRIS_LINE))
    story.append(Spacer(1, 0.15 * cm))
    story.append(_P(
        '<b>NOTA:</b>  '
        'El presente documento acredita la realización del mantenimiento preventivo/correctivo '
        'de los bienes muebles patrimoniales descritos, conforme a lo dispuesto en la '
        '<b>Directiva N° 001-2021-SBN</b> y las normas internas del Poder Judicial del Perú. '
        'Los trabajos realizados y el diagnóstico final quedan registrados como historial '
        'técnico del bien en el Sistema de Control Patrimonial (SISCONPAT). '
        'El propietario de los bienes manifiesta su conformidad con los trabajos ejecutados '
        'mediante su firma en el presente documento.',
        st['s_nota'],
    ))
    story.append(Spacer(1, 0.4 * cm))
    # ── 7. FIRMAS ─────────────────────────────────────────────────────────────
    fecha_aprobacion = _fmt(mantenimiento.fecha_aprobacion) \
                       if mantenimiento.fecha_aprobacion else ''
    columnas = [
        _bloque_firma(
            'Ejecutado por',
            aprobado=True,
            nombre=usr_realiza['nombre_completo'],
            cargo=usr_realiza.get('cargo', 'Asistente de Sistemas'),
            fecha=_fmt(mantenimiento.fecha_registro),
            st=st,
        ),
        _bloque_firma(
            'Visto Bueno — Administrador de Sede',
            aprobado=bool(mantenimiento.aprobado_por_adminsede_id),
            nombre=usr_aprobador['nombre_completo'],
            cargo=usr_aprobador.get('cargo', 'Administrador de Sede'),
            fecha=fecha_aprobacion,
            st=st,
        ),
        _bloque_firma(
            'Conformidad — Propietario de los Bienes',
            aprobado=False,   
            nombre=usr_propiet['nombre_completo'],
            cargo=usr_propiet.get('cargo', 'Servidor Judicial'),
            fecha='',
            st=st,
        ),
    ]
    n_filas = max(len(c) for c in columnas)
    filas_f = []
    for i in range(n_filas):
        filas_f.append([
            c[i] if i < len(c) else _P('', st['s_fdate'])
            for c in columnas
        ])
    tf = Table(filas_f, colWidths=[6.1 * cm, 6.1 * cm, 6.0 * cm])
    tf.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('LINEAFTER',     (0, 0), (1, -1),  0.4, GRIS_LINE),
        ('LINEABOVE',     (0, 0), (-1, 0),  0.8, GRIS_HDR),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(tf)
    # ── 8. FOOTER ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.2 * cm))
    story.append(HRFlowable(width='100%', thickness=0.4, color=GRIS_LINE))
    story.append(Paragraph(
        'dwr_log_mnt_formato_sisconpat_1',
        ParagraphStyle('foot', fontName='Helvetica', fontSize=6,
                       textColor=colors.grey, alignment=TA_RIGHT),
    ))
    doc.build(story)
    return buffer.getvalue()
