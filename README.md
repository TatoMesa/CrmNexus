# Nexus CRM - Tablero de Pedidos Visual

Aplicación web moderna, simple y profesional creada para **Nexus** que funciona como un mini CRM visual de tareas tipo Kanban para la gestión de pedidos de impresiones.

## 🚀 Características
- **Tablero Kanban completo**: Organiza tus pedidos en columnas interactiva: *Nuevo, En proceso, Terminado y Cliente Avisado*.
- **Datos de Pedido**: Registra nombre del cliente, teléfono (con enlace directo a WhatsApp y llamadas), tipo de color (ByN/Color), acabado (Anillado), número de caras (Simple/Doble faz), distribución de página (Normal/Apaisada 2 por hoja), importe cobrado, seña entregada, cálculo de saldo pendiente automático e instrucciones específicas en notas.
- **Dashboard en vivo**: Visualiza pedidos activos, señas acumuladas e importes pendientes de cobro al instante.
- **Buscador interactivo**: Encuentra pedidos rápidamente por nombre, teléfono o notas.
- **Copia de seguridad (Backup)**: Exporta e importa la base de datos completa como archivo JSON.
- **Diseño Responsivo**: Experiencia de primer nivel optimizada para móviles y ordenadores (estilo blanco limpio con acentos verde esmeralda).
- **Persistencia**: Los datos se guardan de forma segura y local en tu navegador con `localStorage`.

---

## 💻 Desarrollo Local

Para correr el proyecto en tu entorno local:

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```

3. Abre el navegador en la URL indicada (habitualmente [http://localhost:5173](http://localhost:5173)).

---

## ☁️ Despliegue en un Droplet de DigitalOcean

Tienes **dos opciones recomendadas** para subir este proyecto a tu Droplet.

### Opción A: Despliegue tradicional con Node.js y PM2 (Recomendado)

Esta opción utiliza el script `server.js` (Express) incluido en el proyecto para servir el compilado.

1. **Subir archivos al Droplet**:
   Sube la carpeta del proyecto a tu Droplet mediante Git, SCP, SFTP o clonándolo desde GitHub.

2. **Conéctate a tu Droplet mediante SSH**:
   ```bash
   ssh root@TU_IP_DROPLET
   ```

3. **Navegar a la carpeta del proyecto e Instalar dependencias**:
   ```bash
   cd /ruta/a/CrmNexus
   npm install
   ```

4. **Compilar la aplicación para producción**:
   ```bash
   npm run build
   ```
   *Esto generará la carpeta `/dist` optimizada.*

5. **Iniciar con PM2**:
   Instala PM2 de forma global si no lo tienes e inicia la app:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "nexus-crm"
   ```
   *Tu app estará corriendo en el puerto `3000` de forma persistente.*

6. **Configurar Nginx como Proxy Inverso** (Opcional pero recomendado para SSL/Puerto 80/443):
   Crea una configuración en Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/nexus-crm
   ```
   Agrega la configuración de proxy:
   ```nginx
   server {
       listen 80;
       server_name tu_dominio_o_ip;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Activa el sitio y recarga Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/nexus-crm /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

---

### Opción B: Despliegue utilizando Docker

Si prefieres aislar tu aplicación en un contenedor de forma rápida:

1. **Instalar Docker en el Droplet**:
   Si tu Droplet no tiene Docker, puedes instalarlo rápidamente.

2. **Compilar la imagen de Docker**:
   Ejecuta el siguiente comando en la raíz del proyecto dentro de tu Droplet:
   ```bash
   docker build -t nexus-crm .
   ```

3. **Ejecutar el contenedor**:
   Corre el contenedor exponiendo el puerto 3000 al puerto 80 del Droplet:
   ```bash
   docker run -d -p 80:3000 --name nexus-crm-app --restart always nexus-crm
   ```
   *¡Listo! Tu aplicación estará accesible directamente en la IP pública del Droplet en el puerto 80 estándar.*
