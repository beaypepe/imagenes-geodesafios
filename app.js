/**
 * Generador de Imágenes para Geodesafíos
 * Renderizado de alta precisión en Canvas HTML5 con soporte multi-resolución y modos de diseño
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
  { id: 'especial', name: 'Especial', file: 'fondos/especial.png' },
  { id: 'gris', name: 'Gris', file: 'fondos/septiembre.png', grayscale: true }
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
  const monthIdx = now.getMonth();
  const monthName = MESES[monthIdx];
  const year = now.getFullYear();
  return {
    fondoId: monthName.toLowerCase(),
    text: `${monthName} ${year}`,
    monthIndex: monthIdx,
    year: year
  };
}

const initialDate = getCurrentDatePreset();

// Estado de la aplicación
const state = {
  selectedFondo: initialDate.fondoId,
  text: initialDate.text,
  viewYear: initialDate.year,
  viewMonthIndex: initialDate.monthIndex,
  isSpecial: false,
  mode: 'full',             // 'full' | 'logo-only' | 'text-only' | 'bg-only'
  canvasWidth: 800,         // Ancho del lienzo en píxeles
  canvasHeight: 400,        // Alto del lienzo en píxeles
  fontSizePt: 65,           // Puntos tipográficos (65 pt por defecto)
  strokeWidthPt: 2,         // Borde negro en puntos (2 pt)
  bgYPercent: 50,           // 50% = centro del recorte
  shadowIntensity: 1.2,     // Sombra de logo y texto (1.2 = 120% por defecto)
  isFontReady: false,
  isRendering: false
};

// Caché de imágenes cargadas
const imageCache = new Map();

const STORAGE_KEY = 'geodesafios_personal_defaults';

const FACTORY_DEFAULTS = {
  fontSizePt: 65,
  strokeWidthPt: 2,
  bgYPercent: 50,
  shadowIntensity: 1.2,
  canvasWidth: 800,
  canvasHeight: 400,
  mode: 'full'
};

// Referencias del DOM
const elements = {
  canvas: document.getElementById('previewCanvas'),
  ctx: null,
  canvasWrapper: document.getElementById('canvasWrapper'),
  bannerText: document.getElementById('bannerText'),
  textInputWrapper: document.getElementById('textInputWrapper'),
  quickNavContainer: document.getElementById('quickNavContainer'),
  btnPrevMonth: document.getElementById('btnPrevMonth'),
  btnCurrentMonth: document.getElementById('btnCurrentMonth'),
  btnNextMonth: document.getElementById('btnNextMonth'),
  btnSpecial: document.getElementById('btnSpecial'),
  fondosGrid: document.getElementById('fondosGrid'),
  currentFondoLabel: document.getElementById('currentFondoLabel'),
  
  // Modos de composición
  compositionModes: document.getElementById('compositionModes'),
  
  // Dimensiones
  customWidth: document.getElementById('customWidth'),
  customHeight: document.getElementById('customHeight'),
  dimLabel: document.getElementById('dimLabel'),
  canvasResBadge: document.getElementById('canvasResBadge'),
  dimChips: document.querySelectorAll('.dim-chip'),
  
  // Ajustes de diseño
  fontSizeItem: document.getElementById('fontSizeItem'),
  fontSizeRange: document.getElementById('fontSizeRange'),
  fontSizeVal: document.getElementById('fontSizeVal'),
  strokeWidthItem: document.getElementById('strokeWidthItem'),
  strokeWidthRange: document.getElementById('strokeWidthRange'),
  strokeWidthVal: document.getElementById('strokeWidthVal'),
  bgYRange: document.getElementById('bgYRange'),
  bgYVal: document.getElementById('bgYVal'),
  shadowRange: document.getElementById('shadowRange'),
  shadowVal: document.getElementById('shadowVal'),
  btnResetSettings: document.getElementById('btnResetSettings'),
  
  // Configuración Personal (LocalStorage)
  btnSavePersonalDefaults: document.getElementById('btnSavePersonalDefaults'),
  btnLoadPersonalDefaults: document.getElementById('btnLoadPersonalDefaults'),
  savedBadge: document.getElementById('savedBadge'),
  
  // Ficha técnica
  specDim: document.getElementById('specDim'),
  specMode: document.getElementById('specMode'),
  
  // Previsualización y Descarga
  previewFilename: document.getElementById('previewFilename'),
  btnDownload: document.getElementById('btnDownload'),
  btnCopyClipboard: document.getElementById('btnCopyClipboard'),
  statusToast: document.getElementById('statusToast'),
  
  // Modal Lightbox
  btnOpenModal: document.getElementById('btnOpenModal'),
  modalLightbox: document.getElementById('modalLightbox'),
  modalRealImage: document.getElementById('modalRealImage'),
  modalResBadge: document.getElementById('modalResBadge'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnModalCloseAction: document.getElementById('btnModalCloseAction'),
  btnModalDownload: document.getElementById('btnModalDownload')
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
 * Limpia y genera el nombre de archivo a partir del texto y modo
 */
