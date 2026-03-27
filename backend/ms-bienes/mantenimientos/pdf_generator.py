import io
import logging
from pathlib import Path
from django.conf import settings
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, Image, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, String, Rect
from shared.clients import MsUsuariosClient

logger = logging.getLogger(__name__)

# ── COLORES ──────────────────────────────────────────────────────────────────
GUINDA_PJ       = colors.HexColor('#9D1A23')
GRIS_CABECERA   = colors.HexColor('#F2F2F2')
GRIS_TEXTO_HDR  = colors.HexColor('#4A4A4A')
GRIS_LINEA      = colors.HexColor('#CCCCCC')
AZUL_SELLO_STAMP = colors.HexColor('#00318C')
BLANCO          = colors.white
NEGRO           = colors.black

# ── HELPERS DE CONSULTA (MANTENIDOS) ──────────────────────────────────────────

def _get_usuario_info(usuario_id, token):
    if not usuario_id: return {'nombre': '—', 'cargo': '—'}
    try:
        data = MsUsuariosClient.validar_usuario(usuario_id, token)
        return {'nombre': f"{data.get('first_name','')} {data.get('last_name','')}".strip(), 'cargo': data.get('cargo','—')}
    except: return {'nombre': f"ID: {usuario_id}", 'cargo': '—'}

def _get_sede_info(sede_id, token):
    try: return MsUsuariosClient.validar_sede(sede_id, token).get('nombre', f"Sede {sede_id}")
    except: return f"Sede {sede_id}"

def _get_modulo_info(modulo_id, token):
    if not modulo_id: return "—"
    try: return MsUsuariosClient.validar_modulo(modulo_id, token).get('nombre', f"Módulo {modulo_id}")
    except: return f"Módulo {modulo_id}"

def _sello_manual(label, aprobado):
    d = Drawing(3.5*cm, 1.6*cm)
    border = Rect(0, 0, 3.5*cm, 1.6*cm, rx=2, ry=2, fillColor=BLANCO, strokeColor=AZUL_SELLO_STAMP, strokeWidth=1.6)
    d.add(border)
    d.add(String(1.75*cm, 1.1*cm, label.upper(), fontName='Helvetica-Bold', fontSize=7, fillColor=AZUL_SELLO_STAMP, textAnchor='middle'))
    d.add(String(1.75*cm, 0.5*cm, 'V°B°' if aprobado else 'PENDIENTE', fontName='Helvetica-Bold', fontSize=9, fillColor=AZUL_SELLO_STAMP, textAnchor='middle'))
    return d

def _estilos():
    S = lambda name, **kw: ParagraphStyle(name, **kw)
    return {
        's_tit':    S('tit',   fontName='Helvetica-Bold', fontSize=14,   textColor=NEGRO,       alignment=TA_CENTER),
        's_num':    S('num',   fontName='Helvetica-Bold', fontSize=10,   textColor=NEGRO,       alignment=TA_RIGHT),
        's_fec':    S('fec',   fontName='Helvetica',      fontSize=9,    textColor=GRIS_TEXTO_HDR, alignment=TA_RIGHT),
        's_val':    S('val',   fontName='Helvetica',      fontSize=8.5,  textColor=NEGRO,       leading=11),
        's_lab_h':  S('labh',  fontName='Helvetica-Bold', fontSize=8,    textColor=BLANCO,      alignment=TA_CENTER),
        's_val_h':  S('valh',  fontName='Helvetica-Bold', fontSize=8.5,  textColor=NEGRO,       alignment=TA_CENTER),
        's_lab_d':  S('labd',  fontName='Helvetica-Bold', fontSize=8,    textColor=GUINDA_PJ,   leading=10),
        's_val_d':  S('vald',  fontName='Helvetica',      fontSize=8,    textColor=NEGRO,       alignment=TA_JUSTIFY, leading=10),
        's_fnomb':  S('fn',    fontName='Helvetica',      fontSize=7.5,  textColor=NEGRO,       alignment=TA_CENTER),
        's_stmp':   S('stmp',  fontName='Helvetica-Bold', fontSize=7.5,  textColor=AZUL_SELLO_STAMP, alignment=TA_CENTER),
    }

# ── CLASE PARA MANEJAR CABECERA Y FOLIO DINÁMICO ──────────────────────────────

