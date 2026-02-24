# 🏛️ SISCONPAT — Sistema de Control Patrimonial del Poder Judicial
## Corte Superior de Justicia de Lima Norte
Se detalla a continuación la descripción del sistema web de gestion de activos con arquitectura de microservicios(por ahora será de activos informaticos como cpu, monitor, teclado, etc pero tambien en un futuro se agregará implementará para otro tipo de activos como muebles escritorio, mesas, etc).

A. USUARIOS: LOS QUE VAN A USAR EL SISTEMA, ELCUAL SERIAN LOS PERFILES SYSADMIN, COORDSISTEMA,ASISTSISTEMA,ADMINSEDE,Y SEGURSEDE.
EL SYSADMIN TIENE ACCESO A TODO Y ES QUIEN REGISTRA A USUARIOS, DA POERMISOS/ROLES. 
COORDSISTEMA ES QUIEN TRASLADA LOS BIENES DE UNA SEDE A OTRA Y USUALMENTE A QUIEN ASIGNA ES AL ASISTSISTEMA; ES QUIEN REGISTRA BIENES AL SISTEMA POR PRIMERA VEZ Y CUANDO SE HACE ESTO SE ASIGNA A SI MISMO ADEMAS DE TENER LA POSIBILIDAD DE ACTUALIZAR; REVISA LOS MANTENIMIENTOS GENERADOS Y REGISTRADOS EN SISTEMA DE TODAS LAS SEDES, VE LAS TRANSFERENCIAS Y PUEDE VER TODOS LOS BIENES DE TODAS LAS SEDES, INCLUSO PUEDE VER EL MENU REPORTES. 
ASISTSISTEMA SE ENCARGA DE REALIZAR LA ASIGNACION DE BIENES DE SU PROPIA SEDE O DE LAS SEDES ENCARGADAS, DENTRO DE CADA SEDE HAY USUARIOS JURISDICCIONALES QUE DEBEN DE TENER SU PROPIO KITS DE ACTIVOS INFORMATICOS (PRINMCIPALMENTE CPU,MONITOR,TECLADO,MOUSE Y ALTERNATIVAMNETE UN ESTABILIZADOR,CAMARA WEB,AURICULARES E IMPRESORA) Y EL ASISTSISTEMA ES QUIEN LE ASIGNA ESTOS BIENES. TAMBIEN HACE LOS MANTENIMIENTOS PREVENTIVOS QUE ES LA LIMPIEZA INTERNA DE COMPONENTES DEL CPU, MONITOR ,TECLADO, IMPRESORAS LASER O MULTIFUNCIONALES, PROYECTOR, ENTRE OTROS ACTIVOS INFORMATICOS. HACE LA BAJA O SALIDA DEL ACTIVO DE LA INSTITUCION POR OBSOLECENCIA, DONACION, FALLAS OPERATIVAS, ETC Y ANTE ELLO  LA BAJA SE SUSTENTA CON UN INFORME TECNICO QUE REALIZA ESTE PERFIL EN EL MISMO SISTEMA Y ESTE SISTEMA DEBERIA DE EESTAR PREPARADO PARA EMITIR EL DOCUMENTO QUE SERA LLENADO POR EL ASISTSISTEMA. 
TANTO EL TRASLADO, EL MANTENIMIENTO, DEBE DE TENER LA APROBACION POR SISTEMA DEL ADMINSEDE; LA BAJA O SALIDA, DEBE DE TENER LA APROBACION DEL COORDSISTEMA (LAS APROBACIONES DEBERIA SER UNA OPCION O UN CHECK A SELECCIONARSE EN LOS MENUS RESPECXTIVOS COMO POR EJEMPLO EL ADMINSEDE TENGA OPCION DE VER EL MENU DE MANTENIMIENTO Y DFE TRANSFERENCIAS DE SU SEDE Y VEA EL PROCESO QUE HA HECHO EN SISTEMA EL ASISTSISTEMA, REVISE LA INFORMACION LLENADA POR ESTE Y CON ESE CHECK DE SU APROBACION PARA QUE RECIEN ALLI SE APRUEBA ESTAS TRANSACCIONES). TANTO EL MANTENIMIENTO COMO LA TRANSFERENCIA/ASIGNACION DE BIENES, DEBERIA APERTURARSE UN DOCUMENTO PDF CON LA INFORMACION DE ESTOS PARA QUE PUEDAN SER FIRMADOS POR EL USUARIO DUEÑO DEL BIEN. 
TANTO LA TRANSFERENCIA COMO EL MANTENIMIENTO, PUEDEN HACERSE DE UNO O VARIOS BIENES, LA DIFERENCIA ES QUE EN EL MANTENIMIENTO, TIENE QUE SER ACTIVOS DEL MISMO USUARIO; EN LA TRANSFERENCIA LOS BIENES PUEDEN SER DE DISTINTOS USUARIOS INICIALES, PERO HACIA UN SOLO USUARIO INICIAL. ESTE PERFIL PUEDE VER BIENES DE TODAS LAS SEDES, SOLO VER.
ADMINSEDE PUEDE VER ACTIVOS/BIENES DE SU PROPIA SEDE POR SEGURIDAD, TAMBIEN MANTENIMIENTO (APROBARLAS)Y BAJAS SALIDAS HECHAS DE SU PROPIA SEDE (PREVIAMENTE APROBADAS POR COORDSISTEMA).
SEGURSEDE ES QUIEN SE ENCARGA DE APROBAR LAS ENTRADAS O SALIDAS DE BIENES/AXCTIVOS DE LA SEDE EL CUAL SON GUARDIAS DE SEGURIDAD. SOLO PUEDE VER ESAS APROBACIONES DE SU PROPIA SEDE QUE CUIDAN. SI ESTE PERFIL NO DA SU APROBACION, LOS BIENES/ACTIVOS NO PODRAN INGRESAR/SALIR DE LA SEDE A PESAR QUE HAYAN SIDO APROBADAS POR EL COORDSISTEMA.
CUANDO SE HACE UN TRASLADO DE BIENES/ACTIVOS DE SEDE A SEDE, SE TIENE QUE EMITIR UNA ALERTA O AVISO MEDIANTE SISTEMA A LOS PERFILES ASISTSISTEMA Y ADMINSEDE DE LA SEDE INICIAL, PORQUE ES UNA MEDIDA DE SEGURIDAD Y QUIEN APRUEBA ELLO ES EL ADMINSEDE PORQUE ESTE PERFIL TIENE EL PUESDO DE COORDINADOR DE LA SEDE O SUB ADMINISTRADOR DE LA SEDE (PUESTO LABORAL ENCARGADO DE LA SEDE) Y ES QUIEN EN POCAS PALABRAS, LEGALMENTE ES EL ENCARGADO QUE LOS BIENES/ACTIVOS ESTEN COMPLETOS FISICA Y LOGICAMENTE.
Los usuarios de la institución por ahora, no acceden al sistema pero es quien se asigna/trasladan los bienes (a futuro podrían registrarse en la tabla de datos USUARIO diferenciándose con la opción es_usuario_sistema). 
Tanto usuarios de sistema como los que no son, sus datos se buscan de una base de datos independientes que le brindan lo siguiente:
dni 
    nombres 
    apellidos 
    escalafon 
    cargo 
    area 
    modulo
