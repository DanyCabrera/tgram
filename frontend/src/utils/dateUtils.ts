/**
 * Utilidades para formatear fechas y horas
 */

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return '--:--';
  }
  
  // Debug: mostrar información de la fecha (comentado para producción)
  // console.log('🕐 Formateando hora:', {
  //   input: dateString,
  //   parsed: date.toISOString(),
  //   local: date.toLocaleString('es-ES'),
  //   timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  // });
  
  // Usar la zona horaria local del navegador
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Comparar fechas en la zona horaria local
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  if (dateStr === todayStr) {
    return 'Hoy';
  } else if (dateStr === yesterdayStr) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit'
    });
  }
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }
  
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City'
  });
};

export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.toDateString() === today.toDateString();
};

export const isYesterday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date.toDateString() === yesterday.toDateString();
};
