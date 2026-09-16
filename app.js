/**
 * Generador de Imágenes para Geodesafíos
 * Renderizado de alta precisión en Canvas 800x400 píxeles
 */

// Lista de meses y fondos disponibles en la carpeta fondos/
const FONDOS = [
  { id: 'enero', name: 'Enero', file: 'fondos/enero.png' },
  { id: 'febrero', name: 'Febrero', file: 'fondos/febrero.png' },
  { id: 'marzo', name: 'Marzo', file: 'fondos/marzo.png' },
  { id: 'abril', name: 'Abril', file: 'fondos/abril.png' },
  { id: 'mayo', name: 'Mayo', file: 'fondos/mayo.png' },
  { id: 'junio', name: 'Junio', file: 'fondos/junio.png' },
  { id: 'julio', name: 'Julio', file: 'fondos/julio.png' },
  { id: 'agosto', name: 'Agosto', file: 'fondos/agosto.png' },
  { id: 'septiembre', name: 'Septiembre', file: 'fondos/septiembre.png' },
  { id: 'octubre', name: 'Octubre', file: 'fondos/octubre.png' },
  { id: 'noviembre', name: 'Noviembre', file: 'fondos/noviembre.png' },
  { id: 'diciembre', name: 'Diciembre', file: 'fondos/diciembre.png' },
  { id: 'especial', name: 'Especial', file: 'fondos/especial.png' }
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Obtiene el mes y año actual formateado (ej: "Septiembre 2026")
 */
function getCurrentDatePreset() {
  const now = new Date();
  const monthName = MESES[now.getMonth()];
  const year = now.getFullYear();
  return {
    fondoId: monthName.toLowerCase(),
    text: `${monthName} ${year}`
  };
}

const initialDate = getCurrentDatePreset();

// Estado de la aplicación
const state = {
  selectedFondo: initialDate.fondoId,
  text: initialDate.text,
  fontSizePt: 65,           // Puntos tipográficos (65 pt por defecto)
  strokeWidthPt: 2,         // Borde negro en puntos (2 pt)
  bgYPercent: 50,           // 50% = centro del recorte
  shadowIntensity: 1.2,     // Sombra de logo y texto (1.2 = 120% por defecto, ampliable hasta 2.0 / 200%)
  isFontReady: false,
  isRendering: false
};

// Caché de imágenes cargadas
const imageCache = new Map();

// Referencias del DOM
const elements = {
  canvas: document.getElementById('previewCanvas'),
  ctx: null,
  bannerText: document.getElementById('bannerText'),
  fondosGrid: document.getElementById('fondosGrid'),
  currentFondoLabel: document.getElementById('currentFondoLabel'),
  fontSizeRange: document.getElementById('fontSizeRange'),
  fontSizeVal: document.getElementById('fontSizeVal'),
  strokeWidthRange: document.getElementById('strokeWidthRange'),
  strokeWidthVal: document.getElementById('strokeWidthVal'),
  bgYRange: document.getElementById('bgYRange'),
  bgYVal: document.getElementById('bgYVal'),
  shadowRange: document.getElementById('shadowRange'),
  shadowVal: document.getElementById('shadowVal'),
  btnResetSettings: document.getElementById('btnResetSettings'),
  previewFilename: document.getElementById('previewFilename'),
  btnDownload: document.getElementById('btnDownload'),
  btnCopyClipboard: document.getElementById('btnCopyClipboard'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  statusToast: document.getElementById('statusToast')
};

// Conversión de unidades tipográficas: 1 pt = 96 / 72 px (4/3 px)
const PT_TO_PX = 96 / 72;

/**
 * Carga una imagen y la almacena en caché
 */
function loadImage(src) {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src));
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (window.location.protocol.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => reject(new Error(`Error cargando imagen: ${src}`));
    img.src = src;
  });
}

/**
 * Muestra mensaje flotante temporal (toast)
 */
let toastTimeout = null;
function showToast(message, type = 'success') {
  if (!elements.statusToast) return;
  clearTimeout(toastTimeout);
  elements.statusToast.textContent = message;
  elements.statusToast.className = `status-toast ${type}`;
  toastTimeout = setTimeout(() => {
    elements.statusToast.className = 'status-toast';
  }, 3500);
}

/**
 * Limpia y genera el nombre de archivo a partir del texto
 */