function getSanitizedFilename() {
  if (state.mode === 'logo-only') {
    return 'geodesafio-logo';
  }
  if (state.mode === 'bg-only') {
    return `geodesafio-fondo-${state.selectedFondo}`;
  }
  const rawText = state.text.replace(/[\r\n]+/g, ' ').trim();
  const safeText = rawText.replace(/[\\/:*?"<>|]/g, '').trim();
  return safeText.length > 0 ? safeText : 'geodesafio';
}

/**
 * Actualiza el indicador visual del nombre de archivo y fichas
 */
function updateFilenamePreview() {
  const filename = `${getSanitizedFilename()}.png`;
  if (elements.previewFilename) {
    elements.previewFilename.textContent = filename;
  }
  
  const resText = `${state.canvasWidth} × ${state.canvasHeight} px`;
  if (elements.canvasResBadge) elements.canvasResBadge.textContent = resText;
  if (elements.dimLabel) elements.dimLabel.textContent = resText;
  if (elements.specDim) elements.specDim.textContent = resText;
  if (elements.modalResBadge) elements.modalResBadge.textContent = resText;

  if (elements.specMode) {
    const modeNames = {
      'full': 'Completo (Logo + Texto)',
      'logo-only': 'Solo Logo (Centrado)',
      'text-only': 'Solo Texto (Centrado)',
      'bg-only': 'Solo Fondo'
    };
    elements.specMode.textContent = modeNames[state.mode] || state.mode;
  }
}

/**
 * Renderizado principal en el Canvas con soporte para dimensiones dinámicas y modos
 */
async function renderCanvas() {
  if (!elements.ctx) return;
  const ctx = elements.ctx;

  const targetW = state.canvasWidth;
  const targetH = state.canvasHeight;

  // Ajustar dimensiones nativas del canvas si cambiaron
  if (elements.canvas.width !== targetW || elements.canvas.height !== targetH) {
    elements.canvas.width = targetW;
    elements.canvas.height = targetH;
  }

  // 1. Limpiar lienzo
  ctx.clearRect(0, 0, targetW, targetH);

  // 2. Obtener fondo seleccionado
  const fondoObj = FONDOS.find(f => f.id === state.selectedFondo) || FONDOS[0];
  
  try {
    const [bgImg, logoImg] = await Promise.all([
      loadImage(fondoObj.file),
      loadImage('logo.png')
    ]);

    // -------------------------------------------------------------
    // PASO 1: Dibujar fondo con recorte proporcional (sin estirar)
    // -------------------------------------------------------------
    const bgOriginalW = bgImg.naturalWidth || 1800;
    const bgOriginalH = bgImg.naturalHeight || 1800;

    // Escala proporcional 'cover' para llenar completamente el canvas
    const coverScale = Math.max(targetW / bgOriginalW, targetH / bgOriginalH);
    const sliceW = targetW / coverScale;
    const sliceH = targetH / coverScale;

    // Desplazamiento vertical según state.bgYPercent (0% = arriba, 50% = centro, 100% = abajo)
    const maxScrollY = Math.max(0, bgOriginalH - sliceH);
    const sliceY = maxScrollY * (state.bgYPercent / 100);

    // Centrado horizontal en el original
    const maxScrollX = Math.max(0, bgOriginalW - sliceW);
    const sliceX = maxScrollX * 0.5;

    ctx.save();
    if (fondoObj.grayscale) {
      ctx.filter = 'grayscale(100%)';
    }
    ctx.drawImage(bgImg, sliceX, sliceY, sliceW, sliceH, 0, 0, targetW, targetH);
    ctx.restore();

    // Si el modo es 'bg-only', terminamos aquí
    if (state.mode === 'bg-only') {
      return;
    }

    // -------------------------------------------------------------
    // Configuración de Sombra Compartida (Logo y Texto)
    // -------------------------------------------------------------
    const shadowAlpha = Math.min(1, state.shadowIntensity * 0.75);
    const shadowBlur = Math.round(14 * Math.min(2.2, Math.max(0.4, state.shadowIntensity)));
    const shadowOffsetY = Math.round(3 * Math.min(1.8, Math.max(0.5, state.shadowIntensity)));

    // Factor de escala relativo al lienzo base 800x400
    const scaleFactor = targetW / 800;

    // -------------------------------------------------------------
    // PASO 2: Dibujar Logotipo
    // -------------------------------------------------------------
    const shouldDrawLogo = (state.mode === 'full' || state.mode === 'logo-only');
    let logoW = 775 * scaleFactor;
    let logoH = 105 * scaleFactor;
    let logoX = (targetW - logoW) / 2;
    let logoY = 0;

    if (shouldDrawLogo) {
      if (state.mode === 'logo-only') {
        // Modo Solo Logo: centrado exacto tanto horizontal como verticalmente
        logoY = (targetH - logoH) / 2;
      } else {
        // Modo Completo: en la parte superior proporcional
        logoY = 57.5 * (targetH / 400);
      }

      ctx.save();
      if (state.shadowIntensity > 0) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.shadowBlur = shadowBlur * scaleFactor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadowOffsetY * scaleFactor;
      }
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.restore();
    }

    // -------------------------------------------------------------
    // PASO 3: Dibujar Texto
    // -------------------------------------------------------------
    const shouldDrawText = (state.mode === 'full' || state.mode === 'text-only');

    if (shouldDrawText) {
      let rawLines = state.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (rawLines.length > 0) {
        let centerY, availableHeight, maxTextW;

        if (state.mode === 'text-only') {
          // Modo Solo Texto: centrado exacto en todo el lienzo
          centerY = targetH / 2;
          availableHeight = targetH - (40 * scaleFactor);
          maxTextW = targetW - (40 * scaleFactor);
        } else {
          // Modo Completo: centrado en el espacio restante bajo el logotipo
          const spaceTop = logoY + logoH;
          const spaceBottom = targetH;
          availableHeight = spaceBottom - spaceTop;
          centerY = spaceTop + (availableHeight / 2);
          maxTextW = targetW - (40 * scaleFactor);
        }

        const centerX = targetW / 2;

        // Convertir pt a px escalado según resolución
        let fontSizePx = (state.fontSizePt * PT_TO_PX) * scaleFactor;
        const strokeWidthPx = (state.strokeWidthPt * PT_TO_PX) * scaleFactor;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
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

        // Ajuste de altura
        const totalTextHeight = (rawLines.length - 1) * lineHeight + fontSizePx;
        if (totalTextHeight > availableHeight - (16 * scaleFactor)) {
          const scale = (availableHeight - (16 * scaleFactor)) / totalTextHeight;
          fontSizePx = Math.floor(fontSizePx * scale);
          lineHeight = fontSizePx * 1.14;
        }

        // Establecer fuente final
        ctx.font = `${fontSizePx}px "Architects Daughter", cursive, sans-serif`;

        const totalBlockH = (rawLines.length - 1) * lineHeight;
        const startY = centerY - (totalBlockH / 2);

        // Dibujar líneas
        rawLines.forEach((line, index) => {
          const lineY = startY + (index * lineHeight);

          // 1. Sombra exterior + Contorno negro
          ctx.save();
          if (state.shadowIntensity > 0) {
            ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.shadowBlur = shadowBlur * scaleFactor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = shadowOffsetY * scaleFactor;
          }
          if (strokeWidthPx > 0) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = strokeWidthPx * 2;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, centerX, lineY);
          }
          ctx.restore();

          // Sombra reforzada si > 120%
          if (state.shadowIntensity > 1.2 && strokeWidthPx > 0) {
            ctx.save();
            ctx.shadowColor = `rgba(0, 0, 0, ${Math.min(1, (state.shadowIntensity - 1) * 0.8)})`;
            ctx.shadowBlur = (shadowBlur * 1.3) * scaleFactor;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = shadowOffsetY * scaleFactor;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = strokeWidthPx * 2;
            ctx.strokeText(line, centerX, lineY);
            ctx.restore();
          }

          // 2. Relleno blanco nítido encima
          ctx.fillStyle = '#ffffff';
          ctx.fillText(line, centerX, lineY);
        });
      }
    }

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
 * Cambia la vista a un mes y año concretos
 */
function setMonthView(year, monthIndex) {
  state.viewYear = year;
  state.viewMonthIndex = monthIndex;
  state.isSpecial = false;

  const monthName = MESES[monthIndex];
  state.selectedFondo = monthName.toLowerCase();
  state.text = `${monthName} ${year}`;

  elements.bannerText.value = state.text;
  elements.currentFondoLabel.textContent = `${state.selectedFondo}.png`;
  updateActiveFondoCard();
  triggerRender();
}

/**
 * Cambia la vista al modo Geodesafío Especial
 */
function setSpecialView() {
  state.isSpecial = true;
  state.selectedFondo = 'especial';
  state.text = 'Geodesafío especial';

  elements.bannerText.value = state.text;
  elements.currentFondoLabel.textContent = 'especial.png';
  updateActiveFondoCard();
  triggerRender();
}

/**
 * Comprueba si el texto y fondo actuales coinciden con el estándar de un mes
 */
function isStandardMonthView() {
  if (state.isSpecial) return false;
  if (state.viewMonthIndex === undefined || state.viewYear === undefined) return false;
  const expectedText = `${MESES[state.viewMonthIndex]} ${state.viewYear}`;
  const expectedFondo = MESES[state.viewMonthIndex].toLowerCase();
  return (
    state.text.trim().toLowerCase() === expectedText.toLowerCase() &&
    state.selectedFondo === expectedFondo
  );
}

/**
 * Actualiza la miniatura activa en la cuadrícula de fondos
 */
function updateActiveFondoCard() {
  document.querySelectorAll('.fondo-card').forEach(card => {
    if (card.dataset.id === state.selectedFondo) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
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
    if (fondo.grayscale) {
      img.style.filter = 'grayscale(100%)';
    }

    const label = document.createElement('span');
    label.className = 'fondo-name';
    label.textContent = fondo.name;

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener('click', () => {
      if (state.selectedFondo === fondo.id) return;
      state.selectedFondo = fondo.id;
      
      if (fondo.id === 'especial') {
        state.isSpecial = true;
        state.text = 'Geodesafío especial';
        elements.bannerText.value = state.text;
      } else if (fondo.id === 'gris') {
        state.isSpecial = true;
      } else {
        state.isSpecial = false;
        const idx = MESES.findIndex(m => m.toLowerCase() === fondo.id);
        if (idx !== -1) {
          state.viewMonthIndex = idx;
          state.text = `${MESES[idx]} ${state.viewYear}`;
          elements.bannerText.value = state.text;
        }
      }

      updateActiveFondoCard();
      elements.currentFondoLabel.textContent = fondo.id === 'gris' ? 'septiembre (gris)' : `${fondo.id}.png`;

      triggerRender();
    });

    elements.fondosGrid.appendChild(card);
  });
}

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
 * Abre el modal Lightbox mostrando la imagen a tamaño real (1:1)
 */
function openRealSizeModal() {
  try {
    const dataUrl = elements.canvas.toDataURL('image/png');
    elements.modalRealImage.src = dataUrl;
    elements.modalLightbox.classList.add('open');
    elements.modalLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    console.warn('Error al generar vista modal:', err);
    if (window.location.protocol === 'file:') {
      handleLocalSecurityNotice();
    }
  }
}

/**
 * Cierra el modal Lightbox
 */
function closeRealSizeModal() {
  elements.modalLightbox.classList.remove('open');
  elements.modalLightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Actualiza la interfaz según el modo de composición seleccionado
 */
function updateModeUI() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
  });

  const hideTextControls = (state.mode === 'logo-only' || state.mode === 'bg-only');
  if (elements.textInputWrapper) {
    elements.textInputWrapper.style.opacity = hideTextControls ? '0.4' : '1';
    elements.textInputWrapper.style.pointerEvents = hideTextControls ? 'none' : 'auto';
  }
  if (elements.quickNavContainer) {
    elements.quickNavContainer.style.opacity = hideTextControls ? '0.4' : '1';
    elements.quickNavContainer.style.pointerEvents = hideTextControls ? 'none' : 'auto';
  }
  if (elements.fontSizeItem) {
    elements.fontSizeItem.style.display = hideTextControls ? 'none' : 'flex';
  }
  if (elements.strokeWidthItem) {
    elements.strokeWidthItem.style.display = hideTextControls ? 'none' : 'flex';
  }
}