EMPRESA (CORTE SUPERIOR DE JUSTICIA DE LIMA NORTE, CORTE SUPERIOR DE JUSTICIA DE LIMA SUR, CORTE SUPERIOR DE JUSTICIA DE LIMA ESTE, ETC)
En Sistema lo que se guarda para los usuarios de sistema como los que no son, adicional a estos datos arriba mencionado, son lo siguiente: 
es_usuario_sistema 
rol    
sede  (el sistema debería permitirle al usuario que no es de sistema para asignarle una sede, un modulo, un area)
fecha registro
    fecha_actualizacion 
fecha de baja
 estado 
recordar que el usuario de sistema puede tener uno o varias sedes asignadas. El usuario que no es de sistema,  podría irse a otra sede de apoyo o trasladado por rrhh para trabajar físicamente en otra área, entonces quien actualiza ese dato de la sede en este sistema es el COORDSISTEMA MEDIANTE UNDOCUMENTO QUE SERIA UN MEMORANDO DE ASIGNACION O REASIGNACION EMITIDO POR RHH.
ENTONCES SERIA DISTRIBUIDO: SEDE (CENTRAL,CANTA,ESTAÑOS,ETC) ,AREA(JUZGADO….,POOL ESPECIALISTAS CAUSA, POOL ESPECIALISTAS DE AUDIENCIA,POOL ASISTENTES, INFORMATICA, ADMINISTRACION DE SEDE), MODULO (NCPP, CIVIL, VIOLENCIA CONTRA LA MUJER,ETC)

