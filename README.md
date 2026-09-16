# 🎨 Generador de Imágenes para Geodesafíos

Aplicación web interactiva y ligera para generar y exportar fácilmente las imágenes destacadas mensuales (**800 × 400 píxeles**) utilizadas en las entradas de **Geodesafíos** en la web de [beaypepe.com](https://beaypepe.com).

> 🌐 Puedes ver todos los geodesafíos en acción en:  
> **[https://beaypepe.com/geodesafios/](https://beaypepe.com/geodesafios/)**

---

## 📖 Acerca de este proyecto

Estas imágenes han sido diseñadas originalmente para ilustrar las publicaciones mensuales de **Geodesafíos** en [beaypepe.com](https://beaypepe.com/geodesafios/).  
No obstante, **este generador y su código son de libre uso**: cualquier persona puede utilizarlo, modificarlo o adaptarlo libremente para sus propios proyectos o sitios web.

---

## ✨ Características Principales

- **Dimensiones exactas:** Lienzo estándar de **800 × 400 px** en formato PNG.
- **Detección inteligente de fecha:**
  - Al abrir la página, detecta automáticamente el mes y año actual (ej: *Septiembre 2026*) con la inicial en mayúscula.
  - Preselecciona y carga de inmediato el fondo correspondiente.
- **Navegación rápida de meses:**
  - **◀ Anterior:** Retrocede un mes respecto al mostrado.
  - **📅 Actual:** Regresa inmediatamente al mes y año real en curso.
  - **Posterior ▶:** Avanza un mes respecto al mostrado.
  - **★ Geodesafío especial:** Configura el fondo especial y el texto temático en un solo clic.
- **Colección completa de fondos:**
  - Fondos para cada mes del año (`enero.png` a `diciembre.png`).
  - Fondo `especial.png`.
  - Fondo dinámico **Gris** (aplica escala de grises en tiempo real a `septiembre.png` sin necesidad de archivos adicionales).
  - Recorte proporcional sin estirar ni deformar las imágenes originales de 1800×1800 px.
- **Tipografía y estilo fiel a Illustrator:**
  - Tipografía **Architects Daughter** por defecto a **65 pt**.
  - Texto centrado bajo el logotipo con relleno blanco, contorno negro de **2 pt** y sombra exterior difuminada al **120%**.
  - Logotipo ubicado con exactitud en `X = 400, Y = 110` (775 × 105 px) con sombra integrada.
- **Ajustes finos opcionales:**
  - Deslizador de tamaño de letra (35 pt a 115 pt).
  - Deslizador de grosor del contorno negro (0.5 pt a 6 pt).
  - Deslizador de encuadre vertical del recorte del fondo.
  - Deslizador de intensidad de sombra de 0% a 200%.
- **Exportación inmediata:**
  - **Descarga PNG directa** con el nombre de archivo correspondiente al texto escrito (ej: `Septiembre 2026.png`).
  - Botón para **Copiar al portapapeles** (en entornos seguros).

---

## 🚀 Cómo Utilizar la Aplicación

### 1. En tu Ordenador (Local)
Para evitar las restricciones de seguridad que aplican los navegadores a las imágenes locales bajo el protocolo `file://`:
1. Haz doble clic en el archivo **`abrir-en-local.bat`**.
2. Se abrirá automáticamente tu navegador en `http://localhost:8080` con todas las funciones de descarga y portapapeles habilitadas al 100%.

### 2. En tu Servidor Web o Hosting
Sube los archivos y carpetas del proyecto a tu hosting (Apache, Nginx, cPanel, etc.):
- `index.html`
- `style.css`
- `app.js`
- `logo.png`
- Carpeta `fondos/`
- Carpeta `fuentes/`

No requiere Node.js, PHP ni bases de datos en el servidor; funciona de forma nativa e instantánea en el navegador del cliente.

---

## 📂 Estructura del Repositorio

```text
imagenes-geodesafios/
│
├── index.html            # Estructura de la aplicación web
├── style.css             # Estilos y diseño visual (modo oscuro moderno)
├── app.js                # Lógica del Canvas 2D, controles y exportación
├── abrir-en-local.bat    # Lanzador automático para entorno local en Windows
├── logo.png              # Logotipo de Geodesafíos
├── README.md             # Documentación del proyecto
│
├── fondos/               # Fondos mensuales y especiales (1800x1800 px)
│   ├── enero.png
│   ├── febrero.png
│   ├── ...
│   ├── diciembre.png
│   └── especial.png
│
└── fuentes/              # Tipografía local
    └── architects-daughter.ttf
```

---

## 📜 Licencia y Uso

Desarrollado para la sección de [Geodesafíos](https://beaypepe.com/geodesafios/) de [beaypepe.com](https://beaypepe.com).  
Código y recursos disponibles libremente para uso y adaptación por parte de la comunidad.