/**
 * Lee la configuración personal guardada en localStorage
 */
function getPersonalDefaults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error al leer de localStorage:', e);
  }
  return null;
}

/**
 * Guarda los valores actuales como predeterminados personales del usuario
 */
function savePersonalDefaults() {
  const custom = {
    fontSizePt: state.fontSizePt,
    strokeWidthPt: state.strokeWidthPt,
    bgYPercent: state.bgYPercent,
    shadowIntensity: state.shadowIntensity,
    canvasWidth: state.canvasWidth,
    canvasHeight: state.canvasHeight,
    mode: state.mode
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    updatePersonalDefaultsUIState();
    showToast('💾 ¡Ajustes guardados como tus predeterminados!', 'success');
  } catch (e) {
    console.error('Error al guardar en localStorage:', e);
    showToast('No se pudo guardar la configuración en este navegador', 'error');
  }
}

/**
 * Aplica un conjunto de configuración (personal o de fábrica) a la app
 */
function applySettings(config, toastMsg = null) {
  state.fontSizePt = config.fontSizePt !== undefined ? config.fontSizePt : 65;
  state.strokeWidthPt = config.strokeWidthPt !== undefined ? config.strokeWidthPt : 2;
  state.bgYPercent = config.bgYPercent !== undefined ? config.bgYPercent : 50;
  state.shadowIntensity = config.shadowIntensity !== undefined ? config.shadowIntensity : 1.2;
  state.canvasWidth = config.canvasWidth !== undefined ? config.canvasWidth : 800;
  state.canvasHeight = config.canvasHeight !== undefined ? config.canvasHeight : 400;
  state.mode = config.mode || 'full';

  // Sincronizar sliders y controles
  if (elements.fontSizeRange) {
    elements.fontSizeRange.value = state.fontSizePt;
    elements.fontSizeVal.textContent = `${state.fontSizePt} pt`;
  }
  if (elements.strokeWidthRange) {
    elements.strokeWidthRange.value = state.strokeWidthPt;
    elements.strokeWidthVal.textContent = `${state.strokeWidthPt} pt`;
  }
  if (elements.bgYRange) {
    elements.bgYRange.value = state.bgYPercent;
    elements.bgYVal.textContent = state.bgYPercent === 50 ? 'Centro (50%)' : `${state.bgYPercent}%`;
  }
  if (elements.shadowRange) {
    const shadowPercent = Math.round(state.shadowIntensity * 100);
    elements.shadowRange.value = shadowPercent;
    elements.shadowVal.textContent = `${shadowPercent}%`;
  }
  if (elements.customWidth) {
    elements.customWidth.value = state.canvasWidth;
  }
  if (elements.customHeight) {
    elements.customHeight.value = state.canvasHeight;
  }
  if (elements.dimChips) {
    elements.dimChips.forEach(chip => {
      const cw = parseInt(chip.dataset.w, 10);
      const ch = parseInt(chip.dataset.h, 10);
      chip.classList.toggle('active', cw === state.canvasWidth && ch === state.canvasHeight);
    });
  }

  updateModeUI();
  triggerRender();
  if (toastMsg) {
    showToast(toastMsg, 'success');
  }
}

