import os
import subprocess
from pathlib import Path
from datetime import date

from django.conf import settings
from django.utils import timezone

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


MEDIA_BAJAS      = Path(settings.MEDIA_ROOT) / 'bajas'
MEDIA_BAJAS_PDF  = MEDIA_BAJAS / 'pdfs'
MEDIA_BAJAS_DOCX = MEDIA_BAJAS / 'docx'

GUINDA    = RGBColor.from_string('7F1D1D')
BLANCO    = RGBColor.from_string('FFFFFF')
NEGRO     = RGBColor.from_string('000000')
GRIS_OSC  = RGBColor.from_string('374151')
GRIS_BORD = 'CCCCCC'
GUINDA_HX = '7F1D1D'
FILA_PAR  = 'F8F8F8'


def _ensure_dirs():
    MEDIA_BAJAS_PDF.mkdir(parents=True, exist_ok=True)
    MEDIA_BAJAS_DOCX.mkdir(parents=True, exist_ok=True)


def _set_cell_bg(cell, hex_color: str):
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)


def _cell_borders(table):
    for row in table.rows:
        for cell in row.cells:
            tc    = cell._tc
            tcPr  = tc.get_or_add_tcPr()
            tcBdr = OxmlElement('w:tcBorders')
            for side in ('top', 'left', 'bottom', 'right'):
                b = OxmlElement(f'w:{side}')
                b.set(qn('w:val'),   'single')
                b.set(qn('w:sz'),    '4')
                b.set(qn('w:space'), '0')
                b.set(qn('w:color'), GRIS_BORD)
                tcBdr.append(b)
            tcPr.append(tcBdr)


def _remove_all_borders(table):
    for row in table.rows:
        for cell in row.cells:
            tc    = cell._tc
            tcPr  = tc.get_or_add_tcPr()
            tcBdr = OxmlElement('w:tcBorders')
            for side in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
                b = OxmlElement(f'w:{side}')
                b.set(qn('w:val'), 'none')
                tcBdr.append(b)
            tcPr.append(tcBdr)


def _run(paragraph, text: str, *, bold=False, size=10, color=None):
    run       = paragraph.add_run(str(text))
    run.bold  = bold
    run.font.size = Pt(size)
    run.font.color.rgb = color or NEGRO
    return run


def _section_title(doc, numero: str, titulo: str):
    p   = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(f'{numero}. {titulo.upper()}')
    run.bold           = True
    run.font.size      = Pt(11)
    run.font.color.rgb = GUINDA
    pPr  = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    btm  = OxmlElement('w:bottom')
    btm.set(qn('w:val'),   'single')
    btm.set(qn('w:sz'),    '6')
    btm.set(qn('w:space'), '1')
    btm.set(qn('w:color'), GUINDA_HX)
    pBdr.append(btm)
    pPr.append(pBdr)
    return p


def _narrative_paragraph(doc, text: str):
    if not text or not text.strip():
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after  = Pt(2)
        _run(p, '—')
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after  = Pt(2)
    _run(p, text.strip())