B. BIENES: POR AHORA SE DA PRIORIDAD A LOS BIENES/ACTIVOS INFORMATICOS (PERO EL SISTEMA DEBERIA TENER LISTO LA OPCION QUE SE REGISTREN BIENES MUEBLES E INMUEBLES); LOS DATOS PRINCIPALES DE LOS ACTIVOS INFORMATICOS SON ESTOS:
tipo_bien,marca,  modelo,   numero_serie ,  codigo_patrimonial ,  estado_bien (activo, inactivo,),  estado_funcionamiento (operativo,averiado,inoperativo),  regimen_tenencia ,  observacion ,  fecha_COMPRA,  numero_orden_compra ,  fecha_vencimiento_garantia ,  fecha_instalacion,  fecha_ultimo_inventario ,    usuario_asignado(USUARIO DE LA INSTITUCION) ,    sede (DEBERIA MOSTRAR EL MODULO Y EL AREA) ,  usuario_registra(USUARIO DE SISTEMA QUE ESTA REGISTRANDO ESTE BIEN/ACTIVO INFORMATICO) ,  fecha_registro ,  fecha_baja ,  motivo_baja 
Si se registra un CPU debería adicional mostrarse los siguientes datos:
    hostname 
    dominio_equipo 
    direccion_ip 
    direccion_mac 
    tipo_computadora 
    funcion_cpu 
    procesador_tipo 
    procesador_cantidad 
    procesador_nucleos 
    procesador_velocidad 
    sistema_operativo 
    arquitectura_bits 
    licencia_so 
    version_office 
    licencia_office 
    capacidad_ram_gb 
    cantidad_modulos_ram 
    tipo_disco 
    capacidad_disco_gb 
    cantidad_discos 
    tipo_tarjeta_video 
Si se registra una IMPRESORA debería adicional mostrarse los siguientes datos:
    tipo_impresioN
    impresion_color 
    memoria_ram_mb 
    resolucion_maxima_ppp 
    interfaz_conexion 
    tamano_carro 
    tamano_hojas_soportadas 
    unidad_duplex 
    velocidad_impresion_ppm 
    conexion_red 
    alimentacion_ac 
Si se registra un MONITOR, debería adicional mostrarse los siguientes datos:
tipo_monitor 
    tamano_pulgadas