class ReporteMantenimientoCanvas(SimpleDocTemplate):
    def __init__(self, filename, mantenimiento, tecnico, custodio, sede_nom, mod_nom, **kw):
        super().__init__(filename, **kw)
        self.mantenimiento = mantenimiento
        self.tecnico = tecnico
        self.custodio = custodio
        self.sede_nom = sede_nom
        self.mod_nom = mod_nom

    def _draw_header(self, canvas, doc):
        canvas.saveState()
        st = _estilos()
        
        # Logo
        logo_path = str(Path(settings.BASE_DIR) / 'static' / 'img' / 'pj_logo.png')
        if Path(logo_path).exists():
            canvas.drawImage(logo_path, doc.leftMargin, doc.height + doc.bottomMargin + 0.2*cm, width=2*cm, height=2*cm, preserveAspectRatio=True)
        
        # Título Centrado
        tit = Paragraph("INFORME TÉCNICO DE MANTENIMIENTO PREVENTIVO / CORRECTIVO", st['s_tit'])
        w, h = tit.wrap(19*cm, doc.topMargin)
        tit.drawOn(canvas, doc.leftMargin + 3*cm, doc.height + doc.bottomMargin + 0.8*cm)
        
        # Bloque Derecha (Orden y Fecha)
        f_reg = self.mantenimiento.fecha_registro.strftime('%d/%m/%Y %H:%M')
        blq_r = [
            Paragraph(f"ORDEN N°: {self.mantenimiento.numero_orden}", st['s_num']),
            Paragraph(f"Fecha Emisión: {f_reg}", st['s_fec']),
        ]
        curr_y = doc.height + doc.bottomMargin + 1.2*cm
        for p in blq_r:
            w, h = p.wrap(5.7*cm, doc.topMargin)
            p.drawOn(canvas, doc.width + doc.leftMargin - 5.7*cm, curr_y)
            curr_y -= 0.4*cm

        # Línea Guinda
        canvas.setStrokeColor(GUINDA_PJ)
        canvas.setLineWidth(2)
        canvas.line(doc.leftMargin, doc.height + doc.bottomMargin + 0.1*cm, doc.width + doc.leftMargin, doc.height + doc.bottomMargin + 0.1*cm)
        
        # Folio (X de Y) - Se dibuja al final en draw_footer o aquí mismo
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(GRIS_TEXTO_HDR)
        pag_info = f"Folio: {doc.page} de %s"
        canvas.drawRightString(doc.width + doc.leftMargin, doc.height + doc.bottomMargin + 0.2*cm, pag_info % self.total_pages)
        
        canvas.restoreState()

    def build(self, flowables):
        # Primero procesamos para saber el total de páginas
        self.total_pages = 0
        def count_pages(canvas, doc):
            self.total_pages = canvas.getPageNumber()
            
        # Ejecutar la construcción
        super().build(flowables, onFirstPage=self._draw_header, onLaterPages=self._draw_header)

# ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

