# Dashboard de Reporte de Turno

Reporte directivo de turno con captura rápida, dashboard en vivo (turno actual, semana, quincena y mes), sincronización gratuita en la nube y versión móvil instalable.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la aplicación (captura, dashboard, búsqueda, PDF) |
| `apps-script/Code.gs` | Código que se pega en Google Apps Script para guardar los reportes en Google Sheets |
| `manifest.webmanifest`, `sw.js`, `icons/` | Permiten instalarla como app en el celular y abrirla sin conexión |

## 1. Crear la base en Google Sheets (una sola vez)

1. Crea una hoja de cálculo nueva en Google Sheets (por ejemplo, "Base Reportes de Turno").
2. Menú **Extensiones > Apps Script**. Borra lo que aparezca y pega el contenido de `apps-script/Code.gs`.
3. Cambia el valor de `TOKEN` por una clave larga y propia (mínimo 24 caracteres, sin espacios). Guárdala; la pedirá la aplicación.
4. **Implementar > Nueva implementación > Tipo: Aplicación web**.
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Autoriza los permisos que pida Google y copia la **URL de la aplicación web** (termina en `/exec`).

Si después modificas `Code.gs`, usa **Implementar > Administrar implementaciones > Editar > Versión nueva** para conservar la misma URL.

## 2. Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub y sube estos archivos (`index.html`, `manifest.webmanifest`, `sw.js`, la carpeta `icons/` y la carpeta `apps-script/`).
2. En el repositorio: **Settings > Pages > Source: Deploy from a branch > main / (root)**.
3. En unos minutos tendrás una dirección tipo `https://TU-USUARIO.github.io/TU-REPO/`.

GitHub Pages solo aloja el código de la aplicación. Los reportes viven en tu Google Sheets, no en GitHub.

## 3. Conectar la aplicación a la nube

1. Abre la dirección de GitHub Pages y toca el botón de la esquina superior derecha (**Solo en este equipo**).
2. Pega la **URL `/exec`** y el **token**, toca **Probar conexión** y luego **Guardar y sincronizar**.
3. Para configurar otros equipos o celulares sin escribir nada, usa **Copiar enlace para otro equipo** y ábrelo en ellos. Ese enlace contiene el token: envíalo solo por un canal privado.

Desde ese momento cada reporte guardado se envía a la hoja, y todos los equipos conectados se actualizan solos (cada 30 segundos por defecto, ajustable). Sin internet, los reportes quedan guardados en el equipo y se envían al volver la conexión.

## 4. Instalar en el celular

- **Android (Chrome):** menú de los tres puntos > **Instalar aplicación**.
- **iPhone (Safari):** botón Compartir > **Agregar a pantalla de inicio**.

## 5. Pasar los datos que ya tenías

En tu archivo anterior: **Buscar Informes > Exportar todo a Excel**. En la nueva aplicación: **Buscar Informes > Importar Excel**. Los reportes importados se envían a la nube automáticamente.

Los datos de la versión anterior viven en el navegador del equipo donde la usabas. Si cambias de dirección (por ejemplo, de un archivo local a GitHub Pages), el navegador los trata como sitios distintos, por eso conviene hacer este paso de exportar e importar.

## Cambios respecto a la versión anterior

- **Dashboard por periodo:** Turno actual, Semana (lunes a domingo), Quincena (1 al 15 y 16 a fin de mes) y Mes calendario, con flechas para ver periodos anteriores y filtros por instalación y turno. Se actualiza solo cuando se guarda, importa o sincroniza un reporte.
- **Captura más corta:** fecha, hora, turno (según la hora), instalación, jefe y plantilla se precargan; los equipos aparecen como operativos desde una plantilla guardada; los accesos se capturan con botones + y −; el resumen se puede autogenerar; el borrador se guarda solo.
- **Folio:** ahora tiene el formato `RT-AAAAMMDD-HHMM-XXX` para que no se repita entre dos equipos que trabajan a la vez. Los folios antiguos se conservan.
- **Correcciones:** la fecha ya no salta al día siguiente después de las 18:00 (usaba hora UTC); los textos capturados se escapan antes de mostrarse; la importación de Excel conserva incidentes y equipos.
- **Móvil:** navegación inferior, botón de guardar fijo, listas apiladas y campos de tamaño táctil.

## Seguridad

La URL y el token dan acceso de lectura y escritura a todos los reportes. Mantén la hoja de Google Sheets privada (no la compartas), cambia el token si sospechas que se filtró, y confirma que la política de tu empresa permite guardar estos datos en una cuenta de Google.