def generar_docx_baja(baja) -> str:
    _ensure_dirs()

    doc     = Document()
    section = doc.sections[0]
    section.page_width    = Cm(21)
    section.page_height   = Cm(29.7)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)
    section.top_margin    = Cm(2.5)
    section.bottom_margin = Cm(2.5)

    for sname in ('Normal', 'Body Text'):
        try:
            sty = doc.styles[sname]
            sty.font.name = 'Arial'
            sty.font.size = Pt(10)
        except KeyError:
            pass

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_inst.add_run('Corte Superior de Justicia de Lima Norte\n')
    r1.bold            = True
    r1.font.size       = Pt(13)
    r1.font.color.rgb  = GUINDA
    r2 = p_inst.add_run('Gerencia de Administración Distrital — Coordinación de Informática')
    r2.font.size       = Pt(10)
    p_inst.paragraph_format.space_after = Pt(4)

    doc.add_paragraph()

    fecha_str = (
        timezone.localtime(baja.fecha_registro).strftime('%d de %B de %Y')
        if baja.fecha_registro
        else date.today().strftime('%d/%m/%Y')
    )
    p_fecha           = doc.add_paragraph()
    p_fecha.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    _run(p_fecha, f'Lima, {fecha_str}')
    p_fecha.paragraph_format.space_after = Pt(8)

    p_tit = doc.add_paragraph()
    r_t   = p_tit.add_run(f'INFORME N° {baja.numero_informe}')
    r_t.bold           = True
    r_t.font.size      = Pt(12)
    r_t.font.color.rgb = NEGRO
    p_tit.paragraph_format.space_after = Pt(8)

    modulo_txt = baja.modulo_elabora_nombre or ''
    sede_txt   = baja.sede_elabora_nombre   or ''
    cargo_sede_modulo = baja.cargo_elabora or ''
    if sede_txt and modulo_txt:
        cargo_sede_modulo = f'{baja.cargo_elabora or ""} — {modulo_txt} — {sede_txt}'
    elif sede_txt:
        cargo_sede_modulo = f'{baja.cargo_elabora or ""} — {sede_txt}'

    encab = doc.add_table(rows=4, cols=2)
    encab.alignment = WD_TABLE_ALIGNMENT.LEFT
    etiquetas = ['A', 'De', 'Asunto', 'Referencia']
    valores   = [
        f': {baja.nombre_destino or "—"}\n  {baja.cargo_destino or ""}',
        f': {baja.nombre_elabora or "—"}\n  {cargo_sede_modulo}',
        f': Informe técnico de baja de bienes patrimoniales — {sede_txt}',
        f': {baja.numero_informe}',
    ]
    col_w = [Cm(2.5), Cm(14)]
    for i, (etiq, val) in enumerate(zip(etiquetas, valores)):
        row            = encab.rows[i]
        row.cells[0].width = col_w[0]
        row.cells[1].width = col_w[1]
        p0 = row.cells[0].paragraphs[0]
        r0 = p0.add_run(etiq)
        r0.bold           = True
        r0.font.size      = Pt(10)
        p1 = row.cells[1].paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(10)
    _remove_all_borders(encab)

    doc.add_paragraph()

    p_intro           = doc.add_paragraph()
    p_intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    _run(p_intro, (
        'Tengo el agrado de dirigirme a usted, en atención al asunto y en relación '
        'al documento de la referencia, para informarle lo siguiente:'
    ))
    p_intro.paragraph_format.space_after = Pt(8)

    _section_title(doc, '1', 'Antecedentes')
    _narrative_paragraph(doc, baja.antecedentes)

    _section_title(doc, '2', 'Análisis')
    detalles = list(baja.detalles.select_related('motivo_baja').all())
    if detalles:
        p_intro2 = doc.add_paragraph()
        p_intro2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_intro2.paragraph_format.space_after = Pt(4)
        _run(p_intro2, 'Se procedió con la inspección técnica de los siguientes bienes:')

        headers = ['Tipo', 'Marca', 'Modelo', 'N° Serie', 'Cód. Patrimonial', 'Estado', 'Motivo Baja']
        col_ws  = [Cm(3.3), Cm(2.2), Cm(2.2), Cm(2.2), Cm(2.8), Cm(2.5), Cm(2.5)]
        tb = doc.add_table(rows=1, cols=len(headers))
        tb.alignment = WD_TABLE_ALIGNMENT.LEFT

        hrow = tb.rows[0]
        for j, (hdr, w) in enumerate(zip(headers, col_ws)):
            cell = hrow.cells[j]
            cell.width = w
            _set_cell_bg(cell, GUINDA_HX)
            p   = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(hdr)
            run.bold           = True
            run.font.size      = Pt(9)
            run.font.color.rgb = BLANCO

        for idx, det in enumerate(detalles):
            row = tb.add_row()
            bg  = FILA_PAR if idx % 2 == 0 else 'FFFFFF'
            vals = [
                det.tipo_bien_nombre,
                det.marca_nombre,
                det.modelo,
                det.numero_serie,
                det.codigo_patrimonial,
                det.estado_funcionamiento,
                getattr(det.motivo_baja, 'nombre', '—'),
            ]
            for j, (val, w) in enumerate(zip(vals, col_ws)):
                cell = row.cells[j]
                cell.width = w
                _set_cell_bg(cell, bg)
                p   = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(val or '—')
                run.font.size = Pt(9)

        _cell_borders(tb)
        doc.add_paragraph()

        for det in detalles:
            if any([det.diagnostico_inicial, det.trabajo_realizado, det.diagnostico_final]):
                p_sub = doc.add_paragraph()
                p_sub.paragraph_format.space_before = Pt(6)
                p_sub.paragraph_format.space_after  = Pt(2)
                rs = p_sub.add_run(f'Bien: {det.tipo_bien_nombre} — {det.codigo_patrimonial}')
                rs.bold           = True
                rs.font.size      = Pt(10)
                rs.font.color.rgb = GRIS_OSC

                for label, valor in [
                    ('Diagnóstico inicial', det.diagnostico_inicial),
                    ('Trabajo realizado',   det.trabajo_realizado),
                    ('Diagnóstico final',   det.diagnostico_final),
                ]:
                    if valor:
                        p = doc.add_paragraph()
                        p.paragraph_format.left_indent = Cm(0.5)
                        rl = p.add_run(f'{label}: ')
                        rl.bold           = True
                        rl.font.size      = Pt(10)
                        rv = p.add_run(valor)
                        rv.font.size = Pt(10)

    if baja.analisis:
        p_anal = doc.add_paragraph()
        p_anal.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_anal.paragraph_format.space_before = Pt(4)
        _run(p_anal, baja.analisis)

    _section_title(doc, '3', 'Conclusiones')
    _narrative_paragraph(doc, baja.conclusiones)

    _section_title(doc, '4', 'Recomendaciones')
    _narrative_paragraph(doc, baja.recomendaciones)

    doc.add_paragraph()
    p_cierre           = doc.add_paragraph()
    p_cierre.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    _run(p_cierre, 'Es todo cuanto informo a usted para los fines pertinentes.')
    p_cierre.paragraph_format.space_after = Pt(4)

    p_at = doc.add_paragraph()
    _run(p_at, 'Atentamente.')
    p_at.paragraph_format.space_after = Pt(48)

    tf    = doc.add_table(rows=2, cols=1)
    tf.alignment = WD_TABLE_ALIGNMENT.CENTER
    _remove_all_borders(tf)

    top_bdr = tf.rows[0].cells[0]._tc.get_or_add_tcPr()
    tcBdr   = OxmlElement('w:tcBorders')
    top_el  = OxmlElement('w:top')
    top_el.set(qn('w:val'),   'single')
    top_el.set(qn('w:sz'),    '4')
    top_el.set(qn('w:color'), '000000')
    tcBdr.append(top_el)
    top_bdr.append(tcBdr)

    p_nom = tf.rows[0].cells[0].paragraphs[0]
    p_nom.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rn = p_nom.add_run(baja.nombre_elabora.upper() if baja.nombre_elabora else '___________________________')
    rn.bold           = True
    rn.font.size      = Pt(10)

    p_crg = tf.rows[1].cells[0].paragraphs[0]
    p_crg.alignment = WD_ALIGN_PARAGRAPH.CENTER
    rc = p_crg.add_run(cargo_sede_modulo or 'Asistente de Informática')
    rc.font.size = Pt(10)

    ts       = (
        timezone.localtime(baja.fecha_registro).strftime('%Y%m%d%H%M%S')
        if baja.fecha_registro
        else timezone.now().strftime('%Y%m%d%H%M%S')
    )
    filename = f'BAJ-{baja.pk}-{ts}.docx'
    docx_abs = MEDIA_BAJAS_DOCX / filename
    doc.save(str(docx_abs))
    return str(docx_abs)


def convertir_docx_a_pdf(docx_abs_path: str) -> str:
    pdf_dir = str(MEDIA_BAJAS_PDF)
    result  = subprocess.run(
        [
            'libreoffice', '--headless',
            '--convert-to', 'pdf',
            '--outdir',     pdf_dir,
            docx_abs_path,
        ],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f'LibreOffice conversion failed: {result.stderr}')
    base     = Path(docx_abs_path).stem
    pdf_path = Path(pdf_dir) / f'{base}.pdf'
    if not pdf_path.exists():
        raise RuntimeError(f'PDF not found after conversion: {pdf_path}')
    return str(pdf_path)


def generar_documentos_baja(baja) -> dict:
    docx_abs  = generar_docx_baja(baja)
    pdf_abs   = convertir_docx_a_pdf(docx_abs)
    media_root = str(settings.MEDIA_ROOT)
    docx_rel  = docx_abs.replace(media_root, '').lstrip(os.sep)
    pdf_rel   = pdf_abs.replace(media_root, '').lstrip(os.sep)
    return {
        'docx_path': docx_rel,
        'pdf_path':  pdf_rel,
    }