el sistema debería mostrar opciones en ese modulo de bienes, la opción para registrar Marca
TipoBien
TipoMonitor
TamanoCarroImpresora
TipoInterfazConexion
TipoTintaImpresion
TipoDiscoDuro
ArquitecturaBits
TipoCpu
RegimenTenenciaBien
EstadoFuncionamientoBien
EstadoActualBien
C. EXISTEN APROX 20 SEDES. LA INSTITUCION ES EL PODER JUDICIAL DEL PERU, PERO ESTA INSTITUCION TIENE APROXIMADAMENTE 24 CORTES SUPERIORES. NUESTRO PROYECTO SE ENMARCA EN LA CORTE SUPERIOR DE JUSTICIA DE LIMA NORTE Y POR ENDE CUANDO SE GUARDEN ESTOS DATOS TIENE QUE EN MARCARSE QUE ES PARA EL PODER JUDICIAL Y PARA ESTA CORTE SUPERIOR. CADA SEDE TIENE UNO O VARIOS JUZGADOS COMO POR EJEMPLO:
SEDE CANTA, JUZGADO DE INVESTIGACION PREPARATORIA, JUZGADO PENAL UNIPERSONAL TRANSITORIO, JUZGADO CIVIL, JUZGADO DE PAZ LETRADO; SEDE ESTAÑOS, 1ER JUZGADO PENAL COLEGIADO TRANSITORIO, 2DO JUZGADO PENAL COLEGIADO TRANSITORIO, JUZGADO PENAL COLEGIADO PERMANENTE. 
CADA JUZGADO PERTENECE A UN MODULO POR EJEMPLO JUZGADO DE INVESTIGACION PREPARATORIA, JUZGADO PENAL UNIPERSONAL TRANSITORIO, 1ER JUZGADO PENAL COLEGIADO TRANSITORIO, 2DO JUZGADO PENAL COLEGIADO TRANSITORIO, JUZGADO PENAL COLEGIADO PERMANENTE, PERTENECEN AL NUEVO CODIGO PROCESAL PENAL (NCPP). 
ENTONCES EL DISEÑO DE LA SEDE PARA LAS TABLAS SERIA QUE DENTRO DE LA SEDE EXISTE UN AMBIENTE QUE ES LA PARTE JURISDICCIONAL EL CUAL TRABAJAN LOS ABOGADOS (PERFIL LABORAL JUECES SUPERNUMERARIO,JUEZ SUPERIOR, JUEZ TITULAR, ESPECIALISTA DE CAUSA, ESPECIALISTA DE AUDIENCIA, ESPECIALISTA LEGAL, ASISTENTE JURISDICCIONAL, SECRETARIO, COORDINADOR DE CAUSA, COORDINADOR DE AUDIENCIA), LA PARTE ADMINISTRATIVA (PERFIL LABORAL SUB ADMINISTRADOR, COORDINADOR DE SEDE, ASISTENTE DE INFORMATICA, COORDINADOR DE INFORMATICA, ANALISTA DE INFORMATICA). 
LA SEDE DEBERIA MOSTRAR DIRECCION, DISTRITO, PROVINCIA, DEPARTAMENTO Y ESTADO, RECORDAR QUE UN DISTRITO PUEDE TENER VARIAS DIRECCIONES;UNA PROVINCIA PUEDE TENER VARIOS DISTRITOS, UN DEPARTAMENTE PUEDE TENER VARIAS PROVINCIAS PERO UNA SEDE TIENE UNA SOLA DIRECCION
ENTONCES SERIA DISTRIBUIDO: 
•	SEDE (CENTRAL,CANTA,ESTAÑOS,ETC) , puede tener uno o varios módulos.
•	MODULO (NCPP, CIVIL, FLAGRANCIA,VIOLENCIA CONTRA LA MUJER,ETC), puede tener una o varias áreas.
•	AREA (JUZGADO investigacion….,POOL ESPECIALISTAS CAUSA, POOL ESPECIALISTAS DE AUDIENCIA,POOL ASISTENTES, INFORMATICA, ADMINISTRACION DE SEDE)
El sistemadebe de permitir crear esas sedes modulo, área y poder seleccionarle a cada sede sus módulos o area
D. roles/ permisos, los roles son los perfiles ya explicados el cual el sistema debería de tener ese menú bien planteado para poder registrar nuevos, ver los registrados así estén activos o inactivos y poder modificar o editarlos, el cual además del nombre, debería de tener la opción de describir ese rol/perfil. Los permisos es para los usuarios que acceden al sistema según su perfil, por ejemplo el SYSADMIN tiene permiso de acceder a cualquier modulo del sistema (permiso total), COORDSISTEMA a  ver bienes, hacer y ver traslados de todas las sedes, y así en los demás perfiles que ya se dijo arriba qué pueden hacer. Se debería planear crear perfil/rol usuarioCorte porque se planea que un usuario comun que se ha hecho el traslado/asignación de bienes(por ejemplo un especialista de causa) pueda firmar mediante sistema o hacer un check de VB para que culmine la transacción. En general, un rol puede tener uno o varios permisos dependiendo que es lo que quiere realizar (ver, registrar actualizar, eliminar) en cualquier ´parte del sistema.
El mantenimiento sus estados serian creado/registrado, en proceso, pendiente_aprobacion, devuelto, Atendido,cancelado. Debería mostrar los datos de el bien o los bienes, código patrimonial, tipo de bien, usuario a quien pertenece, fecha del registro, del comienzo del mantenimiento por parte del asistente informática, fecha de termino (seria cuando pase a estado aprobacion ), fecha de cancelación y motivo de cancelación de ser el caso.  Se tiene que llenar datos del mantenimiento realizado como:
•	datos iniciales (cómo se encontró el equipo, si se puede agregar imágenes seria genial)
•	trabajos realizados(limpieza interna, limpieza externa, formateos de cpu, reparación de componentes internos, etc), 
•	diagnostico final (se dejó limpio el equipo, formateado, o encontrado fallas irreparables , ete etc que apoyen con la decision de dar de baja ese bien). 
Aquí esteperfil de usuario tiene la potestad de cambiar el estado_funcionamiento del o de los bienes, seleccionando el correcto según la revisión en este mantenimiento; si seleccionara averiado o inoperativo, en el diagnostico final detallaría completo. Por supuesto se debe de generar el numero de orden del mantenimiento. La cancelación sería por parte del ASISTSISTEMA por diversos motivos que deben de registrarse sin aprobación de nadie. El mantenimiento, para su documentación  y firma del usuario, se debe de llenar los bienes del mismo usuario. Quien realiza esta mantenimiento es el ASISTSISTEMA y al momento de registrarlo en sistema o  dar clic al botón registrar, automáticamente cambia a estado pendiente_aprobacion, y  al perfil ADMINSEDE debería de mostrarle un alerta o notificación en sistema sobre este proceso generado para que lo pueda aprobar o desaprobar, si lo aprueba cambia a estado ATENDIDO; SI LO desaprueba debe de especificar el motivo y el estado cambia a devuelto y el proceso se vuelve editable el cual puede retirar equipos para ese proceso de mantenimiento, o cambiar datos o agregar datos y luego de registrar vuelve al proceso de estado pendiente_aprobacion.
La transferencia/asignación ,sus estados serian creado/registrado, pendiente_aprobacion, devuelto, Atendido,cancelado, los datos a tomar para realizar estas transferencias son quien asigna (datos del ASISTSISTEMA), sede( modulo, área),cargo, fecha hora, numero de la transacción, a quien se asigna, sede( modulo, área),cargo, observaciones (el motivo de esta asignación seria una tabla que nos de por motivos: equipomuevo, traslado a otra sede, fin de contrato, avería de equipo, devolución,etc). Debneria miostrar los datos del bien, como : tipo_bien,marca,  modelo,   numero_serie ,  codigo_patrimonial ,  estado_bien ,  estado_funcionamiento . Quien realiza esta transferencia/asignación es el ASISTSISTEMA y al momento de registrarlo en sistema o  dar clic al botón registrar, automáticamente cambia a estado pendiente_aprobacion, y  al perfil ADMINSEDE debería de mostrarle un alerta o notificación en sistema sobre este proceso generado para que lo pueda aprobar o desaprobar, si lo aprueba cambia a estado ATENDIDO; SI LO desaprueba debe de especificar el motivo y el estado cambia a devuelto y el proceso se vuelve editable el cual puede retirar equipos para ese proceso de transferencia/asignación, o cambiar datos o agregar datos y luego de registrar vuelve al proceso de estado pendiente_aprobacion.
La baja del bien, sus estados seria, creado/registrado, pendiente_aprobacion, devuelto, Atendido,cancelado.El sistema en esta estapa debería mostrar los equipos que se encuentran desde el modulo de mantenimiento, con funcionamiento averiado o inoperativo. Entonces aquí el ASISTSISTEMA puede seleccionar uno o varios equipos para dar de baja del sistema; la baja en SI es un documento Informe, el cual dentro de este informe debe contener: antecedentes, análisis, conclusiones, recomendaciones. Los datos que se obitenen del Mantenimiento (datos iniciales, trabajos realizados, diagnostico final)e agregam  en la parte del Analisis, y dentro debería mostrarse debajo de estos datos : 
tipo_bien, marca, modelo, numero_serie, codigo_patrimonial,  estado_funcionamiento. Si son varios bienes, cada uno debe de mostrar estos datos.  Se puede seleccionar motivo_baja  por cada bien/activo (pueden ser por RAEE, fallas sin solución, etc).Quien realiza esta baja es el ASISTSISTEMA y al momento de registrarlo en sistema o  dar clic al botón registrar, automáticamente cambia a estado pendiente_aprobacion, y  al perfil COORDSISTEMA debería de mostrarle un alerta o notificación en sistema sobre este proceso generado para que lo pueda aprobar o desaprobar, si lo aprueba cambia a estado ATENDIDO; SI LO desaprueba debe de especificar el motivo y el estado cambia a devuelto y el proceso se vuelve editable el cual puede retirar equipos para ese proceso de baja, o cambiar datos o agregar datos y luego de registrar vuelve al proceso de estado pendiente_aprobacion. Aquí se genera un documento pdf CON LOS DATOS COMPLETOS: DE (NOMBRE APELLIDOS,CARGO Y SEDE DEL ASISTSISTEMA) A (NOMBRE APELLIDOS , CARGO Y SEDE DEL COORDSISTEMA ), ASUNTO (INFORME DE BAJA DE BIENES); ANTECEDENTES, ANALISIS, CONCLUSIONES, RECOMENCACIONES, FIRMA DEL ASISTSISTEMA.


