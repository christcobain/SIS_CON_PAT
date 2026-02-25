# SISCONPAT - Sistema de Control Patrimonial -Corte Superior de Justicia de Lima Norte - Poder Judicial
## Proceso de creacion GIT - GITHUB
# Inicializar repositorio git
git init

# Verificar estado
git status

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Initial commit"

# Agregar repositorio remoto
git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git

# Verificar conexión
git remote -v

# Subir proyecto por primera vez
git push -u origin main

git log --oneline
# Subir proyecto cada vez que hagas modificaciones al proyecto
git add .
git commit -m "mensaje"
git push