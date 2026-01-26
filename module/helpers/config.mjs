export const RYF = {};

RYF.attributes = {
  fisico: "RYF.Attributes.Fisico",
  destreza: "RYF.Attributes.Destreza",
  inteligencia: "RYF.Attributes.Inteligencia",
  percepcion: "RYF.Attributes.Percepcion",
  carisma: "RYF.Attributes.Carisma"
};

RYF.baseSkills = {
  acrobacias: { label: "RYF.Skills.Acrobacias", attribute: "destreza" },
  alerta: { label: "RYF.Skills.Alerta", attribute: "percepcion" },
  armasBlancas: { label: "RYF.Skills.ArmasBlancas", attribute: "fisico" },
  armasDistancia: { label: "RYF.Skills.ArmasDistancia", attribute: "destreza" },
  armasFuego: { label: "RYF.Skills.ArmasFuego", attribute: "destreza" },
  atletismo: { label: "RYF.Skills.Atletismo", attribute: "fisico" },
  buscar: { label: "RYF.Skills.Buscar", attribute: "percepcion" },
  callejeo: { label: "RYF.Skills.Callejeo", attribute: "inteligencia" },
  ciencias: { label: "RYF.Skills.Ciencias", attribute: "inteligencia" },
  conducir: { label: "RYF.Skills.Conducir", attribute: "destreza" },
  conocimiento: { label: "RYF.Skills.Conocimiento", attribute: "inteligencia" },
  descubrir: { label: "RYF.Skills.Descubrir", attribute: "percepcion" },
  disfraz: { label: "RYF.Skills.Disfraz", attribute: "inteligencia" },
  empatia: { label: "RYF.Skills.Empatia", attribute: "percepcion" },
  equitacion: { label: "RYF.Skills.Equitacion", attribute: "destreza" },
  escalar: { label: "RYF.Skills.Escalar", attribute: "fisico" },
  esconderse: { label: "RYF.Skills.Esconderse", attribute: "destreza" },
  esquivar: { label: "RYF.Skills.Esquivar", attribute: "destreza" },
  fortaleza: { label: "RYF.Skills.Fortaleza", attribute: "fisico" },
  humanidades: { label: "RYF.Skills.Humanidades", attribute: "inteligencia" },
  idiomas: { label: "RYF.Skills.Idiomas", attribute: "inteligencia" },
  informatica: { label: "RYF.Skills.Informatica", attribute: "inteligencia" },
  juego: { label: "RYF.Skills.Juego", attribute: "inteligencia" },
  latrocinio: { label: "RYF.Skills.Latrocinio", attribute: "destreza" },
  medicina: { label: "RYF.Skills.Medicina", attribute: "inteligencia" },
  nadar: { label: "RYF.Skills.Nadar", attribute: "fisico" },
  navegacion: { label: "RYF.Skills.Navegacion", attribute: "inteligencia" },
  ocultismo: { label: "RYF.Skills.Ocultismo", attribute: "inteligencia" },
  oficio: { label: "RYF.Skills.Oficio", attribute: "inteligencia" },
  pelea: { label: "RYF.Skills.Pelea", attribute: "fisico" },
  pilotar: { label: "RYF.Skills.Pilotar", attribute: "destreza" },
  primAuxilios: { label: "RYF.Skills.PrimAuxilios", attribute: "inteligencia" },
  rastrear: { label: "RYF.Skills.Rastrear", attribute: "percepcion" },
  reflejos: { label: "RYF.Skills.Reflejos", attribute: "destreza" },
  sigilo: { label: "RYF.Skills.Sigilo", attribute: "destreza" },
  subterfugio: { label: "RYF.Skills.Subterfugio", attribute: "inteligencia" },
  supervivencia: { label: "RYF.Skills.Supervivencia", attribute: "percepcion" },
  trato: { label: "RYF.Skills.Trato", attribute: "inteligencia" },
  voluntad: { label: "RYF.Skills.Voluntad", attribute: "inteligencia" }
};

RYF.socialSkills = {
  amenazar: { label: "RYF.Skills.Amenazar", attribute: "carisma" },
  interrogar: { label: "RYF.Skills.Interrogar", attribute: "carisma" },
  labia: { label: "RYF.Skills.Labia", attribute: "carisma" },
  liderazgo: { label: "RYF.Skills.Liderazgo", attribute: "carisma" },
  regatear: { label: "RYF.Skills.Regatear", attribute: "carisma" },
  seducir: { label: "RYF.Skills.Seducir", attribute: "carisma" }
};

RYF.skillPyramids = {
  specialistHeroic: [
    { level: 6, count: 1 },
    { level: 5, count: 3 },
    { level: 4, count: 3 },
    { level: 3, count: 3 },
    { level: 2, count: 3 },
    { level: 1, count: 3 }
  ],
  versatileHeroic: [
    { level: 6, count: 1 },
    { level: 5, count: 2 },
    { level: 4, count: 3 },
    { level: 3, count: 4 },
    { level: 2, count: 5 },
    { level: 1, count: 6 }
  ],
  specialistRealistic: [
    { level: 5, count: 2 },
    { level: 4, count: 2 },
    { level: 3, count: 2 },
    { level: 2, count: 2 },
    { level: 1, count: 2 }
  ],
  versatileRealistic: [
    { level: 5, count: 1 },
    { level: 4, count: 2 },
    { level: 3, count: 3 },
    { level: 2, count: 4 },
    { level: 1, count: 5 }
  ]
};

RYF.isCarismaEnabled = function() {
  return game.settings.get('ryf3', 'enableCarisma');
};

RYF.isMagicEnabled = function() {
  return game.settings.get('ryf3', 'enableMagia');
};

RYF.getHealthMultiplier = function() {
  return game.settings.get('ryf3', 'healthMultiplier');
};

RYF.getManaMultiplier = function() {
  return game.settings.get('ryf3', 'manaMultiplier');
};

RYF.getAttributePoints = function() {
  return game.settings.get('ryf3', 'attributePoints');
};

RYF.getActiveAttributes = function() {
  const attrs = {
    fisico: "RYF.Attributes.Fisico",
    destreza: "RYF.Attributes.Destreza",
    inteligencia: "RYF.Attributes.Inteligencia",
    percepcion: "RYF.Attributes.Percepcion"
  };
  
  if (RYF.isCarismaEnabled()) {
    attrs.carisma = "RYF.Attributes.Carisma";
  }
  
  return attrs;
};

RYF.getAvailableSkills = function() {
  const skills = { ...RYF.baseSkills };
  
  if (RYF.isCarismaEnabled()) {
    Object.assign(skills, RYF.socialSkills);
  }
  
  return skills;
};

RYF.getActivePyramid = function() {
  const type = game.settings.get('ryf3', 'defaultCharacterType');
  
  if (type === 'custom') {
    const custom = game.settings.get('ryf3', 'customPyramid');
    const pyramid = [];
    
    if (custom.level6 > 0) pyramid.push({ level: 6, count: custom.level6 });
    if (custom.level5 > 0) pyramid.push({ level: 5, count: custom.level5 });
    if (custom.level4 > 0) pyramid.push({ level: 4, count: custom.level4 });
    if (custom.level3 > 0) pyramid.push({ level: 3, count: custom.level3 });
    if (custom.level2 > 0) pyramid.push({ level: 2, count: custom.level2 });
    if (custom.level1 > 0) pyramid.push({ level: 1, count: custom.level1 });
    
    return pyramid;
  }
  
  return RYF.skillPyramids[type] || RYF.skillPyramids.specialistHeroic;
};