/**
 * Actualiza el estado visual de los botones de predeterminados personales
 */
function updatePersonalDefaultsUIState() {
  const saved = getPersonalDefaults();
  if (elements.savedBadge) {
    elements.savedBadge.style.display = saved ? 'inline-block' : 'none';
  }
  if (elements.btnLoadPersonalDefaults) {
    elements.btnLoadPersonalDefaults.disabled = !saved;
    if (saved) {
      elements.btnLoadPersonalDefaults.title = `Cargar ajustes guardados (${saved.canvasWidth}x${saved.canvasHeight}, ${saved.fontSizePt}pt, ${Math.round(saved.shadowIntensity*100)}% sombra)`;
    } else {
      elements.btnLoadPersonalDefaults.title = 'Aún no has guardado ninguna configuración personal';
    }
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

  // Selector de Modo de Composición
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (state.mode === mode) return;
      state.mode = mode;
      updateModeUI();
      triggerRender();
    });
  });

  // Botón: Mes anterior
  if (elements.btnPrevMonth) {
    elements.btnPrevMonth.addEventListener('click', () => {
      if (isStandardMonthView()) {
        let m = state.viewMonthIndex - 1;
        let y = state.viewYear;
        if (m < 0) {
          m = 11;
          y--;
        }
        setMonthView(y, m);
      } else {
        const now = new Date();
        let m = now.getMonth() - 1;
        let y = now.getFullYear();
        if (m < 0) {
          m = 11;
          y--;
        }
        setMonthView(y, m);
      }
    });
  }

  // Botón: Mes actual
  if (elements.btnCurrentMonth) {
    elements.btnCurrentMonth.addEventListener('click', () => {
      const now = new Date();
      setMonthView(now.getFullYear(), now.getMonth());
    });
  }

  // Botón: Mes posterior
  if (elements.btnNextMonth) {
    elements.btnNextMonth.addEventListener('click', () => {
      if (isStandardMonthView()) {
        let m = state.viewMonthIndex + 1;
        let y = state.viewYear;
        if (m > 11) {
          m = 0;
          y++;
        }
        setMonthView(y, m);
      } else {
        const now = new Date();
        let m = now.getMonth() + 1;
        let y = now.getFullYear();
        if (m > 11) {
          m = 0;
          y++;
        }
        setMonthView(y, m);
      }
    });
  }

  // Botón: Geodesafío especial
  if (elements.btnSpecial) {
    elements.btnSpecial.addEventListener('click', () => {
      setSpecialView();
    });
  }

  // Dimensiones predefinidas
  elements.dimChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const w = parseInt(chip.dataset.w, 10);
      const h = parseInt(chip.dataset.h, 10);
      state.canvasWidth = w;
      state.canvasHeight = h;
      elements.customWidth.value = w;
      elements.customHeight.value = h;
      elements.dimChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      triggerRender();
    });
  });

  // Dimensiones personalizadas (inputs)
  const handleCustomDimChange = () => {
    let w = parseInt(elements.customWidth.value, 10) || 800;
    let h = parseInt(elements.customHeight.value, 10) || 400;
    w = Math.max(200, Math.min(3840, w));
    h = Math.max(200, Math.min(3840, h));
    state.canvasWidth = w;
    state.canvasHeight = h;

    elements.dimChips.forEach(chip => {
      const cw = parseInt(chip.dataset.w, 10);
      const ch = parseInt(chip.dataset.h, 10);
      chip.classList.toggle('active', cw === w && ch === h);
    });

    triggerRender();
  };

  elements.customWidth.addEventListener('input', handleCustomDimChange);
  elements.customHeight.addEventListener('input', handleCustomDimChange);

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

  // Restablecer a valores de fábrica
  if (elements.btnResetSettings) {
    elements.btnResetSettings.addEventListener('click', () => {
      applySettings(FACTORY_DEFAULTS, '🔄 Valores de fábrica restablecidos (800x400, 65 pt, 120% sombra)');
    });
  }

  // Guardar predeterminados personales
  if (elements.btnSavePersonalDefaults) {
    elements.btnSavePersonalDefaults.addEventListener('click', savePersonalDefaults);
  }

  // Cargar predeterminados personales
  if (elements.btnLoadPersonalDefaults) {
    elements.btnLoadPersonalDefaults.addEventListener('click', () => {
      const saved = getPersonalDefaults();
      if (saved) {
        applySettings(saved, '⭐ Mis predeterminados personales aplicados');
      } else {
        showToast('No tienes ningún ajuste personal guardado todavía. Pulsa "Guardar mis predeterminados".', 'error');
      }
    });
  }

  // Botón Descargar
  elements.btnDownload.addEventListener('click', downloadImage);

  // Botón Copiar al portapapeles
  elements.btnCopyClipboard.addEventListener('click', copyToClipboard);

  // Modal Lightbox
  if (elements.canvasWrapper) {
    elements.canvasWrapper.addEventListener('click', openRealSizeModal);
  }
  if (elements.btnOpenModal) {
    elements.btnOpenModal.addEventListener('click', (e) => {
      e.stopPropagation();
      openRealSizeModal();
    });
  }
  if (elements.btnCloseModal) {
    elements.btnCloseModal.addEventListener('click', closeRealSizeModal);
  }
  if (elements.btnModalCloseAction) {
    elements.btnModalCloseAction.addEventListener('click', closeRealSizeModal);
  }
  if (elements.btnModalDownload) {
    elements.btnModalDownload.addEventListener('click', downloadImage);
  }
  if (elements.modalLightbox) {
    elements.modalLightbox.addEventListener('click', (e) => {
      if (e.target === elements.modalLightbox) closeRealSizeModal();
    });
  }

  // Cerrar modal con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modalLightbox.classList.contains('open')) {
      closeRealSizeModal();
    }
  });
}

