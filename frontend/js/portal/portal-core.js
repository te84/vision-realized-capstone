/* ── Portal Core — globals, utilities, tab switching ─────────────── */
var API = "http://localhost:5001";
var user = JSON.parse(localStorage.getItem("user"));
var token = localStorage.getItem("token");
var currentEventId = null;
var allEventsData = [];
var _lang = localStorage.getItem('lang') || 'en';

var _t = {
  en: {
    quoteSubmitted: 'Quote Request Submitted', pendingConsult: 'Pending Consultation',
    consultation: 'Consultation', planning: 'Planning', vendorsSet: 'Vendors Set',
    eventDay: 'Event Day', completed: 'Completed',
    eventJourney: 'EVENT JOURNEY', whatsNext: "WHAT'S NEXT",
    myTasks: 'MY TASKS', recentMessages: 'RECENT MESSAGES',
    noTasks: 'No tasks assigned yet.', noMessages: 'No messages yet.',
    noMsgsYet: 'No messages yet. Your planner will reach out here once your event is being planned.',
    whatsNextQuote: 'We received your quote request! Our team is reviewing your event details and will reach out to schedule a consultation.',
    whatsNextPending: "We'd like to schedule a consultation with you! Please pick a time that works from the options above.",
    whatsNextConsult: 'Your consultation is confirmed! Check your <strong>Tasks</strong> for the scheduled date and time.',
    whatsNextPlanning: 'Your event is being planned! Your planner is coordinating vendors, venue, and logistics. Check your <strong>Tasks</strong> for anything that needs your input.',
    whatsNextVendors: 'All vendors are booked and confirmed! Reach out to your planner with any questions.',
    whatsNextEventDay: 'Today is the day! Our team is handling everything on-site. Relax and enjoy your event.',
    whatsNextCompleted: "Your event is complete! We'd love to hear your feedback.",
    viewTasks: 'View My Tasks', msgPlanner: 'Message Planner', leaveReview: 'Leave a Review',
    consultRequest: 'Consultation Request', proposedDate: 'Proposed date:',
    pickTime: 'Select a time that works best:', noneWork: 'None of these work for me',
    send: 'Send', due: 'Due', guests: 'Guests', daysAway: 'DAYS AWAY'
  },
  es: {
    quoteSubmitted: 'Solicitud Enviada', pendingConsult: 'Consulta Pendiente',
    consultation: 'Consulta', planning: 'Planificación', vendorsSet: 'Proveedores Confirmados',
    eventDay: 'Día del Evento', completed: 'Completado',
    eventJourney: 'PROGRESO DEL EVENTO', whatsNext: 'PRÓXIMOS PASOS',
    myTasks: 'MIS TAREAS', recentMessages: 'MENSAJES RECIENTES',
    noTasks: 'No hay tareas asignadas aún.', noMessages: 'No hay mensajes aún.',
    noMsgsYet: 'No hay mensajes aún. Su planificador se comunicará aquí una vez que se esté planificando su evento.',
    whatsNextQuote: '¡Recibimos su solicitud! Nuestro equipo está revisando los detalles y se comunicará para programar una consulta.',
    whatsNextPending: '¡Nos gustaría programar una consulta con usted! Elija un horario que le funcione de las opciones de arriba.',
    whatsNextConsult: '¡Su consulta está confirmada! Revise sus <strong>Tareas</strong> para la fecha y hora programadas.',
    whatsNextPlanning: '¡Su evento está siendo planificado! Su planificador está coordinando proveedores, lugar y logística.',
    whatsNextVendors: '¡Todos los proveedores están reservados y confirmados! Comuníquese con su planificador con cualquier pregunta.',
    whatsNextEventDay: '¡Hoy es el día! Nuestro equipo se encarga de todo en el lugar. Relájese y disfrute.',
    whatsNextCompleted: '¡Su evento está completo! Nos encantaría escuchar su opinión.',
    viewTasks: 'Ver Mis Tareas', msgPlanner: 'Mensaje al Planificador', leaveReview: 'Dejar Reseña',
    consultRequest: 'Solicitud de Consulta', proposedDate: 'Fecha propuesta:',
    pickTime: 'Seleccione un horario:', noneWork: 'Ninguno me funciona',
    send: 'Enviar', due: 'Vence', guests: 'Invitados', daysAway: 'DÍAS RESTANTES'
  }
};

function t(key) { return (_t[_lang] && _t[_lang][key]) || (_t.en[key]) || key; }

if (!user || !token) window.location.href = "login.html";

if (user) {
  var navEl = document.querySelector(".nav-portal");
  navEl.textContent = user.firstname + "'s Portal";
  navEl.href = "portal.html";
}

function switchTab(el, id) {
  var items = document.querySelectorAll(".portal-nav-item");
  for (var i = 0; i < items.length; i++)
    items[i].classList.remove("active");
  if (el) el.classList.add("active");
  var tabIds = ['tab-overview','tab-progress','tab-checklist','tab-messages','tab-invoices','tab-after'];
  for (var i = 0; i < tabIds.length; i++) {
    var t = document.getElementById(tabIds[i]);
    if (t) t.style.display = 'none';
  }
  document.getElementById(id).style.display = "block";
  localStorage.setItem('portal_active_tab', id);
  window.scrollTo(0, 0);
  if (id === 'tab-messages' && currentEventId) {
    fetch(API + "/client/messages/" + currentEventId + "/read", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token },
    }).then(function() {
      var badge = document.getElementById("msg-badge");
      if (badge) { badge.style.display = "none"; badge.textContent = "0"; }
    });
  }
  if (id === 'tab-after') {
    loadExistingRating();
  }
  if (id === 'tab-invoices' && currentEventId) {
    loadInvoices(currentEventId);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../index.html";
}

function statusLabel(s) {
  var map = {
    'Quote Submitted': t('quoteSubmitted'),
    'Pending Consultation': t('pendingConsult'),
    'Consultation': t('consultation'),
    'Planning': t('planning'),
    'Vendors Set': t('vendorsSet'),
    'Event Day': t('eventDay'),
    'Completed': t('completed')
  };
  return map[s] || s;
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function daysUntil(d) {
  if (!d) return null;
  var ev = new Date(d + "T00:00:00");
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((ev - now) / 86400000);
}

function fmtDate(d) {
  if (!d) return "TBD";
  var dt = new Date(d + "T00:00:00");
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear();
}

function fmtMsgDate(d) {
  if (!d) return '';
  var dt = new Date(d.replace(' ', 'T') + 'Z');
  if (isNaN(dt.getTime())) return d;
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var h = dt.getHours(); var m = dt.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  var min = m < 10 ? '0' + m : m;
  return months[dt.getMonth()] + ' ' + (dt.getDate() < 10 ? '0' : '') + dt.getDate() + ', ' + dt.getFullYear() + ' at ' + (h < 10 ? '0' : '') + h + ':' + min + ' ' + ampm;
}