def generar_pdf_mantenimiento(mantenimiento, cookie=''):
    buffer = io.BytesIO()
    st = _estilos()

    # Datos iniciales
    tecnico = _get_usuario_info(mantenimiento.usuario_realiza_id, cookie)
    custodio = _get_usuario_info(mantenimiento.usuario_propietario_id, cookie)
    sede_nom = _get_sede_info(mantenimiento.sede_id, cookie)
    mod_nom  = _get_modulo_info(mantenimiento.modulo_id, cookie)

    # Configurar documento
    doc = ReporteMantenimientoCanvas(
        buffer,
        mantenimiento=mantenimiento,
        tecnico=tecnico,
        custodio=custodio,
        sede_nom=sede_nom,
        mod_nom=mod_nom,
        pagesize=landscape(A4),
        rightMargin=1*cm, leftMargin=1*cm, topMargin=2.5*cm, bottomMargin=1*cm
    )

    story = []

    # 1. Datos Generales (Solo se muestra una vez al inicio)
    f_reg = mantenimiento.fecha_registro.strftime('%d/%m/%Y %H:%M') if mantenimiento.fecha_registro else '—'
    f_ini = mantenimiento.fecha_inicio_mant.strftime('%d/%m/%Y') if mantenimiento.fecha_inicio_mant else '—'
    f_ter = mantenimiento.fecha_termino_mant.strftime('%d/%m/%Y') if mantenimiento.fecha_termino_mant else '—'
    estado_mant = mantenimiento.estado_mantenimiento if hasattr(mantenimiento, 'get_estado_mantenimiento_display') else mantenimiento.estado_mantenimiento

    data_gen = [
        [Paragraph(f"<b>SEDE:</b> {sede_nom}", st['s_val']), 
         Paragraph(f"<b>MÓDULO:</b> {mod_nom}", st['s_val']),
         Paragraph(f"<b>ESTADO:</b> {estado_mant}", st['s_val'])],
        
        [Paragraph(f"<b>CUSTODIO:</b> {custodio['nombre']}", st['s_val']), 
         Paragraph(f"<b>TÉCNICO:</b> {tecnico['nombre']}", st['s_val']),
         Paragraph(f"<b>F. REGISTRO:</b> {f_reg}", st['s_val'])],

        [Paragraph(f"<b>FECHA INICIO:</b> {f_ini}", st['s_val']), 
         Paragraph(f"<b>FECHA TÉRMINO:</b> {f_ter}", st['s_val']),
         Paragraph("", st['s_val'])], 
    ]
    tg = Table(data_gen, colWidths=[9.2*cm, 9.2*cm, 9.2*cm])
    tg.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (-1,-1), GRIS_CABECERA),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tg)
    story.append(Spacer(1, 0.5*cm))

    # 2. Listado de Bienes
    for d in mantenimiento.detalles.all():
        bien = d.bien
        h_titulos = [Paragraph(x, st['s_lab_h']) for x in ["TIPO BIEN", "MARCA", "MODELO", "SERIE", "CÓD. PATRIMONIAL"]]
        v_valores = [Paragraph(str(x or "—"), st['s_val_h']) for x in [bien.tipo_bien.nombre, bien.marca.nombre, bien.modelo, bien.numero_serie, bien.codigo_patrimonial]]

        detalles_mant = [
            [Paragraph("ESTADO FUNC. INICIAL:", st['s_lab_d']), Paragraph(d.estado_funcionamiento_inicial.nombre if d.estado_funcionamiento_inicial else "—", st['s_val_d'])],
            [Paragraph("DIAGNÓSTICO INICIAL:", st['s_lab_d']), Paragraph(d.diagnostico_inicial or "—", st['s_val_d'])],
            [Paragraph("TRABAJO REALIZADO:", st['s_lab_d']), Paragraph(d.trabajo_realizado or "—", st['s_val_d'])],
            [Paragraph("DIAGNÓSTICO FINAL:", st['s_lab_d']), Paragraph(d.diagnostico_final or "—", st['s_val_d'])],
            [Paragraph("ESTADO FUNC. FINAL:", st['s_lab_d']), Paragraph(d.estado_funcionamiento_final.nombre if d.estado_funcionamiento_final else "—", st['s_val_d'])],
            [Paragraph("OBSERVACIÓN DETALLE:", st['s_lab_d']), Paragraph(d.observacion_detalle or "Ninguna", st['s_val_d'])],
        ]

        t_detalles = Table(detalles_mant, colWidths=[5*cm, 22.2*cm])
        t_detalles.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LINEBELOW', (0,0), (0,-1), 0.5, GRIS_LINEA)]))

        t_bien_full = Table([h_titulos, v_valores, [t_detalles, '', '', '', '']], colWidths=[5.5*cm]*5)
        t_bien_full.setStyle(TableStyle([
            ('SPAN', (0,2), (4,2)),
            ('BACKGROUND', (0,0), (4,0), GUINDA_PJ),
            ('INNERGRID', (0,0), (4,1), 0.5, colors.grey),
            ('BOX', (0,0), (-1,-1), 0.8, NEGRO),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(KeepTogether(t_bien_full))
        story.append(Spacer(1, 0.6*cm))

    # 3. Firmas
    ap_admin = mantenimiento.aprobaciones.filter(rol_aprobador='adminSede', accion='APROBADO').last()
    admin_info = _get_usuario_info(ap_admin.usuario_id, cookie) if ap_admin else {'nombre': '—'}

    f_tec = [_sello_manual("Técnico Sistemas", True), Spacer(1, 0.15*cm), Paragraph(tecnico['nombre'], st['s_fnomb']), Paragraph("SISTEMAS", st['s_stmp'])]
    f_adm = [_sello_manual("V°B° Administración", ap_admin is not None), Spacer(1, 0.15*cm), Paragraph(admin_info['nombre'], st['s_fnomb']), Paragraph("ADMINISTRADOR DE SEDE", st['s_stmp'])]
    f_usu = [HRFlowable(width="80%", thickness=1, color=NEGRO, spaceBefore=0.8*cm), Spacer(1, 0.15*cm), Paragraph(custodio['nombre'], st['s_fnomb']), Paragraph("CONFORMIDAD USUARIO", st['s_stmp'])]

    tf = Table([[f_tec, f_adm, f_usu]], colWidths=[9.2*cm]*3)
    tf.setStyle(TableStyle([('ALIGN',(0,0),(-1,-1),'CENTER'), ('VALIGN',(0,0),(-1,-1),'BOTTOM')]))
    story.append(tf)

    # Construir con la clase personalizada
    doc.build(story)
    return buffer.getvalue()