/**
 * Inicialización general de la app
 */
async function init() {
  elements.ctx = elements.canvas.getContext('2d');
  
  elements.bannerText.value = state.text;
  elements.currentFondoLabel.textContent = `${state.selectedFondo}.png`;

  buildFondosGrid();
  attachEventListeners();
  updatePersonalDefaultsUIState();

  // Si el usuario ya guardó sus predeterminados personales en este navegador, aplicarlos al iniciar
  const userDefaults = getPersonalDefaults();
  if (userDefaults) {
    applySettings(userDefaults);
  } else {
    updateModeUI();
  }

  updateFilenamePreview();

  // Render inicial inmediato
  triggerRender();

  // Escuchar cuando las fuentes del sistema/Google Fonts terminen de cargar
  if (document.fonts) {
    document.fonts.ready.then(() => {
      triggerRender();
    });
  }

  // Cargar recursos visuales iniciales y actualizar render
  const currentFondoObj = FONDOS.find(f => f.id === state.selectedFondo) || FONDOS[0];
  Promise.all([
    loadImage('logo.png'),
    loadImage(currentFondoObj.file)
  ]).then(() => {
    triggerRender();
  }).catch((err) => {
    console.warn('Advertencia al cargar recursos iniciales:', err);
    triggerRender();
  });

  // Precarga perezosa del resto de fondos para navegación instantánea
  setTimeout(() => {
    FONDOS.forEach(f => {
      if (f.id !== state.selectedFondo) loadImage(f.file).catch(() => {});
    });
  }, 500);
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
