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

## Paso 1: Crear proyecto y los microservicios

```bash - powershell
cd SIST_CON_PAT 
# Aqui haces los mismos pasos para los microservicios cambiando el nombre obviamente
python -m venv ms-bienes/venv 
source ms-bienes/venv/bin/activate

pip install django==6.0
pip install djangorestframework==3.16.0
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install psycopg2-binary
pip install python-decouple
pip install django-filter
pip install Pillow
pip install reportlab
pip install requests

pip freeze > requirements.txt
django-admin startproject config .
cd ms-bienes/
python manage.py startapp catalogs
python manage.py startapp assets
python manage.py startapp maintenance
python manage.py startapp transfers
python manage.py startapp derecognition
```