function getSanitizedFilename() {
  const rawText = state.text.replace(/[\r\n]+/g, ' ').trim();
  const safeText = rawText.replace(/[\\/:*?"<>|]/g, '').trim();
  return safeText.length > 0 ? safeText : 'geodesafio';
}

/**
 * Actualiza el indicador visual del nombre de archivo
 */
function updateFilenamePreview() {
  elements.previewFilename.textContent = `${getSanitizedFilename()}.png`;
}

/**
 * Renderizado principal en el Canvas 800x400
 */
async function renderCanvas() {
  if (!elements.ctx) return;
  const ctx = elements.ctx;

  // 1. Limpiar lienzo
  ctx.clearRect(0, 0, 800, 400);

  // 2. Obtener fondo seleccionado
  const fondoObj = FONDOS.find(f => f.id === state.selectedFondo) || FONDOS[0];
  
  try {
    const [bgImg, logoImg] = await Promise.all([
      loadImage(fondoObj.file),
      loadImage('logo.png')
    ]);

    // -------------------------------------------------------------
    // PASO 1: Dibujar fondo con recorte exacto (800x400 sin estirar)
    // -------------------------------------------------------------
    // El fondo original es de 1800 x 1800 px.
    // Al escalarlo a ancho 800, la proporción 1:1 requeriría alto 800.
    // Para una ventana de 800x400, en el original tomamos un alto de:
    // sliceH = 1800 * (400 / 800) = 900 px.
    const bgOriginalW = bgImg.naturalWidth || 1800;
    const bgOriginalH = bgImg.naturalHeight || 1800;
    const sliceW = bgOriginalW;
    const sliceH = bgOriginalW * (400 / 800); // 900 px en imagen cuadrada

    // Desplazamiento vertical según state.bgYPercent (0% = arriba, 50% = centro, 100% = abajo)
    const maxScroll = Math.max(0, bgOriginalH - sliceH);
    const sliceY = maxScroll * (state.bgYPercent / 100);

    ctx.drawImage(bgImg, 0, sliceY, sliceW, sliceH, 0, 0, 800, 400);

    // -------------------------------------------------------------
    // PASO 2: Dibujar Logotipo con sombra exterior
    // -------------------------------------------------------------
    // Especificaciones exactas del usuario desde Illustrator:
    // Dimensiones: 775 x 105 px
    // Centro: X = 400, Y = 110
    // Posición superior izquierda:
    // x = 400 - (775 / 2) = 12.5 px
    // y = 110 - (105 / 2) = 57.5 px
    const logoW = 775;
    const logoH = 105;
    const logoX = 400 - (logoW / 2); // 12.5 px
    const logoY = 110 - (logoH / 2); // 57.5 px

    // -------------------------------------------------------------
    // Configuración de Sombra Compartida (Logo y Texto)
    // -------------------------------------------------------------
    // state.shadowIntensity: 1.0 = 100%, hasta 2.0 = 200%
    const shadowAlpha = Math.min(1, state.shadowIntensity * 0.75);
    const shadowBlur = Math.round(14 * Math.min(2.2, Math.max(0.4, state.shadowIntensity)));
    const shadowOffsetY = Math.round(3 * Math.min(1.8, Math.max(0.5, state.shadowIntensity)));

    ctx.save();
    if (state.shadowIntensity > 0) {
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = shadowOffsetY;
    }
    ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
    ctx.restore();

    // -------------------------------------------------------------
    // PASO 3: Dibujar Texto
    // -------------------------------------------------------------
    // El texto va centrado horizontalmente y verticalmente en el hueco
    // que queda bajo el logotipo (desde Y = 162.5 hasta Y = 400).
    const spaceTop = logoY + logoH; // 162.5 px
    const spaceBottom = 400;
    const availableHeight = spaceBottom - spaceTop; // 237.5 px
    const centerY = spaceTop + (availableHeight / 2); // 281.25 px
    const centerX = 400;

    // Obtener líneas de texto (respetar saltos manuales)
    let rawLines = state.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) {
      return; // No hay texto que escribir
    }

    // Convertir pt a px
    let fontSizePx = state.fontSizePt * PT_TO_PX;
    const strokeWidthPx = state.strokeWidthPt * PT_TO_PX;

    // Configurar contexto de fuente
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Auto-ajuste de seguridad: Si hay 2 o más líneas o texto muy largo,
    // reducir proporcionalmente si supera el ancho máximo (760px) o el alto disponible
    const maxTextW = 760;
    let lineHeight = fontSizePx * 1.14;

    const measureLongestLine = (size) => {
      ctx.font = `${size}px "Architects Daughter", cursive, sans-serif`;
      return Math.max(...rawLines.map(line => ctx.measureText(line).width));
    };

    // Ajuste de ancho
    let currentLongest = measureLongestLine(fontSizePx);
    if (currentLongest > maxTextW) {
      const scale = maxTextW / currentLongest;
      fontSizePx = Math.floor(fontSizePx * scale);
      lineHeight = fontSizePx * 1.14;
    }

    // Ajuste de altura para que nunca roce el logo ni se salga del canvas
    const totalTextHeight = (rawLines.length - 1) * lineHeight + fontSizePx;
    if (totalTextHeight > availableHeight - 16) {
      const scale = (availableHeight - 16) / totalTextHeight;
      fontSizePx = Math.floor(fontSizePx * scale);
      lineHeight = fontSizePx * 1.14;
    }

    // Establecer la fuente calculada
    ctx.font = `${fontSizePx}px "Architects Daughter", cursive, sans-serif`;

    // Posición inicial vertical para centrar el bloque completo de líneas
    const totalBlockH = (rawLines.length - 1) * lineHeight;
    const startY = centerY - (totalBlockH / 2);

    // Dibujar cada línea
    rawLines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight);

      // 1. Sombra exterior + Contorno negro de 2 puntos
      ctx.save();
      if (state.shadowIntensity > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowOffsetY;
      }
      if (strokeWidthPx > 0) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = strokeWidthPx * 2; // Duplicado porque se dibuja centrado sobre el borde
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, centerX, lineY);
      }
      ctx.restore();

      // Si la sombra es muy intensa (> 120%), reforzar el pase de sombra
      if (state.shadowIntensity > 1.2 && strokeWidthPx > 0) {
        ctx.save();
        ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(1, (state.shadowIntensity - 1) * 0.8)})`;
        ctx.shadowBlur = shadowBlur * 1.3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = strokeWidthPx * 2;
        ctx.strokeText(line, centerX, lineY);
        ctx.restore();
      }

      // 2. Relleno blanco nítido encima
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, centerX, lineY);
    });

  } catch (err) {
    console.error('Error renderizando el lienzo:', err);
  }
}

/**
 * Solicita renderizado sincronizado con requestAnimationFrame
 */
let renderRequest = null;
function triggerRender() {
  if (renderRequest) cancelAnimationFrame(renderRequest);
  renderRequest = requestAnimationFrame(async () => {
    await renderCanvas();
    updateFilenamePreview();
  });
}

/**
 * Inicializa la cuadrícula de selección de fondos
 */
function buildFondosGrid() {
  elements.fondosGrid.innerHTML = '';
  
  FONDOS.forEach(fondo => {
    const card = document.createElement('div');
    card.className = `fondo-card ${fondo.id === state.selectedFondo ? 'active' : ''}`;
    card.dataset.id = fondo.id;
    card.title = `Fondo: ${fondo.name}`;

    const img = document.createElement('img');
    img.src = fondo.file;
    img.alt = fondo.name;
    img.loading = 'lazy';

    const label = document.createElement('span');
    label.className = 'fondo-name';
    label.textContent = fondo.name;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener('click', () => {
      if (state.selectedFondo === fondo.id) return;
      state.selectedFondo = fondo.id;
      
      // Actualizar clases activas
      document.querySelectorAll('.fondo-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // Actualizar badge
      elements.currentFondoLabel.textContent = `${fondo.id}.png`;

      // Si el texto es de ejemplo y coincide con un mes, se puede actualizar sugerencia
      triggerRender();
    });

    elements.fondosGrid.appendChild(card);
  });
}

/**
 * Maneja la descarga del archivo PNG
 */
/**
 * Maneja la descarga del archivo PNG
 */
function downloadImage() {
  const filename = `${getSanitizedFilename()}.png`;
  
  try {
    elements.canvas.toBlob((blob) => {
      if (!blob) {
        handleLocalSecurityNotice();
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`¡Descargado: ${filename}!`, 'success');
    }, 'image/png');
  } catch (err) {
    console.error('Error al exportar canvas:', err);
    handleLocalSecurityNotice();
  }
}

/**
 * Aviso amigable si el navegador bloquea la exportación en local (file://)
 */
function handleLocalSecurityNotice() {
  if (window.location.protocol === 'file:') {
    alert(
      '⚠️ Restricción de seguridad del navegador (en local):\n\n' +
      'Al abrir este archivo directamente (protocolo file://), los navegadores bloquean por seguridad la exportación de imágenes locales.\n\n' +
      '💡 Solución para usarlo en tu ordenador:\n' +
      'Haz doble clic en el archivo "abrir-en-local.bat" que tienes en la carpeta. Abrirá la web en http://localhost y funcionará al 100%.\n\n' +
      '🌐 En tu hosting web:\n' +
      'En cuanto subas los archivos a tu servidor web (http/https), la descarga funcionará directamente sin hacer nada más.'
    );
    showToast('Abre "abrir-en-local.bat" para usar la descarga en tu PC', 'error');
  } else {
    showToast('Error generando la imagen PNG', 'error');
  }
}

/**
 * Copia la imagen directamente al portapapeles
 */
async function copyToClipboard() {
  if (window.location.protocol === 'file:') {
    handleLocalSecurityNotice();
    return;
  }
  
  if (!navigator.clipboard || !window.isSecureContext) {
    showToast('El portapapeles requiere conexión segura (HTTPS o localhost). Usa el botón Descargar.', 'error');
    return;
  }

  try {
    elements.canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('No se pudo generar la imagen para copiar', 'error');
        return;
      }
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        showToast('¡Imagen copiada al portapapeles!', 'success');
      } catch (clipErr) {
        console.warn('ClipboardItem error:', clipErr);
        showToast('Portapapeles no soportado en este navegador. Usa el botón Descargar.', 'error');
      }
    }, 'image/png');
  } catch (err) {
    console.error('Error al copiar:', err);
    showToast('Error al copiar imagen', 'error');
  }
}

/**
 * Vinculación de eventos de la interfaz
 */
function attachEventListeners() {
  // Input de texto
  elements.bannerText.addEventListener('input', (e) => {
    state.text = e.target.value;
    triggerRender();
  });

  // Botones de sugerencias rápidas
  document.querySelectorAll('.btn-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const newText = btn.dataset.text;
      elements.bannerText.value = newText;
      state.text = newText;
      triggerRender();
    });
  });

  // Control: Tamaño de letra
  elements.fontSizeRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.fontSizePt = val;
    elements.fontSizeVal.textContent = `${val} pt`;
    triggerRender();
  });

  // Control: Grosor de borde
  elements.strokeWidthRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.strokeWidthPt = val;
    elements.strokeWidthVal.textContent = `${val} pt`;
    triggerRender();
  });

  // Control: Encuadre vertical
  elements.bgYRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.bgYPercent = val;
    elements.bgYVal.textContent = val === 50 ? 'Centro (50%)' : `${val}%`;
    triggerRender();
  });

  // Control: Sombra de logo y texto (0% a 200%)
  elements.shadowRange.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.shadowIntensity = val / 100;
    elements.shadowVal.textContent = `${val}%`;
    triggerRender();
  });

  // Restablecer valores por defecto (65 pt y 120% de sombra)
  elements.btnResetSettings.addEventListener('click', () => {
    state.fontSizePt = 65;
    state.strokeWidthPt = 2;
    state.bgYPercent = 50;
    state.shadowIntensity = 1.2;

    elements.fontSizeRange.value = 65;
    elements.fontSizeVal.textContent = '65 pt';

    elements.strokeWidthRange.value = 2;
    elements.strokeWidthVal.textContent = '2 pt';

    elements.bgYRange.value = 50;
    elements.bgYVal.textContent = 'Centro (50%)';

    elements.shadowRange.value = 120;
    elements.shadowVal.textContent = '120%';

    triggerRender();
    showToast('Ajustes restablecidos (65 pt, 120% sombra)', 'success');
  });

  // Botón Descargar
  elements.btnDownload.addEventListener('click', downloadImage);

  // Botón Copiar al portapapeles
  elements.btnCopyClipboard.addEventListener('click', copyToClipboard);
}

/**
 * Inicialización general de la app
 */
async function init() {
  elements.ctx = elements.canvas.getContext('2d');
  
  // Establecer texto y etiqueta inicial según el mes actual
  elements.bannerText.value = state.text;
  elements.currentFondoLabel.textContent = `${state.selectedFondo}.png`;

  buildFondosGrid();
  attachEventListeners();
  updateFilenamePreview();

  // Mostrar overlay de carga
  elements.loadingOverlay.classList.add('active');

  try {
    // 1. Esperar carga de fuentes
    if (document.fonts) {
      await document.fonts.load('65px "Architects Daughter"');
      await document.fonts.ready;
    }

    // 2. Precargar logo y el fondo del mes actual
    const currentFondoObj = FONDOS.find(f => f.id === state.selectedFondo) || FONDOS[0];
    await Promise.all([
      loadImage('logo.png'),
      loadImage(currentFondoObj.file)
    ]);

    // Ocultar carga y renderizar
    elements.loadingOverlay.classList.remove('active');
    triggerRender();

    // Precargar en segundo plano el resto de fondos para fluidez absoluta
    setTimeout(() => {
      FONDOS.forEach(f => {
        if (f.id !== state.selectedFondo) loadImage(f.file).catch(() => {});
      });
    }, 800);

  } catch (err) {
    console.warn('Advertencia al cargar recursos iniciales:', err);
    elements.loadingOverlay.classList.remove('active');
    triggerRender();
  }
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
